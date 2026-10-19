import fs from "node:fs";
import path from "node:path";
import "regenerator-runtime/runtime.js";
import fontkit from "@pdf-lib/fontkit";
import puppeteer from "puppeteer";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  arabicFontCandidates,
  assetsRoot,
  exportsRoot,
  devanagariFontCandidates,
  kannadaFontCandidates,
  universalUnicodeFontCandidates,
  uploadsRoot
} from "./config.js";
import { catalogTemplate } from "./sampleCatalog.js";
import {
  getTemplateById,
  resolveTemplateBackgroundPath
} from "./templateStore.js";

function resolveTemplate(version) {
  return getTemplateById(version?.catalog?.templateId) || catalogTemplate;
}

function isTranslatedLanguage(language) {
  return Boolean(language) && String(language).toLowerCase() !== "english";
}

function getFitLevel(catalog) {
  const rawValue = Number(catalog?.layoutSettings?.fitLevel || 0);
  return Math.max(0, Math.min(4, Number.isFinite(rawValue) ? Math.trunc(rawValue) : 0));
}

function getTemplatePageSize(template) {
  const width = Number(template?.pageSize?.width);
  const height = Number(template?.pageSize?.height);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return catalogTemplate.pageSize;
  }

  return { width, height };
}

function normalizeTemplateRegionPage(page, fallback = "page1") {
  const normalized = String(page || fallback).toLowerCase();
  return ["page1", "page2", "page3", "page4"].includes(normalized) ? normalized : fallback;
}

function getTemplatePageIds(template) {
  return ["page1", "page2", "page3", "page4"].filter((pageId) => template?.[pageId]?.background);
}

function getTemplatePageNumber(pageId) {
  return Math.max(1, Number.parseInt(String(pageId).replace("page", ""), 10) || 1);
}

function toPdfY(pageSize, top, height = 0) {
  return pageSize.height - top - height;
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const int = Number.parseInt(normalized, 16);
  return rgb(
    ((int >> 16) & 255) / 255,
    ((int >> 8) & 255) / 255,
    (int & 255) / 255
  );
}

async function loadImage(pdfDoc, imagePath) {
  const bytes = fs.readFileSync(imagePath);
  if (imagePath.toLowerCase().endsWith(".png")) {
    return pdfDoc.embedPng(bytes);
  }
  return pdfDoc.embedJpg(bytes);
}

function resolveHeroImagePath(version, template) {
  const heroPath = version?.catalog?.heroOverlayImage || template?.page1?.heroOverlay?.placeholderImage || null;
  if (!heroPath) {
    return null;
  }

  if (heroPath.startsWith("/api/uploads/")) {
    return path.join(uploadsRoot, path.basename(heroPath));
  }

  return resolveTemplateBackgroundPath(heroPath);
}

function wrapText(text, maxChars) {
  const lines = [];
  const paragraphs = String(text || "").split(/\r?\n/);

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let current = "";

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length <= maxChars) {
        current = candidate;
      } else {
        if (current) {
          lines.push(current);
        }
        current = word;
      }
    }

    if (current) {
      lines.push(current);
    }
  }

  return lines.length ? lines : [""];
}

function drawTextWithFallback(page, text, {
  x,
  y,
  size,
  font,
  fallbackFont = null,
  color
}) {
  if (!fallbackFont || fallbackFont === font) {
    page.drawText(String(text || ""), { x, y, size, font, color });
    return;
  }

  const runs = [];
  for (const character of Array.from(String(text || ""))) {
    const runFont = character.codePointAt(0) <= 0xff ? fallbackFont : font;
    const lastRun = runs[runs.length - 1];
    if (lastRun?.font === runFont) {
      lastRun.text += character;
    } else {
      runs.push({ text: character, font: runFont });
    }
  }

  let cursorX = x;
  for (const run of runs) {
    page.drawText(run.text, { x: cursorX, y, size, font: run.font, color });
    cursorX += run.font.widthOfTextAtSize(run.text, size);
  }
}

function drawWrappedText(page, font, text, {
  pageSize,
  x,
  top,
  width,
  fontSize,
  lineHeight,
  color,
  maxLines,
  fallbackFont = null
}) {
  const approxChars = Math.max(10, Math.floor(width / (fontSize * 0.53)));
  const lines = wrapText(text, approxChars).slice(0, maxLines);
  lines.forEach((line, index) => {
    drawTextWithFallback(page, line, {
      x,
      y: toPdfY(pageSize, top + index * lineHeight, fontSize),
      size: fontSize,
      font,
      fallbackFont,
      color
    });
  });
}

function getVisibleListItemsForRegion(items, region, typography, reservedBottom = 16) {
  const availableHeight = region.height - (typography.titleTop + 18) - reservedBottom;
  let consumed = 0;
  const visibleItems = [];

  for (const item of items) {
    const lineCount = estimateWrappedLineCount(`- ${item}`, region.width - 20, typography.fontSize, typography.maxLines);
    const itemHeight = lineCount * typography.lineHeight + typography.gap;

    if (visibleItems.length > 0 && consumed + itemHeight > availableHeight) {
      break;
    }

    visibleItems.push(item);
    consumed += itemHeight;
  }

  return {
    visibleItems,
    hiddenCount: Math.max(0, items.length - visibleItems.length)
  };
}

