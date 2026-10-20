import fs from "node:fs";
import path from "node:path";
import {
  assetsRoot,
  ensureDirectory,
  templateAssetsRoot,
  templatesRoot
} from "./config.js";
import { catalogTemplate } from "./sampleCatalog.js";

export const BLANK_TEMPLATE_ID = "__blank__";

const builtInHeroFallbackByTemplateId = {
  "industrial-slate-template": "/api/assets/j300/default-hero-trimmed.png",
  "ace-red-template": "/api/assets/j300/default-hero-trimmed.png",
  "precision-green-template": "/api/assets/j300/default-hero-trimmed.png"
};

const scratchAssetFolder = "system-scratch";
const scratchPage1PublicPath = `/api/template-assets/${scratchAssetFolder}/page-1.svg`;
const scratchPage2PublicPath = `/api/template-assets/${scratchAssetFolder}/page-2.svg`;
const templateAssetExtensions = [".png", ".svg", ".jpg", ".jpeg", ".webp", ".pdf"];

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function slugifyTemplateId(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function templateFilePath(templateId) {
  return path.join(templatesRoot, `${templateId}.json`);
}

function toLocalAssetPath(assetPublicPath) {
  if (!assetPublicPath || typeof assetPublicPath !== "string") {
    return null;
  }

  if (assetPublicPath.startsWith("/api/assets/j300/")) {
    return path.join(assetsRoot, path.basename(assetPublicPath));
  }

  if (assetPublicPath.startsWith("/api/template-assets/")) {
    const relativeParts = assetPublicPath
      .replace("/api/template-assets/", "")
      .split("/")
      .filter(Boolean);

    return path.join(templateAssetsRoot, ...relativeParts);
  }

  return null;
}

function toPublicAssetPath(filePath) {
  if (!filePath) {
    return null;
  }

  const normalizedFilePath = path.normalize(filePath);
  const normalizedTemplateAssetsRoot = path.normalize(templateAssetsRoot);
  const normalizedAssetsRoot = path.normalize(assetsRoot);

  if (normalizedFilePath.startsWith(normalizedTemplateAssetsRoot)) {
    const relativePath = path.relative(normalizedTemplateAssetsRoot, normalizedFilePath).split(path.sep).join("/");
    return `/api/template-assets/${relativePath}`;
  }

  if (normalizedFilePath.startsWith(normalizedAssetsRoot)) {
    return `/api/assets/j300/${path.basename(normalizedFilePath)}`;
  }

  return null;
}

function findExistingSiblingAsset(filePath) {
  if (!filePath) {
    return null;
  }

  if (fs.existsSync(filePath)) {
    return filePath;
  }

  const directory = path.dirname(filePath);
  const baseName = path.basename(filePath, path.extname(filePath));

  for (const extension of templateAssetExtensions) {
    const candidate = path.join(directory, `${baseName}${extension}`);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function resolveExistingAssetPath(assetPublicPath) {
  const localPath = toLocalAssetPath(assetPublicPath);
  if (!localPath) {
    return null;
  }

  return findExistingSiblingAsset(localPath);
}

function resolveExistingAssetPublicPath(assetPublicPath) {
  const resolvedFilePath = resolveExistingAssetPath(assetPublicPath);
  return resolvedFilePath ? (toPublicAssetPath(resolvedFilePath) || assetPublicPath) : assetPublicPath;
}

function ensureScratchTemplateAssets() {
  const assetDir = path.join(templateAssetsRoot, scratchAssetFolder);
  ensureDirectory(assetDir);

  const page1Path = path.join(assetDir, "page-1.svg");
  const page2Path = path.join(assetDir, "page-2.svg");

  if (!fs.existsSync(page1Path)) {
    fs.writeFileSync(page1Path, `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="595" height="842" viewBox="0 0 595 842">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f6f8fb"/>
      <stop offset="100%" stop-color="#eef2f7"/>
    </linearGradient>
    <linearGradient id="wave" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#35536b"/>
      <stop offset="100%" stop-color="#6f9abc"/>
    </linearGradient>
  </defs>
  <rect width="595" height="842" fill="url(#bg)"/>
  <path d="M0 88 C126 14 246 10 356 48 C450 80 516 70 595 36 L595 0 L0 0 Z" fill="#243748"/>
  <path d="M0 176 C144 104 240 102 336 138 C432 174 510 168 595 128 L595 214 L0 258 Z" fill="url(#wave)" opacity="0.96"/>
  <rect x="34" y="38" width="196" height="66" rx="24" fill="#ffffff" opacity="0.94"/>
  <rect x="324" y="116" width="226" height="272" rx="28" fill="#ffffff" opacity="0.92"/>
  <rect x="30" y="474" width="168" height="220" rx="24" fill="#314556"/>
  <rect x="214" y="474" width="168" height="220" rx="24" fill="#425d73"/>
  <rect x="398" y="474" width="168" height="220" rx="24" fill="#597891"/>
  <rect x="0" y="732" width="595" height="110" fill="#203241"/>
  <rect x="198" y="706" width="198" height="42" rx="20" fill="#f0f4f8"/>
</svg>`);
  }

  if (!fs.existsSync(page2Path)) {
    fs.writeFileSync(page2Path, `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="595" height="842" viewBox="0 0 595 842">
  <defs>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f7fafc"/>
      <stop offset="100%" stop-color="#edf3f8"/>
    </linearGradient>
  </defs>
  <rect width="595" height="842" fill="url(#bg2)"/>
  <rect x="26" y="30" width="543" height="92" rx="28" fill="#243748"/>
  <rect x="26" y="142" width="543" height="620" rx="30" fill="#ffffff" opacity="0.96"/>
  <rect x="44" y="170" width="507" height="18" rx="9" fill="#d5e1ea"/>
  <rect x="44" y="204" width="507" height="14" rx="7" fill="#edf3f7"/>
  <rect x="44" y="232" width="507" height="14" rx="7" fill="#edf3f7"/>
  <rect x="44" y="260" width="507" height="14" rx="7" fill="#edf3f7"/>
  <rect x="44" y="308" width="507" height="18" rx="9" fill="#d5e1ea"/>
  <rect x="44" y="342" width="507" height="14" rx="7" fill="#edf3f7"/>
  <rect x="44" y="370" width="507" height="14" rx="7" fill="#edf3f7"/>
  <rect x="44" y="398" width="507" height="14" rx="7" fill="#edf3f7"/>
  <rect x="0" y="772" width="595" height="70" fill="#203241"/>
</svg>`);
  }
}

export function getScratchTemplateSeed() {
  ensureScratchTemplateAssets();

  return normalizeTemplate({
    ...deepClone(catalogTemplate),
    id: BLANK_TEMPLATE_ID,
    name: "Start from scratch",
    kind: "system",
    description: "Neutral starting point for creating a new brochure template from prompt or sample image.",
    sourceTemplateId: null,
    brandFrame: "shared",
    page3: null,
    page4: null,
    page1: {
      background: scratchPage1PublicPath,
      titleRegion: {
        x: 38,
        y: 42,
        width: 206,
        height: 66,
        background: "#ffffff"
      },
      heroOverlay: {
        x: 308,
        y: 114,
        width: 232,
        height: 268,
        radius: 26,
        placeholderImage: "/api/assets/j300/default-hero-trimmed.png",
        frameStyle: "card",
        objectFit: "contain",
        objectPosition: "center center"
      },
      columns: [
        { key: "features", label: "Machine Features", x: 30, y: 474, width: 168, height: 220, background: "#314556" },
        { key: "standardAccessories", label: "Standard Accessories", x: 214, y: 474, width: 168, height: 220, background: "#425d73" },
        { key: "optionalAccessories", label: "Optional Accessories", x: 398, y: 474, width: 168, height: 220, background: "#597891" }
      ]
    },
    page2: {
      background: scratchPage2PublicPath,
      specsPanel: {
        x: 44,
        y: 152,
        width: 508,
        height: 604,
        background: "#ffffff",
        borderColor: "#425d73",
        title: "Specifications"
      }
    }
  });
}

function mergeColumns(baseColumns, incomingColumns = []) {
  const incomingByKey = new Map(
    (incomingColumns || [])
      .filter((column) => column?.key)
      .map((column) => [column.key, column])
  );

  return baseColumns.map((baseColumn) => ({
    ...baseColumn,
    ...(incomingByKey.get(baseColumn.key) || {})
  }));
}

function resolveTemplatePageSize(pageSize) {
  const width = Number(pageSize?.width);
  const height = Number(pageSize?.height);

  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    return {
      width: 595.276,
      height: 841.89
    };
  }

  return { width, height };
}

function normalizeEditableRegions(editableRegions = [], pageSize) {
  const resolvedPageSize = resolveTemplatePageSize(pageSize);

  return (Array.isArray(editableRegions) ? editableRegions : [])
    .filter((region) => region && typeof region === "object")
    .map((region, index) => {
      const width = Number(region.width);
      const height = Number(region.height);
      const safeWidth = Number.isFinite(width) && width > 0 ? width : resolvedPageSize.width * 0.3;
      const safeHeight = Number.isFinite(height) && height > 0 ? height : resolvedPageSize.height * 0.14;
      const safeX = Number.isFinite(Number(region.x))
        ? Math.max(0, Math.min(Number(region.x), Math.max(0, resolvedPageSize.width - safeWidth)))
        : resolvedPageSize.width * 0.08;
      const safeY = Number.isFinite(Number(region.y))
        ? Math.max(0, Math.min(Number(region.y), Math.max(0, resolvedPageSize.height - safeHeight)))
        : resolvedPageSize.height * 0.08;

      return {
        id: String(region.id || region.key || `region-${index + 1}`).trim() || `region-${index + 1}`,
        page: ["page1", "page2", "page3", "page4"].includes(String(region.page || "").toLowerCase())
          ? String(region.page).toLowerCase()
          : "page1",
        type: ["image", "logo", "photo"].includes(String(region.type || "").toLowerCase()) ? "image" : "text",
        label: String(region.label || region.title || `Region ${index + 1}`).trim() || `Region ${index + 1}`,
        x: Math.round(safeX),
        y: Math.round(safeY),
        width: Math.round(safeWidth),
        height: Math.round(safeHeight),
        hidden: Boolean(region.hidden),
        background: typeof region.background === "string"
          ? region.background
          : (["image", "logo", "photo"].includes(String(region.type || "").toLowerCase())
            ? "transparent"
            : "rgba(255,255,255,0.92)"),
        textColor: typeof region.textColor === "string" ? region.textColor : "#1f2933",
        content: typeof region.content === "string"
          ? region.content
          : (typeof region.text === "string" ? region.text : ""),
        originalContent: typeof region.originalContent === "string"
          ? region.originalContent
          : (typeof region.content === "string"
            ? region.content
            : (typeof region.text === "string" ? region.text : "")),
        fontSize: Number.isFinite(Number(region.fontSize)) ? Number(region.fontSize) : 24,
        fontWeight: Number.isFinite(Number(region.fontWeight)) ? Number(region.fontWeight) : 700,
        radius: Number.isFinite(Number(region.radius)) ? Number(region.radius) : 12,
        objectFit: typeof region.objectFit === "string" && region.objectFit.trim() ? region.objectFit.trim() : "cover",
        objectPosition: typeof region.objectPosition === "string" && region.objectPosition.trim()
          ? region.objectPosition.trim()
          : "center center",
        imageScale: Number.isFinite(Number(region.imageScale)) ? Number(region.imageScale) : 1,
        imageOffsetX: Number.isFinite(Number(region.imageOffsetX)) ? Number(region.imageOffsetX) : 0,
        imageOffsetY: Number.isFinite(Number(region.imageOffsetY)) ? Number(region.imageOffsetY) : 0,
        imageNaturalWidth: Number.isFinite(Number(region.imageNaturalWidth)) ? Number(region.imageNaturalWidth) : null,
        imageNaturalHeight: Number.isFinite(Number(region.imageNaturalHeight)) ? Number(region.imageNaturalHeight) : null,
        imageMatteColor: typeof region.imageMatteColor === "string" && region.imageMatteColor.trim()
          ? region.imageMatteColor.trim()
          : null,
        clipPath: typeof region.clipPath === "string" && region.clipPath.trim() ? region.clipPath.trim() : null,
        imageSrc: typeof region.imageSrc === "string" && region.imageSrc.trim() ? region.imageSrc.trim() : null,
        originalImageSrc: typeof region.originalImageSrc === "string" && region.originalImageSrc.trim()
          ? region.originalImageSrc.trim()
          : (typeof region.imageSrc === "string" && region.imageSrc.trim() ? region.imageSrc.trim() : null),
        textAlign: typeof region.textAlign === "string" && region.textAlign.trim() ? region.textAlign.trim() : "left",
        deleted: Boolean(region.deleted),
        borderColor: typeof region.borderColor === "string" && region.borderColor.trim()
          ? region.borderColor.trim()
          : "rgba(181,46,51,0.46)"
      };
    });
}

export function normalizeTemplate(template) {
  const base = deepClone(catalogTemplate);
  const page1Input = template?.page1 || {};
  const page2Input = template?.page2 || {};
  const page3Input = template?.page3 || {};
  const page4Input = template?.page4 || {};
  const incomingHeroOverlay = page1Input.heroOverlay || {};
  const fallbackHeroPlaceholder = builtInHeroFallbackByTemplateId[template?.id] || null;
  const hasExplicitHeroPlaceholder = Object.prototype.hasOwnProperty.call(incomingHeroOverlay, "placeholderImage");
  const resolvedPage1Background = resolveExistingAssetPublicPath(
    page1Input.background || template?.page1?.background || base.page1.background
  );
  const resolvedPage2Background = resolveExistingAssetPublicPath(
    page2Input.background || template?.page2?.background || base.page2.background
  );
  const inheritsBuiltInExtraPages = template?.id === catalogTemplate.id;
  const resolvedPage3Background = resolveExistingAssetPublicPath(
    page3Input.background || (inheritsBuiltInExtraPages ? base.page3?.background : null)
  );
  const resolvedPage4Background = resolveExistingAssetPublicPath(
    page4Input.background || (inheritsBuiltInExtraPages ? base.page4?.background : null)
  );
  const resolvedHeroPlaceholder = resolveExistingAssetPublicPath(
    hasExplicitHeroPlaceholder
      ? incomingHeroOverlay.placeholderImage
      : fallbackHeroPlaceholder
  );
  const resolvedPageSize = {
    ...base.pageSize,
    ...(template?.pageSize || {})
  };
  const usesNativeBrandFrame =
    resolvedPage1Background === base.page1.background &&
    resolvedPage2Background === base.page2.background;

  return {
    ...base,
    ...template,
    kind: template?.kind || (template?.id === catalogTemplate.id ? "built_in" : "custom"),
    preserveSourceArtwork: template?.id === catalogTemplate.id && template?.preserveSourceArtwork === true,
    specValueRegions: template?.id === catalogTemplate.id
      ? deepClone(template?.specValueRegions || base.specValueRegions || [])
      : [],
    brandFrame: template?.brandFrame || (usesNativeBrandFrame ? "native" : "shared"),
    description: template?.description || "Reusable 2-page machine catalog template",
    createdAt: template?.createdAt || nowIso(),
    updatedAt: template?.updatedAt || template?.createdAt || nowIso(),
    pageSize: resolvedPageSize,
    page1: {
      ...base.page1,
      ...page1Input,
      titleRegion: {
        ...base.page1.titleRegion,
        ...(page1Input.titleRegion || {})
      },
      heroOverlay: {
        ...base.page1.heroOverlay,
        hidden: false,
        ...incomingHeroOverlay,
        frameStyle: incomingHeroOverlay.frameStyle || (fallbackHeroPlaceholder ? "cutout" : "card"),
        objectFit: incomingHeroOverlay.objectFit || (fallbackHeroPlaceholder ? "cover" : "contain"),
        objectPosition: incomingHeroOverlay.objectPosition || "center center",
        placeholderImage: resolvedHeroPlaceholder || null
      },
      columns: mergeColumns(base.page1.columns, page1Input.columns || [])
    },
    page2: {
      ...base.page2,
      ...page2Input,
      specsPanel: {
        ...base.page2.specsPanel,
        title: "Specifications",
        hidden: false,
        ...(page2Input.specsPanel || {})
      }
    },
    page3: null,
    page4: null,
    ...(resolvedPage3Background
      ? {
          page3: {
            ...(base.page3 || {}),
            ...page3Input,
            background: resolvedPage3Background
          }
        }
      : {}),
    ...(resolvedPage4Background
      ? {
          page4: {
            ...(base.page4 || {}),
            ...page4Input,
            background: resolvedPage4Background
          }
        }
      : {}),
    editableRegions: normalizeEditableRegions(template?.editableRegions || [], resolvedPageSize)
  };
}

const builtInTemplateSeeds = [
  normalizeTemplate({
    ...deepClone(catalogTemplate),
    kind: "built_in",
    description: "Bundled 2026 four-spread J300 LM machine catalog template"
  }),
  normalizeTemplate({
    ...deepClone(catalogTemplate),
    id: "industrial-slate-template",
    name: "Industrial Slate 2-Page",
    kind: "built_in",
    description: "Cool slate panels and a technical spec treatment for a more engineering-led brochure.",
    page3: null,
    page4: null,
    page1: {
      background: "/api/template-assets/industrial-slate-template/page-1.svg",
      titleRegion: {
        x: 35,
        y: 48,
        width: 286,
        height: 64,
        background: "#f3f6f8"
      },
      heroOverlay: {
        x: 55,
        y: 136,
        width: 238,
        height: 272,
        radius: 24
      },
      columns: [
        { key: "features", x: 338, y: 132, width: 220, height: 216, background: "#43515d" },
        { key: "standardAccessories", x: 32, y: 504, width: 248, height: 178, background: "#3b4854" },
        { key: "optionalAccessories", x: 294, y: 504, width: 264, height: 178, background: "#32404b" }
      ]
    },
    page2: {
      background: "/api/template-assets/industrial-slate-template/page-2.svg",
      specsPanel: {
        x: 30,
        y: 112,
        width: 534,
        height: 668,
        title: "Technical Specifications",
        background: "#fbfcfd",
        borderColor: "#4d6275"
      }
    }
  }),
  normalizeTemplate({
    ...deepClone(catalogTemplate),
    id: "ace-red-template",
    name: "Ace Red Showcase",
    kind: "built_in",
    description: "A warmer sales-ready look with stronger red accents and a lighter title block.",
    page3: null,
    page4: null,
    page1: {
      background: "/api/template-assets/ace-red-template/page-1.svg",
      titleRegion: {
        x: 300,
        y: 54,
        width: 224,
        height: 72,
        background: "#fff4f4"
      },
      heroOverlay: {
        x: 54,
        y: 120,
        width: 220,
        height: 300,
        radius: 28
      },
      columns: [
        { key: "features", x: 26, y: 432, width: 168, height: 206, background: "#8d2a2f" },
        { key: "standardAccessories", x: 202, y: 452, width: 176, height: 190, background: "#a12e34" },
        { key: "optionalAccessories", x: 384, y: 426, width: 176, height: 216, background: "#b43a3f" }
      ]
    },
    page2: {
      background: "/api/template-assets/ace-red-template/page-2.svg",
      specsPanel: {
        x: 248,
        y: 120,
        width: 316,
        height: 632,
        title: "Machine Specifications",
        background: "#fffdfd",
        borderColor: "#b52e33"
      }
    }
  }),
  normalizeTemplate({
    ...deepClone(catalogTemplate),
    id: "precision-green-template",
    name: "Precision Green Catalog",
    kind: "built_in",
    description: "A cleaner plant-floor inspired style with dark green section cards and calmer borders.",
    page3: null,
    page4: null,
    page1: {
      background: "/api/template-assets/precision-green-template/page-1.svg",
      titleRegion: {
        x: 42,
        y: 48,
        width: 236,
        height: 64,
        background: "#f7fbf8"
      },
      heroOverlay: {
        x: 302,
        y: 124,
        width: 220,
        height: 256,
        radius: 26
      },
      columns: [
        { key: "features", x: 40, y: 146, width: 222, height: 150, background: "#31544b" },
        { key: "standardAccessories", x: 40, y: 312, width: 222, height: 198, background: "#3b6257" },
        { key: "optionalAccessories", x: 40, y: 526, width: 518, height: 126, background: "#456f63" }
      ]
    },
    page2: {
      background: "/api/template-assets/precision-green-template/page-2.svg",
      specsPanel: {
        x: 48,
        y: 108,
        width: 500,
        height: 648,
        title: "Performance Specifications",
        background: "#fcfffd",
        borderColor: "#2e6a56"
      }
    }
  })
];

function writeTemplate(template) {
  const normalized = normalizeTemplate(template);
  fs.writeFileSync(templateFilePath(normalized.id), JSON.stringify(normalized, null, 2));
  return normalized;
}

function readTemplate(templateId) {
  const filePath = templateFilePath(templateId);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return normalizeTemplate(JSON.parse(fs.readFileSync(filePath, "utf8")));
}

function nextTemplateId(name) {
  const baseId = slugifyTemplateId(name) || "template";
  let candidate = baseId;
  let suffix = 2;

  while (fs.existsSync(templateFilePath(candidate))) {
    candidate = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function guessImageExtension(file) {
  const ext = path.extname(file?.originalname || "").toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
    return ext;
  }

  const mimeType = String(file?.mimetype || file?.mimeType || "").toLowerCase();

  if (mimeType.includes("png")) {
    return ".png";
  }

  if (mimeType.includes("webp")) {
    return ".webp";
  }

  return ".jpg";
}

function guessSourceDesignExtension(file) {
  const ext = path.extname(file?.originalname || "").toLowerCase();
  if (ext) {
    return ext;
  }

  const mimeType = String(file?.mimetype || "").toLowerCase();
  if (mimeType.includes("pdf")) {
    return ".pdf";
  }

  if (mimeType.includes("svg")) {
    return ".svg";
  }

  if (mimeType.includes("postscript")) {
    return ".eps";
  }

  if (mimeType.includes("zip")) {
    return ".zip";
  }

  return ".bin";
}

function writeTemplateAsset(templateId, baseName, file) {
  const assetDir = path.join(templateAssetsRoot, templateId);
  const ext = guessImageExtension(file);
  const fileName = `${baseName}${ext}`;

  ensureDirectory(assetDir);
  fs.writeFileSync(path.join(assetDir, fileName), file.buffer);

  return `/api/template-assets/${templateId}/${fileName}`;
}

function writeTemplateSvgAsset(templateId, baseName, svgContent) {
  const assetDir = path.join(templateAssetsRoot, templateId);
  const fileName = `${baseName}.svg`;

  ensureDirectory(assetDir);
  fs.writeFileSync(path.join(assetDir, fileName), svgContent, "utf8");

  return `/api/template-assets/${templateId}/${fileName}`;
}

function writeTemplateSourceAsset(templateId, file) {
  const assetDir = path.join(templateAssetsRoot, templateId);
  const ext = guessSourceDesignExtension(file);
  const fileName = `source-design${ext}`;

  ensureDirectory(assetDir);
  fs.writeFileSync(path.join(assetDir, fileName), file.buffer);

  return {
    name: file.originalname || `source-design${ext}`,
    mimeType: file.mimetype || "application/octet-stream",
    assetUrl: `/api/template-assets/${templateId}/${fileName}`
  };
}

function isHexColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(String(value || "").trim());
}

function pickColor(value, fallback) {
  return isHexColor(value) ? value.trim() : fallback;
}

function renderPage1BackgroundSvg(design = {}) {
  const style = String(design.style || "technical-cover");
  const primary = pickColor(design.primary, "#24446c");
  const secondary = pickColor(design.secondary, "#2e5a89");
  const accent = pickColor(design.accent, "#3e70a5");
  const surface = pickColor(design.surface, "#f5f8fb");
  const neutral = pickColor(design.neutral, "#e8eef4");

  if (style === "diagonal-bands") {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="595" height="842" viewBox="0 0 595 842">
  <rect width="595" height="842" fill="${surface}"/>
  <rect width="595" height="842" fill="${neutral}" opacity="0.28"/>
  <polygon points="0,0 280,0 80,842 0,842" fill="${primary}"/>
  <polygon points="220,0 595,0 595,842 90,842" fill="${secondary}" opacity="0.94"/>
  <polygon points="308,0 595,0 595,126 246,314" fill="${accent}" opacity="0.88"/>
  <rect x="34" y="40" width="228" height="76" rx="24" fill="#ffffff" opacity="0.92"/>
  <rect x="312" y="154" width="230" height="118" rx="24" fill="#ffffff" opacity="0.94"/>
  <rect x="312" y="292" width="230" height="128" rx="24" fill="#ffffff" opacity="0.94"/>
  <rect x="312" y="440" width="230" height="146" rx="24" fill="#ffffff" opacity="0.94"/>
</svg>`;
  }

  if (style === "panel-stack") {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="595" height="842" viewBox="0 0 595 842">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${surface}"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>
  </defs>
  <rect width="595" height="842" fill="url(#bg)"/>
  <rect x="0" y="0" width="595" height="136" fill="${primary}" opacity="0.14"/>
  <rect x="28" y="170" width="236" height="170" rx="28" fill="${neutral}" opacity="0.78"/>
  <rect x="284" y="112" width="242" height="278" rx="28" fill="${primary}" opacity="0.18"/>
  <rect x="38" y="404" width="506" height="102" rx="26" fill="${secondary}" opacity="0.94"/>
  <rect x="38" y="524" width="238" height="150" rx="26" fill="${primary}" opacity="0.96"/>
  <rect x="306" y="524" width="238" height="150" rx="26" fill="${accent}" opacity="0.96"/>
  <rect x="44" y="52" width="246" height="70" rx="24" fill="#ffffff" opacity="0.94"/>
</svg>`;
  }

  if (style === "wave-corporate") {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="595" height="842" viewBox="0 0 595 842">
  <defs>
    <linearGradient id="waveFill" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${secondary}"/>
      <stop offset="100%" stop-color="${accent}"/>
    </linearGradient>
  </defs>
  <rect width="595" height="842" fill="#ffffff"/>
  <path d="M0 90 C120 20 248 20 356 62 C452 98 526 90 595 56 L595 0 L0 0 Z" fill="${primary}"/>
  <path d="M0 214 C116 140 226 132 342 166 C438 194 516 194 595 152 L595 280 L0 330 Z" fill="url(#waveFill)" opacity="0.98"/>
  <circle cx="520" cy="118" r="124" fill="${neutral}" opacity="0.52"/>
  <rect x="40" y="70" width="226" height="68" rx="24" fill="#ffffff" opacity="0.94"/>
  <rect x="314" y="128" width="220" height="268" rx="30" fill="#ffffff" opacity="0.96"/>
  <rect x="32" y="500" width="160" height="178" rx="24" fill="${primary}" opacity="0.96"/>
  <rect x="208" y="500" width="160" height="178" rx="24" fill="${secondary}" opacity="0.96"/>
  <rect x="384" y="500" width="160" height="178" rx="24" fill="${accent}" opacity="0.96"/>
</svg>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="595" height="842" viewBox="0 0 595 842">
  <defs>
    <linearGradient id="bgTech" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${surface}"/>
      <stop offset="100%" stop-color="#eef3f8"/>
    </linearGradient>
  </defs>
  <rect width="595" height="842" fill="url(#bgTech)"/>
  <rect x="0" y="0" width="595" height="94" fill="${primary}"/>
  <path d="M0 176 C146 108 246 104 336 140 C432 176 510 170 595 126 L595 214 L0 258 Z" fill="${secondary}" opacity="0.96"/>
  <rect x="34" y="38" width="214" height="70" rx="24" fill="#ffffff" opacity="0.94"/>
  <rect x="304" y="110" width="242" height="276" rx="28" fill="#ffffff" opacity="0.96"/>
  <rect x="28" y="470" width="170" height="222" rx="24" fill="${primary}" opacity="0.96"/>
  <rect x="212" y="470" width="170" height="222" rx="24" fill="${secondary}" opacity="0.96"/>
  <rect x="396" y="470" width="170" height="222" rx="24" fill="${accent}" opacity="0.96"/>
  <rect x="0" y="734" width="595" height="108" fill="${primary}" opacity="0.96"/>
</svg>`;
}

function renderPage2BackgroundSvg(design = {}) {
  const style = String(design.style || "clean-spec");
  const primary = pickColor(design.primary, "#2e5f99");
  const secondary = pickColor(design.secondary, "#2e5a89");
  const accent = pickColor(design.accent, "#3e70a5");
  const surface = pickColor(design.surface, "#fcfdff");
  const neutral = pickColor(design.neutral, "#f2f7ff");

  if (style === "split-spec") {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="595" height="842" viewBox="0 0 595 842">
  <rect width="595" height="842" fill="${surface}"/>
  <rect x="0" y="0" width="150" height="842" fill="${primary}"/>
  <rect x="150" y="0" width="445" height="108" fill="${secondary}" opacity="0.92"/>
  <rect x="164" y="118" width="390" height="642" rx="28" fill="#ffffff" opacity="0.97"/>
  <rect x="182" y="150" width="354" height="18" rx="9" fill="${neutral}"/>
  <rect x="182" y="186" width="354" height="14" rx="7" fill="${neutral}" opacity="0.8"/>
  <rect x="182" y="214" width="354" height="14" rx="7" fill="${neutral}" opacity="0.8"/>
  <rect x="182" y="242" width="354" height="14" rx="7" fill="${neutral}" opacity="0.8"/>
</svg>`;
  }

  if (style === "header-band") {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="595" height="842" viewBox="0 0 595 842">
  <defs>
    <linearGradient id="topBand" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${accent}"/>
    </linearGradient>
  </defs>
  <rect width="595" height="842" fill="${surface}"/>
  <rect x="0" y="0" width="595" height="126" fill="url(#topBand)"/>
  <rect x="36" y="146" width="524" height="614" rx="30" fill="#ffffff" opacity="0.97"/>
  <rect x="54" y="176" width="488" height="18" rx="9" fill="${neutral}"/>
  <rect x="54" y="210" width="488" height="14" rx="7" fill="${neutral}" opacity="0.8"/>
  <rect x="54" y="238" width="488" height="14" rx="7" fill="${neutral}" opacity="0.8"/>
  <rect x="54" y="266" width="488" height="14" rx="7" fill="${neutral}" opacity="0.8"/>
  <rect x="0" y="776" width="595" height="66" fill="${primary}" opacity="0.92"/>
</svg>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="595" height="842" viewBox="0 0 595 842">
  <rect width="595" height="842" fill="${surface}"/>
  <rect x="26" y="30" width="543" height="92" rx="28" fill="${primary}"/>
  <rect x="26" y="142" width="543" height="620" rx="30" fill="#ffffff" opacity="0.97"/>
  <rect x="44" y="170" width="507" height="18" rx="9" fill="${neutral}"/>
  <rect x="44" y="204" width="507" height="14" rx="7" fill="${neutral}" opacity="0.8"/>
  <rect x="44" y="232" width="507" height="14" rx="7" fill="${neutral}" opacity="0.8"/>
  <rect x="44" y="260" width="507" height="14" rx="7" fill="${neutral}" opacity="0.8"/>
  <rect x="0" y="772" width="595" height="70" fill="${secondary}" opacity="0.92"/>
</svg>`;
}

function applyGeneratedBackgroundDesign(templateId, template, backgroundDesign) {
  if (!backgroundDesign || typeof backgroundDesign !== "object") {
    return template;
  }

  const next = deepClone(template);

  if (backgroundDesign.page1) {
    next.page1.background = writeTemplateSvgAsset(templateId, "page-1", renderPage1BackgroundSvg(backgroundDesign.page1));
  }

  if (backgroundDesign.page2) {
    next.page2.background = writeTemplateSvgAsset(templateId, "page-2", renderPage2BackgroundSvg(backgroundDesign.page2));
  }

  return next;
}

function applyTemplatePatch(template, patch = {}) {
  if (!patch || typeof patch !== "object") {
    return normalizeTemplate(template);
  }

  const merged = deepClone(template);

  if (patch.name) {
    merged.name = patch.name;
  }

  if (patch.description) {
    merged.description = patch.description;
  }

  if (patch.brandFrame) {
    merged.brandFrame = patch.brandFrame;
  }

  if (typeof patch.regionDetectionVersion === "string" && patch.regionDetectionVersion.trim()) {
    merged.regionDetectionVersion = patch.regionDetectionVersion.trim();
  }

  if (Array.isArray(patch.editableRegions)) {
    merged.editableRegions = patch.editableRegions;
  }

  if (patch.page1) {
    merged.page1 = {
      ...merged.page1,
      ...patch.page1,
      titleRegion: {
        ...merged.page1.titleRegion,
        ...(patch.page1.titleRegion || {})
      },
      heroOverlay: {
        ...merged.page1.heroOverlay,
        ...(patch.page1.heroOverlay || {})
      },
      columns: patch.page1.columns
        ? mergeColumns(merged.page1.columns, patch.page1.columns)
        : merged.page1.columns
    };
  }

  if (patch.page2) {
    merged.page2 = {
      ...merged.page2,
      ...patch.page2,
      specsPanel: {
        ...merged.page2.specsPanel,
        ...(patch.page2.specsPanel || {})
      }
    };
  }

  merged.updatedAt = nowIso();
  return normalizeTemplate(merged);
}

export function initializeTemplateStore() {
  ensureDirectory(templatesRoot);
  ensureDirectory(templateAssetsRoot);
  ensureScratchTemplateAssets();

  for (const seed of builtInTemplateSeeds) {
    const filePath = templateFilePath(seed.id);
    const existingTemplate = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, "utf8"))
      : null;
    const needsBuiltInRefresh = seed.id === catalogTemplate.id
      && existingTemplate?.templateRevision !== seed.templateRevision;

    if (!existingTemplate || needsBuiltInRefresh) {
      writeTemplate(seed);
    }
  }
}

export function listTemplates() {
  initializeTemplateStore();

  return fs.readdirSync(templatesRoot)
    .filter((entry) => entry.toLowerCase().endsWith(".json"))
    .map((entry) => readTemplate(path.basename(entry, ".json")))
    .filter(Boolean)
    .sort((left, right) => {
      if (left.kind === "built_in" && right.kind !== "built_in") {
        return -1;
      }

      if (left.kind !== "built_in" && right.kind === "built_in") {
        return 1;
      }

      return String(left.name).localeCompare(String(right.name));
    });
}

export function getTemplateById(templateId) {
  initializeTemplateStore();
  if (templateId === BLANK_TEMPLATE_ID) {
    return getScratchTemplateSeed();
  }
  return readTemplate(templateId) || builtInTemplateSeeds.find((seed) => seed.id === templateId) || null;
}

export function createTemplate({
  name,
  description,
  sourceTemplateId = catalogTemplate.id,
  patch = null,
  backgroundDesign = null,
  pageSizeOverride = null,
  page1File = null,
  page2File = null,
  heroPlaceholderFile = null,
  sourceDesignFile = null
}) {
  initializeTemplateStore();

  const sourceTemplate = sourceTemplateId === BLANK_TEMPLATE_ID
    ? getScratchTemplateSeed()
    : getTemplateById(sourceTemplateId) || builtInTemplateSeeds[0];
  const trimmedName = String(name || "").trim() || "Untitled Template";
  const templateId = nextTemplateId(trimmedName);
  let template = normalizeTemplate({
    ...deepClone(sourceTemplate),
    id: templateId,
    name: trimmedName,
    description: description || sourceTemplate.description,
    kind: "custom",
    sourceTemplateId: sourceTemplate.id === BLANK_TEMPLATE_ID ? null : sourceTemplate.id,
    createdAt: nowIso(),
    updatedAt: nowIso()
  });

  template = applyTemplatePatch(template, patch);
  template.id = templateId;
  template.name = trimmedName;
  template.kind = "custom";
  template.sourceTemplateId = sourceTemplate.id === BLANK_TEMPLATE_ID ? null : sourceTemplate.id;

  if (pageSizeOverride?.width && pageSizeOverride?.height) {
    template.pageSize = {
      width: pageSizeOverride.width,
      height: pageSizeOverride.height
    };
  }

  template = applyGeneratedBackgroundDesign(templateId, template, backgroundDesign);

  if (page1File) {
    template.page1.background = writeTemplateAsset(templateId, "page-1", page1File);
  }

  if (page2File) {
    template.page2.background = writeTemplateAsset(templateId, "page-2", page2File);
  }

  if (heroPlaceholderFile) {
    template.page1.heroOverlay.placeholderImage = writeTemplateAsset(templateId, "hero-placeholder", heroPlaceholderFile);
  }

  if (sourceDesignFile) {
    template.sourceDesign = writeTemplateSourceAsset(templateId, sourceDesignFile);
  }

  return writeTemplate(template);
}

export function updateTemplate(templateId, {
  updates = null,
  backgroundDesign = null,
  pageSizeOverride = null,
  page1File = null,
  page2File = null,
  heroPlaceholderFile = null,
  sourceDesignFile = null
} = {}) {
  initializeTemplateStore();
  const existing = getTemplateById(templateId);
  if (!existing) {
    return null;
  }

  let template = applyTemplatePatch(existing, updates);

  if (pageSizeOverride?.width && pageSizeOverride?.height) {
    template.pageSize = {
      width: pageSizeOverride.width,
      height: pageSizeOverride.height
    };
  }

  template = applyGeneratedBackgroundDesign(templateId, template, backgroundDesign);

  if (page1File) {
    template.page1.background = writeTemplateAsset(templateId, "page-1", page1File);
  }

  if (page2File) {
    template.page2.background = writeTemplateAsset(templateId, "page-2", page2File);
  }

  if (heroPlaceholderFile) {
    template.page1.heroOverlay.placeholderImage = writeTemplateAsset(templateId, "hero-placeholder", heroPlaceholderFile);
  }

  if (sourceDesignFile) {
    template.sourceDesign = writeTemplateSourceAsset(templateId, sourceDesignFile);
  }

  template.updatedAt = nowIso();
  return writeTemplate(template);
}

export function deleteTemplate(templateId) {
  initializeTemplateStore();

  const existing = readTemplate(templateId);
  if (!existing) {
    return null;
  }

  if (existing.kind !== "custom") {
    return false;
  }

  const filePath = templateFilePath(templateId);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  const assetDir = path.join(templateAssetsRoot, templateId);
  if (fs.existsSync(assetDir)) {
    fs.rmSync(assetDir, { recursive: true, force: true });
  }

  return existing;
}

export function resolveTemplateBackgroundPath(backgroundPath) {
  return resolveExistingAssetPath(backgroundPath);
}