function estimateWrappedLineCount(text, width, fontSize, maxLines = Number.POSITIVE_INFINITY) {
  const approxChars = Math.max(10, Math.floor(width / (fontSize * 0.53)));
  return Math.min(wrapText(text, approxChars).length, maxLines);
}

function resolveListTypography(items, region, catalog) {
  const fitLevel = getFitLevel(catalog);
  const attempts = [
    { titleSize: 13, titleTop: 18, fontSize: 8.1, lineHeight: 9.4, gap: 4, maxLines: 2 },
    { titleSize: 12, titleTop: 16, fontSize: 7.4, lineHeight: 8.5, gap: 4, maxLines: 2 },
    { titleSize: 11, titleTop: 15, fontSize: 6.8, lineHeight: 7.8, gap: 3, maxLines: 2 },
    { titleSize: 10, titleTop: 14, fontSize: 6.3, lineHeight: 7.2, gap: 3, maxLines: 2 },
    { titleSize: 9.5, titleTop: 13, fontSize: 5.8, lineHeight: 6.7, gap: 2, maxLines: 2 },
    ...(isTranslatedLanguage(catalog?.language)
      ? [{ titleSize: 9, titleTop: 12, fontSize: 5.5, lineHeight: 6.4, gap: 2, maxLines: 2 }]
      : []),
    ...(region.compact
      ? [{ titleSize: 8.6, titleTop: 11, fontSize: 5, lineHeight: 5.7, gap: 0.8, maxLines: 2 }]
      : []),
    ...(fitLevel >= 1
      ? [{ titleSize: 8.6, titleTop: 12, fontSize: 5.2, lineHeight: 6, gap: 1.8, maxLines: 2 }]
      : []),
    ...(fitLevel >= 2
      ? [{ titleSize: 8.1, titleTop: 11, fontSize: 4.9, lineHeight: 5.6, gap: 1.4, maxLines: 1 }]
      : []),
    ...(fitLevel >= 3
      ? [{ titleSize: 7.8, titleTop: 10, fontSize: 4.6, lineHeight: 5.3, gap: 1.1, maxLines: 1 }]
      : []),
    ...(fitLevel >= 4
      ? [{ titleSize: 7, titleTop: 7, fontSize: 3.9, lineHeight: 4.4, gap: 0.4, maxLines: 1 }]
      : [])
  ];

  for (const attempt of attempts) {
    let requiredHeight = attempt.titleTop + 18;
    for (const item of items) {
      const lineCount = estimateWrappedLineCount(`- ${item}`, region.width - 20, attempt.fontSize, attempt.maxLines);
      requiredHeight += lineCount * attempt.lineHeight + attempt.gap;
    }

    if (requiredHeight <= region.height - 8) {
      return attempt;
    }
  }

  return attempts[attempts.length - 1];
}

function drawListBlock(page, font, titleFont, title, items, region, catalog, pageSize, fallbackFont = null) {
  const textColor = hexToRgb(region.textColor || "#ffffff");
  const titleColor = hexToRgb(region.titleColor || region.textColor || "#ffffff");
  page.drawRectangle({
    x: region.x,
    y: toPdfY(pageSize, region.y, region.height),
    width: region.width,
    height: region.height,
    color: hexToRgb(region.background)
  });

  const typography = resolveListTypography(items.slice(0, 18), region, catalog);

  drawTextWithFallback(page, title, {
    x: region.x + 10,
    y: toPdfY(pageSize, region.y + typography.titleTop, typography.titleSize),
    size: typography.titleSize,
    font: titleFont,
    fallbackFont,
    color: titleColor
  });

  const fitLevel = getFitLevel(catalog);
  const reservedBottom = region.compact ? 4 : (fitLevel >= 4 ? 4 : fitLevel >= 3 ? 10 : 16);
  const { visibleItems, hiddenCount } = getVisibleListItemsForRegion(items.slice(0, 18), region, typography, reservedBottom);

  let top = region.y + typography.titleTop + 16;
  for (const item of visibleItems) {
    const lineCount = estimateWrappedLineCount(`- ${item}`, region.width - 20, typography.fontSize, typography.maxLines);
    drawWrappedText(page, font, `- ${item}`, {
      pageSize,
      x: region.x + 10,
      top,
      width: region.width - 20,
      fontSize: typography.fontSize,
      lineHeight: typography.lineHeight,
      color: textColor,
      maxLines: typography.maxLines,
      fallbackFont
    });
    top += lineCount * typography.lineHeight + typography.gap;
  }

  if (hiddenCount > 0) {
    drawTextWithFallback(page, `+ ${hiddenCount} more`, {
      x: region.x + 10,
      y: toPdfY(pageSize, region.y + region.height - 16, 8),
      size: 8,
      font,
      fallbackFont,
      color: textColor
    });
  }
}

function getUnicodeFontCandidates(language) {
  const normalized = String(language || "").trim().toLowerCase();

  if (normalized === "kannada") {
    return kannadaFontCandidates;
  }

  if (["dogri", "hindi", "konkani", "maithili", "marathi", "nepali", "sanskrit"].includes(normalized)) {
    return devanagariFontCandidates;
  }

  if (["arabic", "kashmiri", "sindhi", "urdu"].includes(normalized)) {
    return arabicFontCandidates;
  }

  return [...universalUnicodeFontCandidates, ...kannadaFontCandidates, ...devanagariFontCandidates];
}

async function embedUnicodeFont(pdfDoc, language) {
  const fontPath = getUnicodeFontCandidates(language).find((candidate) => candidate && fs.existsSync(candidate));
  if (!fontPath) {
    return null;
  }

  pdfDoc.registerFontkit(fontkit);
  const fontBytes = fs.readFileSync(fontPath);
  return pdfDoc.embedFont(fontBytes, { subset: false });
}

function getSpecMetrics(catalog) {
  const totalItems = catalog.specSections.reduce((count, section) => count + section.items.length, 0);
  const longestLabel = Math.max(
    ...catalog.specSections.flatMap((section) => section.items.map((item) => String(item.label).length)),
    0
  );
  const translated = isTranslatedLanguage(catalog.language);
  const fitLevel = getFitLevel(catalog);
  const score = totalItems + longestLabel / 10 + (translated ? 4 : 0);
  const shrinkBy = [0, 0.6, 1.1, 1.5, 1.8][fitLevel];
  const lineTightening = [0, 0.03, 0.06, 0.08, 0.1][fitLevel];

  let profile;
  if (score >= 36) {
    profile = { header: 12, section: 7.2, row: 5.4, lineHeight: 1.08, gap: 6, paddingY: 2, paddingX: 4, note: 5 };
  } else if (score >= 34) {
    profile = { header: 13, section: 7.8, row: 5.9, lineHeight: 1.12, gap: 7, paddingY: 2, paddingX: 5, note: 5.4 };
  } else if (score >= 30) {
    profile = { header: 14, section: 8.5, row: 6.5, lineHeight: 1.16, gap: 8, paddingY: 3, paddingX: 6, note: 6 };
  } else {
    profile = { header: 15, section: 9, row: 7, lineHeight: 1.18, gap: 9, paddingY: 4, paddingX: 6, note: 6.2 };
  }

  return {
    header: Math.max(10, profile.header - shrinkBy),
    section: Math.max(6.4, profile.section - shrinkBy),
    row: Math.max(4.8, profile.row - shrinkBy),
    lineHeight: Math.max(1.02, profile.lineHeight - lineTightening),
    gap: Math.max(4, profile.gap - fitLevel),
    paddingY: Math.max(1, profile.paddingY - (fitLevel >= 2 ? 1 : 0)),
    paddingX: Math.max(3, profile.paddingX - fitLevel),
    note: Math.max(4.2, profile.note - shrinkBy)
  };
}

function contentNeedsUnicode(catalog) {
  const joined = JSON.stringify(catalog);
  return /[^\u0000-\u00ff]/.test(joined);
}

function shouldPreferFontEmbeddedExport(version) {
  return isTranslatedLanguage(version?.catalog?.language) && contentNeedsUnicode(version?.catalog || {});
}

function normalizeSpecValue(label, value) {
  if (/full power range/i.test(label)) {
    return String(value).replace(/\s*\|\s*/g, "\n");
  }

  return String(value);
}

function normalizeSpecLookup(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function findCatalogSpecItem(catalog, label) {
  const wanted = normalizeSpecLookup(label);
  if (!wanted) {
    return null;
  }
  const items = (catalog.specSections || []).flatMap((section) => section.items || []);
  return items.find((item) => normalizeSpecLookup(item.label) === wanted)
    || items.find((item) => {
      const candidate = normalizeSpecLookup(item.label);
      return Boolean(candidate) && (candidate.includes(wanted) || wanted.includes(candidate));
    })
    || null;
}

function getSourceValueFontSize(font, region, value) {
  const maximum = Number(region.fontSize || 8.05);
  const minimum = Number(region.minFontSize || 5.6);
  const availableWidth = Math.max(1, Number(region.width || 1) - 3);
  let size = maximum;

  while (size > minimum && font.widthOfTextAtSize(String(value || ""), size) > availableWidth) {
    size = Math.max(minimum, size - 0.2);
  }

  return size;
}

function drawSourceSpecValueOverlays({ pagesById, pageSize, template, catalog, font }) {
  const catalogItems = (catalog.specSections || []).flatMap((section) => section.items || []);
  for (const [index, region] of (template.specValueRegions || []).entries()) {
    const item = catalogItems[index] || findCatalogSpecItem(catalog, region.label);
    const value = item ? String(item.value ?? "") : String(region.sourceValue ?? "");

    if (!item || value.trim() === String(region.sourceValue ?? "").trim()) {
      continue;
    }

    const page = pagesById[normalizeTemplateRegionPage(region.page)];
    if (!page) {
      continue;
    }

    page.drawRectangle({
      x: region.x,
      y: toPdfY(pageSize, region.y, region.height),
      width: region.width,
      height: region.height,
      color: hexToRgb(region.background || "#ffffff")
    });

    const fontSize = getSourceValueFontSize(font, region, value);
    if (region.height <= 14) {
      page.drawText(value, {
        x: region.x + 1,
        y: toPdfY(pageSize, region.y + 2, fontSize),
        size: fontSize,
        font,
        color: hexToRgb(region.textColor || "#444444")
      });
      continue;
    }

    drawWrappedText(page, font, value, {
      pageSize,
      x: region.x + 1,
      top: region.y + 2,
      width: region.width - 2,
      fontSize,
      lineHeight: fontSize * 1.08,
      color: hexToRgb(region.textColor || "#444444"),
      maxLines: Math.max(1, Math.floor((region.height - 2) / (fontSize * 1.08)))
    });
  }
}

const sourceSpecSectionRegions = [
  { sectionIndex: 0, x: 40, y: 66, width: 112, height: 15 },
  { sectionIndex: 1, x: 216, y: 66, width: 111, height: 15 },
  { sectionIndex: 2, x: 398, y: 66, width: 102, height: 15 },
  { sectionIndex: 3, x: 40, y: 166, width: 112, height: 15 },
  { sectionIndex: 4, x: 398, y: 166, width: 102, height: 15 },
  { sectionIndex: 5, x: 398, y: 229, width: 102, height: 15 },
  { sectionIndex: 6, x: 40, y: 304, width: 164, height: 15 },
  { sectionIndex: 7, x: 398, y: 304, width: 102, height: 15 }
];

function getSourceSpecLabelRegion(valueRegion) {
  if (Number(valueRegion.x) < 250) {
    return Number(valueRegion.x) >= 200
      ? { ...valueRegion, x: 40, width: 164 }
      : { ...valueRegion, x: 40, width: 112 };
  }

  if (Number(valueRegion.x) < 400) {
    return { ...valueRegion, x: 216, width: 111 };
  }

  return { ...valueRegion, x: 398, width: 102 };
}

function getSourceTextFontSize(region, value, maximum = 6.1, minimum = 3.6) {
  const estimatedWidth = Math.max(1, Array.from(String(value || "")).length * maximum * 0.5);
  return Math.max(minimum, Math.min(maximum, maximum * (Number(region.width || 1) - 2) / estimatedWidth));
}

function drawSourceSpecTextOverlays({ pagesById, pageSize, template, catalog, font, headingFont, fallbackFont }) {
  const page = pagesById.page1;
  const catalogItems = (catalog.specSections || []).flatMap((section) => section.items || []);
  const valueRegions = (template.specValueRegions || []).filter(
    (region) => normalizeTemplateRegionPage(region.page) === "page1"
  );
  const overlays = [
    {
      value: catalog.specificationsTitle || "Specifications",
      x: 40,
      y: 42,
      width: 130,
      height: 24,
      background: "#ffffff",
      color: "#be1e2d",
      fontSize: 11,
      fontWeight: "bold"
    },
    ...sourceSpecSectionRegions.map((region) => ({
      ...region,
      value: catalog.specSections?.[region.sectionIndex]?.title || "",
      background: "#e7e7e7",
      color: "#40454d",
      fontSize: getSourceTextFontSize(region, catalog.specSections?.[region.sectionIndex]?.title, 6.4, 3.8),
      fontWeight: "bold"
    })),
    ...valueRegions.map((valueRegion, index) => {
      const region = getSourceSpecLabelRegion(valueRegion);
      const value = catalogItems[index]?.label || valueRegion.label;
      return {
        ...region,
        value,
        background: "#ffffff",
        color: "#40454d",
        fontSize: getSourceTextFontSize(region, value),
        fontWeight: "normal"
      };
    })
  ];

  for (const region of overlays) {
    page.drawRectangle({
      x: region.x,
      y: toPdfY(pageSize, region.y, region.height),
      width: region.width,
      height: region.height,
      color: hexToRgb(region.background)
    });
    drawWrappedText(page, region.fontWeight === "bold" ? headingFont : font, region.value, {
      pageSize,
      x: region.x + 1,
      top: region.y + 2,
      width: region.width - 2,
      fontSize: region.fontSize,
      lineHeight: region.fontSize * 1.04,
      color: hexToRgb(region.color),
      maxLines: Math.max(1, Math.floor((region.height - 2) / (region.fontSize * 1.04))),
      fallbackFont
    });
  }
}

function resolveBrowserExecutableCandidates() {
  const commonEnvCandidates = [
    process.env.PDF_BROWSER_EXECUTABLE_PATH,
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_BIN,
    process.env.CHROME_PATH
  ].filter(Boolean);

  if (process.platform === "win32") {
    return [
      ...commonEnvCandidates,
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
    ];
  }

  if (process.platform === "darwin") {
    return [
      ...commonEnvCandidates,
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      "/Applications/Chromium.app/Contents/MacOS/Chromium"
    ];
  }

  return [
    ...commonEnvCandidates,
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/snap/bin/chromium"
  ];
}

function resolveBrowserExecutable() {
  return resolveBrowserExecutableCandidates().find((candidate) => candidate && fs.existsSync(candidate)) || null;
}

function cleanupBrowserProfile(browserProfileDir) {
  try {
    fs.rmSync(browserProfileDir, { recursive: true, force: true });
  } catch (error) {
    console.warn("Could not remove the temporary browser profile", error?.message || error);
  }
}

async function exportCatalogVersionWithBrowser(version, pageSize) {
  const versionUrl = `http://127.0.0.1:${process.env.PORT || 3001}/?print=1&versionId=${encodeURIComponent(version.id)}&t=${Date.now()}`;
  const filePath = path.join(exportsRoot, `${version.id}.pdf`);
  fs.mkdirSync(exportsRoot, { recursive: true });

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  const executablePath = resolveBrowserExecutable();
  const launchOptions = {
    headless: true,
    args: [
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--hide-scrollbars",
      "--disable-dev-shm-usage",
      "--no-sandbox",
      "--disable-setuid-sandbox"
    ]
  };

  if (executablePath) {
    launchOptions.executablePath = executablePath;
  }

  let browser = null;
  try {
    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    await page.setViewport({
      width: 1440,
      height: Math.max(1400, Math.ceil((pageSize.height / pageSize.width) * 1440))
    });
    await page.emulateMediaType("screen");
    await page.goto(versionUrl, {
      waitUntil: "networkidle0",
      timeout: 45000
    });

    await page.evaluate(async () => {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
    });
    await page.waitForTimeout(300);
    await page.pdf({
      path: filePath,
      printBackground: true,
      width: `${pageSize.width}pt`,
      height: `${pageSize.height}pt`,
      preferCSSPageSize: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0"
      }
    });
  } catch (error) {
    console.warn("Browser PDF export failed, falling back to pdf-lib renderer", error);
    if (browser) {
      await browser.close().catch(() => {});
    }
    return null;
  }

  if (browser) {
    await browser.close().catch(() => {});
  }

  return fs.existsSync(filePath) && fs.statSync(filePath).size > 0 ? filePath : null;
}

async function exportCatalogVersionWithBrowserSnapshots(version, pageSize) {
  const versionUrl = `http://127.0.0.1:${process.env.PORT || 3001}/?print=1&versionId=${encodeURIComponent(version.id)}&t=${Date.now()}`;
  const filePath = path.join(exportsRoot, `${version.id}.pdf`);
  fs.mkdirSync(exportsRoot, { recursive: true });

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  const executablePath = resolveBrowserExecutable();
  const browserProfileDir = fs.mkdtempSync(path.join(exportsRoot, ".puppeteer-"));
  const launchOptions = {
    headless: true,
    userDataDir: browserProfileDir,
    args: [
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--hide-scrollbars",
      "--disable-dev-shm-usage",
      "--no-sandbox",
      "--disable-setuid-sandbox"
    ]
  };

  if (executablePath) {
    launchOptions.executablePath = executablePath;
  }

  let browser = null;
  try {
    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    const captureWidth = Math.max(1440, Math.ceil(pageSize.width * 2));
    const captureHeight = Math.max(2000, Math.ceil(pageSize.height * 2));

    await page.setViewport({
      width: captureWidth,
      height: captureHeight,
      deviceScaleFactor: 2
    });
    await page.emulateMediaType("screen");
    await page.goto(versionUrl, {
      waitUntil: "networkidle0",
      timeout: 45000
    });

    await page.evaluate(async () => {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
    });
    await new Promise((resolve) => setTimeout(resolve, 400));

    const pageElements = await page.$$(".print-page");
    if (!pageElements.length) {
      throw new Error("No print pages were rendered");
    }

    const pdfDoc = await PDFDocument.create();
    for (const pageElement of pageElements) {
      const imageBytes = await pageElement.screenshot({
        type: "png"
      });
      const embeddedImage = await pdfDoc.embedPng(imageBytes);
      const pdfPage = pdfDoc.addPage([pageSize.width, pageSize.height]);
      pdfPage.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: pageSize.width,
        height: pageSize.height
      });
    }

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(filePath, pdfBytes);
  } catch (error) {
    console.warn("Browser snapshot PDF export failed, falling back to text renderer", error);
    if (browser) {
      await browser.close().catch(() => {});
    }
    cleanupBrowserProfile(browserProfileDir);
    return null;
  }

  if (browser) {
    await browser.close().catch(() => {});
  }
  cleanupBrowserProfile(browserProfileDir);

  return fs.existsSync(filePath) && fs.statSync(filePath).size > 0 ? filePath : null;
}

export function getPrintLayoutIssues(version) {
  const issues = [];
  const template = resolveTemplate(version);

  if (template.preserveSourceArtwork === true) {
    return issues;
  }

  for (const region of template.page1.columns.filter((column) => !column.hidden)) {
    const items = version.catalog[region.key] || [];
    const typography = resolveListTypography(items.slice(0, 18), region, version.catalog);
    const fitLevel = getFitLevel(version.catalog);
    const reservedBottom = region.compact ? 4 : (fitLevel >= 4 ? 4 : fitLevel >= 3 ? 10 : 16);
    const { hiddenCount } = getVisibleListItemsForRegion(items.slice(0, 18), region, typography, reservedBottom);

    if (hiddenCount > 0 || items.length > 18) {
      issues.push({
        page: getTemplatePageNumber(normalizeTemplateRegionPage(region.page)),
        section: region.label,
        type: "column_overflow",
        message: `${region.label} exceeds the fixed template region capacity`
      });
    }
  }

  const specsPanel = template.page2.specsPanel;
  if (!specsPanel.hidden && specsPanel.layout !== "columns") {
    let currentTop = specsPanel.y + 30;
    const specMetrics = getSpecMetrics(version.catalog);

    for (const section of version.catalog.specSections) {
      currentTop += specMetrics.section + 8;

      for (const item of section.items) {
        const valueText = normalizeSpecValue(item.label, item.value);
        const labelLineCount = estimateWrappedLineCount(item.label, 150, specMetrics.row, 3);
        const valueLineCount = estimateWrappedLineCount(valueText, 94, specMetrics.row, 3);
        const lineCount = Math.max(labelLineCount, valueLineCount, 1);
        const rowHeight = Math.max(10, lineCount * (specMetrics.row * specMetrics.lineHeight) + specMetrics.paddingY + 2);
        currentTop += rowHeight;
      }
    }

    if (currentTop > specsPanel.y + specsPanel.height - 40) {
      issues.push({
        page: getTemplatePageNumber(normalizeTemplateRegionPage(specsPanel.page, "page2")),
        section: specsPanel.title || "Specifications",
        type: "spec_overflow",
        message: "Specifications exceed the fixed template region capacity"
      });
    }
  }

  return issues;
}

export async function exportCatalogVersion(version) {
  const template = resolveTemplate(version);
  const pageSize = getTemplatePageSize(template);
  const preservesSourceArtwork = template.preserveSourceArtwork === true;
  const translatesSourceArtwork = preservesSourceArtwork && isTranslatedLanguage(version.catalog.language);
  const browserFilePath = preservesSourceArtwork && !translatesSourceArtwork
    ? null
    : (shouldPreferFontEmbeddedExport(version)
      ? await exportCatalogVersionWithBrowserSnapshots(version, pageSize)
      : await exportCatalogVersionWithBrowser(version, pageSize));
  if (browserFilePath) {
    return browserFilePath;
  }

  const pdfDoc = await PDFDocument.create();
  const pageIds = getTemplatePageIds(template);
  const pagesById = Object.fromEntries(
    pageIds.map((pageId) => [pageId, pdfDoc.addPage([pageSize.width, pageSize.height])])
  );

  const standardFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const unicodeFont = (!preservesSourceArtwork || translatesSourceArtwork) && contentNeedsUnicode(version.catalog)
    ? await embedUnicodeFont(pdfDoc, version.catalog.language)
    : null;
  const bodyFont = unicodeFont || standardFont;
  const headingFont = unicodeFont || boldFont;

  for (const pageId of pageIds) {
    const pageNumber = getTemplatePageNumber(pageId);
    const backgroundPath = resolveTemplateBackgroundPath(template[pageId].background)
      || path.join(assetsRoot, `page-${pageNumber}.png`);
    const backgroundImage = await loadImage(pdfDoc, backgroundPath);
    pagesById[pageId].drawImage(backgroundImage, { x: 0, y: 0, width: pageSize.width, height: pageSize.height });
  }

  if (preservesSourceArtwork) {
    drawSourceSpecValueOverlays({
      pagesById,
      pageSize,
      template,
      catalog: version.catalog,
      font: bodyFont
    });
  }
  if (translatesSourceArtwork) {
    drawSourceSpecTextOverlays({
      pagesById,
      pageSize,
      template,
      catalog: version.catalog,
      font: bodyFont,
      headingFont,
      fallbackFont: standardFont
    });
  }

  const titleRegion = template.page1.titleRegion;
  const sourceTitleChanged = String(version.catalog.title || "").trim() !== String(titleRegion.sourceValue || "").trim();
  if ((!preservesSourceArtwork || sourceTitleChanged) && !titleRegion.hidden) {
    const titlePage = pagesById[normalizeTemplateRegionPage(titleRegion.page)];
    titlePage.drawRectangle({
      x: titleRegion.x,
      y: toPdfY(pageSize, titleRegion.y, titleRegion.height),
      width: titleRegion.width,
      height: titleRegion.height,
      color: hexToRgb(titleRegion.background)
    });

    drawTextWithFallback(titlePage, version.catalog.title, {
      x: titleRegion.x + 8,
      y: toPdfY(pageSize, titleRegion.y + 16, 34),
      size: 34,
      font: headingFont,
      fallbackFont: standardFont,
      color: hexToRgb(titleRegion.textColor || "#a7192d")
    });
  }

  if (
    (!preservesSourceArtwork || Boolean(version.catalog.heroOverlayImage))
    && !template.page1.heroOverlay.hidden
  ) {
    const overlayRegion = template.page1.heroOverlay;
    const overlayImagePath = resolveHeroImagePath(version, template);
    const heroPage = pagesById[normalizeTemplateRegionPage(overlayRegion.page)];

    if (overlayImagePath && fs.existsSync(overlayImagePath)) {
      heroPage.drawRectangle({
        x: overlayRegion.x,
        y: toPdfY(pageSize, overlayRegion.y, overlayRegion.height),
        width: overlayRegion.width,
        height: overlayRegion.height,
        color: rgb(1, 1, 1),
        borderColor: hexToRgb("#d8dde6"),
        borderWidth: 1
      });

      const overlayImage = await loadImage(pdfDoc, overlayImagePath);
      heroPage.drawImage(overlayImage, {
        x: overlayRegion.x + 8,
        y: toPdfY(pageSize, overlayRegion.y + 8, overlayRegion.height - 16),
        width: overlayRegion.width - 16,
        height: overlayRegion.height - 16
      });
    }
  }

  const listRegions = template.page1.columns
    .filter((column) => !column.hidden)
    .filter((region) => {
      if (!preservesSourceArtwork || translatesSourceArtwork) {
        return true;
      }

      return JSON.stringify(region.sourceItems || []) !== JSON.stringify(version.catalog[region.key] || []);
    });

  for (const region of listRegions) {
    const list = version.catalog[region.key] || [];
    const regionPage = pagesById[normalizeTemplateRegionPage(region.page)];
    const translatedLabel = version.catalog.sectionLabels?.[region.key] || region.label;
    drawListBlock(regionPage, bodyFont, headingFont, translatedLabel, list, region, version.catalog, pageSize, standardFont);
  }

  const machineCategoryRegion = template.page1.machineCategoryRegion;
  if (preservesSourceArtwork && machineCategoryRegion) {
    const machineCategoryChanged = String(version.catalog.machineCategory || "").trim()
      !== String(machineCategoryRegion.sourceValue || "").trim();

    if (translatesSourceArtwork || machineCategoryChanged) {
      const machineCategoryPage = pagesById[normalizeTemplateRegionPage(machineCategoryRegion.page)];
      machineCategoryPage.drawRectangle({
        x: machineCategoryRegion.x,
        y: toPdfY(pageSize, machineCategoryRegion.y, machineCategoryRegion.height),
        width: machineCategoryRegion.width,
        height: machineCategoryRegion.height,
        color: hexToRgb(machineCategoryRegion.background || "#ffffff")
      });
      drawWrappedText(machineCategoryPage, headingFont, version.catalog.machineCategory, {
        pageSize,
        x: machineCategoryRegion.x + 8,
        top: machineCategoryRegion.y + 8,
        width: machineCategoryRegion.width - 16,
        fontSize: translatesSourceArtwork ? 14 : 20,
        lineHeight: translatesSourceArtwork ? 16 : 22,
        color: hexToRgb(machineCategoryRegion.textColor || "#4b4b4b"),
        maxLines: 3,
        fallbackFont: standardFont
      });
    }
  }

  if (
    String(template.page2.background || "").includes("/api/assets/j300/page-2.png")
    && pageSize.width < pageSize.height
  ) {
    const page2Canvas = {
      x: 278,
      y: 0,
      width: pageSize.width - 278,
      height: 702
    };
    pagesById.page2.drawRectangle({
      x: page2Canvas.x,
      y: toPdfY(pageSize, page2Canvas.y, page2Canvas.height),
      width: page2Canvas.width,
      height: page2Canvas.height,
      color: rgb(1, 1, 1)
    });
  }

  const specsPanel = template.page2.specsPanel;
  if (!preservesSourceArtwork && !specsPanel.hidden) {
    const specsPage = pagesById[normalizeTemplateRegionPage(specsPanel.page, "page2")];
    specsPage.drawRectangle({
      x: specsPanel.x,
      y: toPdfY(pageSize, specsPanel.y, specsPanel.height),
      width: specsPanel.width,
      height: specsPanel.height,
      color: hexToRgb(specsPanel.background)
    });

    specsPage.drawLine({
      start: { x: specsPanel.x, y: toPdfY(pageSize, specsPanel.y) },
      end: { x: specsPanel.x, y: toPdfY(pageSize, specsPanel.y + specsPanel.height) },
      color: hexToRgb(specsPanel.borderColor),
      thickness: 1
    });

    drawTextWithFallback(specsPage, version.catalog.specificationsTitle || specsPanel.title || "Specifications", {
      x: specsPanel.x + 14,
      y: toPdfY(pageSize, specsPanel.y + 12, 12),
      size: 12,
      font: headingFont,
      fallbackFont: standardFont,
      color: hexToRgb(specsPanel.borderColor || "#B42E33")
    });

    drawTextWithFallback(specsPage, version.catalog.title, {
      x: specsPanel.x + specsPanel.width - 96,
      y: toPdfY(pageSize, specsPanel.y + 9, 10),
      size: 10,
      font: bodyFont,
      fallbackFont: standardFont,
      color: hexToRgb("#3b4047")
    });

    const usesColumnLayout = specsPanel.layout === "columns";
    const columnCount = usesColumnLayout ? 3 : 1;
    const columnGap = usesColumnLayout ? 8 : 0;
    const innerWidth = specsPanel.width - 8;
    const columnWidth = (innerWidth - columnGap * (columnCount - 1)) / columnCount;
    const rowFontSize = usesColumnLayout ? 4.2 : 6.3;
    const rowLineHeight = usesColumnLayout ? 5 : 7.4;
    const sectionFontSize = usesColumnLayout ? 6.2 : 10;
    const sectionHeight = usesColumnLayout ? 10 : 14;
    const sectionAdvance = usesColumnLayout ? 12 : 17;
    const labelWidth = usesColumnLayout ? columnWidth * 0.58 : 150;
    const valueWidth = usesColumnLayout ? columnWidth * 0.34 : 94;
    const maxContentBottom = specsPanel.y + specsPanel.height - 38;
    const usesSourceColumnLayout = translatesSourceArtwork && specsPanel.sourceColumns === true;
    let columnIndex = 0;
    let currentTop = specsPanel.y + 30;

    const getRowHeight = (item) => {
      const valueText = normalizeSpecValue(item.label, item.value);
      const labelLineCount = estimateWrappedLineCount(item.label, labelWidth, rowFontSize, 3);
      const valueLineCount = estimateWrappedLineCount(valueText, valueWidth, rowFontSize, 3);
      const lineCount = Math.max(labelLineCount, valueLineCount, 1);
      return Math.max(usesColumnLayout ? 7 : 12, lineCount * rowLineHeight + (usesColumnLayout ? 1 : 3));
    };

    const sectionsToDraw = usesSourceColumnLayout
      ? [...version.catalog.specSections].sort((left, right) => Number(left.column || 1) - Number(right.column || 1))
      : version.catalog.specSections;

    for (const section of sectionsToDraw) {
      const estimatedSectionHeight = sectionAdvance
        + section.items.reduce((total, item) => total + getRowHeight(item), 0);

      const requestedColumnIndex = Math.max(0, Math.min(columnCount - 1, Number(section.column || 1) - 1));
      if (usesSourceColumnLayout && requestedColumnIndex !== columnIndex) {
        columnIndex = requestedColumnIndex;
        currentTop = specsPanel.y + 30;
      } else if (usesColumnLayout && currentTop + estimatedSectionHeight > maxContentBottom && columnIndex < columnCount - 1) {
        columnIndex += 1;
        currentTop = specsPanel.y + 30;
      }

      const columnX = specsPanel.x + 4 + columnIndex * (columnWidth + columnGap);
      specsPage.drawRectangle({
        x: columnX,
        y: toPdfY(pageSize, currentTop, sectionHeight),
        width: columnWidth,
        height: sectionHeight,
        color: hexToRgb("#e7e7e7")
      });

      drawTextWithFallback(specsPage, section.title, {
        x: columnX + (usesColumnLayout ? 4 : 8),
        y: toPdfY(pageSize, currentTop + (usesColumnLayout ? 2 : 3), sectionFontSize),
        size: sectionFontSize,
        font: headingFont,
        fallbackFont: standardFont,
        color: hexToRgb("#40454d")
      });

      currentTop += sectionAdvance;

      for (const item of section.items) {
        const valueText = normalizeSpecValue(item.label, item.value);
        const rowHeight = getRowHeight(item);

        specsPage.drawLine({
          start: { x: columnX, y: toPdfY(pageSize, currentTop) },
          end: { x: columnX + columnWidth, y: toPdfY(pageSize, currentTop) },
          color: hexToRgb("#d2d6dd"),
          thickness: 0.6
        });

        drawWrappedText(specsPage, bodyFont, item.label, {
          pageSize,
          x: columnX + (usesColumnLayout ? 3 : 8),
          top: currentTop + (usesColumnLayout ? 2 : 4),
          width: labelWidth,
          fontSize: rowFontSize,
          lineHeight: rowLineHeight,
          color: hexToRgb("#40454d"),
          maxLines: 3,
          fallbackFont: standardFont
        });

        drawWrappedText(specsPage, bodyFont, valueText, {
          pageSize,
          x: columnX + labelWidth + (usesColumnLayout ? 7 : 22),
          top: currentTop + (usesColumnLayout ? 2 : 4),
          width: valueWidth,
          fontSize: rowFontSize,
          lineHeight: rowLineHeight,
          color: hexToRgb("#4f545c"),
          maxLines: 3,
          fallbackFont: standardFont
        });

        currentTop += rowHeight;
      }
    }

    if (specsPanel.showNote !== false) {
      drawWrappedText(specsPage, bodyFont, version.catalog.legalNote, {
        pageSize,
        x: specsPanel.x + 12,
        top: specsPanel.y + specsPanel.height - 34,
        width: specsPanel.width - 24,
        fontSize: 6,
        lineHeight: 6.6,
        color: hexToRgb("#666a72"),
        maxLines: 4,
        fallbackFont: standardFont
      });
    }
  }

  const legalNoteRegion = template.page1.legalNoteRegion;
  const sourceLegalNoteChanged = String(version.catalog.legalNote || "").trim()
    !== String(legalNoteRegion?.sourceValue || "").trim();
  if (
    legalNoteRegion
    && !legalNoteRegion.hidden
    && (!preservesSourceArtwork || translatesSourceArtwork || sourceLegalNoteChanged)
  ) {
    const legalNotePage = pagesById[normalizeTemplateRegionPage(legalNoteRegion.page)];
    legalNotePage.drawRectangle({
      x: legalNoteRegion.x,
      y: toPdfY(pageSize, legalNoteRegion.y, legalNoteRegion.height),
      width: legalNoteRegion.width,
      height: legalNoteRegion.height,
      color: hexToRgb(legalNoteRegion.background || "#eeeeee")
    });
    const noteLabel = version.catalog.sectionLabels?.note || "Note";
    drawWrappedText(legalNotePage, bodyFont, `${noteLabel}: ${version.catalog.legalNote}`, {
      pageSize,
      x: legalNoteRegion.x + 8,
      top: legalNoteRegion.y + 8,
      width: legalNoteRegion.width - 16,
      fontSize: 5.6,
      lineHeight: 6.6,
      color: hexToRgb(legalNoteRegion.textColor || "#4d545d"),
      maxLines: 5,
      fallbackFont: standardFont
    });
  }

  const filePath = path.join(exportsRoot, `${version.id}.pdf`);
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(filePath, pdfBytes);
  return filePath;
}
