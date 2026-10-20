import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const samplePrompts = [
  "Update maximum spindle speed to 4500 rpm and change standard chuck size to 200 mm.",
  "Add coolant auto-monitor under optional accessories and add machine health dashboard under machine features.",
  "Create a Kannada version of this catalog and fit the content within the template."
];

const sampleTemplatePrompts = [
  "Create an exact-match reusable template based on the uploaded original catalog PDF.",
  "Use the uploaded source design and rebuild it as an editable industrial brochure template.",
  "Create a clean VMC brochure template from the uploaded source file and keep the specifications panel prominent."
];

function getCatalogPromptSuggestions(regionKey, regionMeta = null) {
  if (isEditableRegionKey(regionKey) || regionMeta?.dynamic) {
    const label = regionMeta?.label || "selected area";

    if (regionMeta?.type === "image") {
      return [
        `Replace the image in ${label} with the attached file and keep the layout print-ready.`,
        `Update the visual used in ${label} and keep it fitted cleanly inside the template.`
      ];
    }

    return [
      `Rewrite the text inside ${label} and keep it aligned to the current template.`,
      `Shorten the copy in ${label} but preserve the meaning and make it print-ready.`
    ];
  }

  switch (regionKey) {
    case "titleRegion":
      return [
        "Update the catalog title and machine category, and keep the cover balanced.",
        "Rewrite the cover title to sound more premium and fit the current template."
      ];
    case "heroOverlay":
      return [
        "Replace the machine image with the attached file and keep the cover print-ready.",
        "Use the attached machine photo for the cover and fit it cleanly inside the template."
      ];
    case "features":
      return [
        "Add one machine feature and fit the content within the template.",
        "Shorten the machine features copy but keep the technical meaning."
      ];
    case "standardAccessories":
      return [
        "Update the standard accessories list and keep the layout print-ready.",
        "Remove one standard accessory line and tighten the content."
      ];
    case "optionalAccessories":
      return [
        "Add two optional accessories and fit the content within the template.",
        "Remove one optional accessory and rebalance the first page."
      ];
    case "specsPanel":
      return [
        "Update Swing Over Bed to 800 mm and keep the specification page aligned.",
        "Translate the catalog to Kannada and fit the specification content to the template."
      ];
    default:
      return samplePrompts;
  }
}

function canManuallySaveCatalogRegion(regionKey) {
  return isEditableRegionKey(regionKey)
    || ["titleRegion", "heroOverlay", "features", "standardAccessories", "optionalAccessories"].includes(regionKey);
}

function canInlineEditCatalogRegion(regionKey) {
  return isEditableRegionKey(regionKey)
    || ["titleRegion", "features", "standardAccessories", "optionalAccessories"].includes(regionKey);
}

const BLANK_TEMPLATE_ID = "__blank__";
const defaultPageSize = {
  width: 595.276,
  height: 841.89
};
const templatePreviewHeroImage = "/api/assets/j300/default-hero-trimmed.png";
const templatePreviewCatalog = {
  title: "J 300 LM",
  features: ["Powerful spindle", "Guide ways", "Fast traverse"],
  standardAccessories: ["AC spindle drives", "LM guideways", "Oil lubrication"],
  optionalAccessories: ["Chip conveyor", "Coolant system", "MachineConnect"]
};

const supportedLanguages = [
  "English",
  "Assamese",
  "Bengali",
  "Bodo",
  "Dogri",
  "Gujarati",
  "Hindi",
  "Kannada",
  "Kashmiri",
  "Konkani",
  "Maithili",
  "Malayalam",
  "Manipuri",
  "Marathi",
  "Nepali",
  "Odia",
  "Punjabi",
  "Sanskrit",
  "Santali",
  "Sindhi",
  "Tamil",
  "Telugu",
  "Urdu",
  "Arabic"
];

const languageCodes = {
  assamese: "as",
  bengali: "bn",
  bodo: "brx",
  dogri: "doi",
  gujarati: "gu",
  hindi: "hi",
  kannada: "kn",
  kashmiri: "ks",
  konkani: "kok",
  maithili: "mai",
  malayalam: "ml",
  manipuri: "mni",
  marathi: "mr",
  nepali: "ne",
  odia: "or",
  punjabi: "pa",
  sanskrit: "sa",
  santali: "sat",
  sindhi: "sd",
  tamil: "ta",
  telugu: "te",
  urdu: "ur",
  arabic: "ar"
};

const legacyTemplateRegionMeta = [
  { key: "titleRegion", label: "Title Box", page: "page1" },
  { key: "heroOverlay", label: "Image Area", page: "page1" },
  { key: "features", label: "Machine Features", page: "page1" },
  { key: "standardAccessories", label: "Standard Accessories", page: "page1" },
  { key: "optionalAccessories", label: "Optional Accessories", page: "page1" },
  { key: "specsPanel", label: "Specifications Panel", page: "page2" }
];

const editableRegionPrefix = "editable:";

const pageMetaById = {
  dashboard: {
    label: "Dashboard",
    description: "Prompt-based editing, version review, approval, and export."
  },
  templates: {
    label: "Template",
    description: "Browse existing layouts, apply one to the active catalog, or create a new reusable template."
  },
  catalogs: {
    label: "Catalog",
    description: "Select from existing catalogs or upload a new PDF catalog into the library."
  },
  "template-create": {
    label: "Create Template",
    description: "Create a new brochure template by prompt, optional reference image, and brand assets."
  }
};

const sidebarMenuPages = [
  {
    id: "templates",
    label: "Template"
  },
  {
    id: "catalogs",
    label: "Catalog"
  }
];

const catalogEditorRegions = [
  {
    key: "titleRegion",
    label: "Cover Title",
    pageId: "page1",
    page: "Page 1",
    description: "Catalog title and machine category"
  },
  {
    key: "heroOverlay",
    label: "Machine Image",
    pageId: "page1",
    page: "Page 1",
    description: "Main machine visual on the cover"
  },
  {
    key: "features",
    label: "Machine Features",
    pageId: "page1",
    page: "Page 1",
    description: "Feature bullets"
  },
  {
    key: "standardAccessories",
    label: "Standard Accessories",
    pageId: "page1",
    page: "Page 1",
    description: "Included accessories"
  },
  {
    key: "optionalAccessories",
    label: "Optional Accessories",
    pageId: "page1",
    page: "Page 1",
    description: "Add-on accessories"
  },
  {
    key: "specsPanel",
    label: "Specifications",
    pageId: "page2",
    page: "Page 2",
    description: "Detailed technical specification table"
  }
];

const catalogEditorPages = [
  {
    id: "page1",
    label: "Page 1",
    title: "Cover Layout",
    description: "Title, machine image, and accessory columns"
  },
  {
    id: "page2",
    label: "Page 2",
    title: "Specifications Page",
    description: "Detailed technical specs and print review"
  }
];

const templateImageRegionFallbacks = {
  "industrial-machine-catalog-template-2": {
    "page1-image-area-1": {
      imageMatteColor: "#fbc60a",
      clipPath: "polygon(0 0, 32% 0, 36% 1%, 40% 4%, 45% 3%, 49% 6%, 54% 5%, 59% 2%, 63% 0, 100% 0, 100% 92%, 93% 94%, 86% 93%, 79% 96%, 70% 93%, 61% 96%, 52% 92%, 43% 95%, 33% 92%, 22% 95%, 12% 92%, 0 94%)"
    },
    "page1-image-area-2": {
      imageMatteColor: "#fbc60a",
      clipPath: "polygon(0 14%, 8% 11%, 17% 12%, 26% 8%, 36% 10%, 46% 6%, 56% 9%, 66% 5%, 76% 8%, 86% 6%, 94% 9%, 100% 8%, 100% 100%, 0 100%)"
    },
    "page2-image-area-1": {
      imageMatteColor: "#ffffff",
      clipPath: "polygon(0 0, 100% 0, 100% 83%, 93% 88%, 85% 84%, 77% 90%, 68% 85%, 58% 92%, 48% 86%, 38% 90%, 27% 84%, 17% 88%, 8% 82%, 0 85%)"
    },
    "page2-image-area-2": {
      imageMatteColor: "#fbc60a",
      clipPath: "polygon(0 14%, 8% 11%, 17% 12%, 26% 8%, 36% 10%, 46% 6%, 56% 9%, 66% 5%, 76% 8%, 86% 6%, 94% 9%, 100% 8%, 100% 100%, 0 100%)"
    }
  }
};

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => reject(reader.error || new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });
}

async function readImageFileAsset(file) {
  const src = await readFileAsDataUrl(file);
  if (!src) {
    return null;
  }

  if (typeof window === "undefined") {
    return {
      src,
      naturalWidth: 0,
      naturalHeight: 0
    };
  }

  const image = await loadBrowserImage(src).catch(() => null);
  return {
    src,
    naturalWidth: image?.naturalWidth || image?.width || 0,
    naturalHeight: image?.naturalHeight || image?.height || 0
  };
}

function hasFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

function ensureEditableRegionOriginalFrame(region) {
  if (!region || typeof region !== "object") {
    return region;
  }

  const safeX = hasFiniteNumber(region.originalX) ? Number(region.originalX) : Number(region.x) || 0;
  const safeY = hasFiniteNumber(region.originalY) ? Number(region.originalY) : Number(region.y) || 0;
  const safeWidth = hasFiniteNumber(region.originalWidth) ? Number(region.originalWidth) : Number(region.width) || 0;
  const safeHeight = hasFiniteNumber(region.originalHeight) ? Number(region.originalHeight) : Number(region.height) || 0;

  return {
    ...region,
    originalX: safeX,
    originalY: safeY,
    originalWidth: safeWidth,
    originalHeight: safeHeight
  };
}

function createTemplateDraft(template) {
  if (!template) {
    return null;
  }

  const next = deepClone(template);
  next.editableRegions = (next.editableRegions || []).map((region) => ensureEditableRegionOriginalFrame(region));
  return next;
}

function formatListForTextarea(items = []) {
  return items.join("\n");
}

function normalizeTextareaListItems(value = "") {
  return String(value)
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function countFilledLines(text = "") {
  return String(text)
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean).length;
}

function getRegionPromptSuggestions(regionKey) {
  switch (regionKey) {
    case "titleRegion":
      return [
        "Rewrite the cover title to sound more premium and fit the title box.",
        "Update the machine category wording and keep the cover layout balanced."
      ];
    case "heroOverlay":
      return [
        "Replace the machine visual using the attached image and keep the same clean framing.",
        "Use the attached image as reference and make the cover machine visual more premium."
      ];
    case "features":
      return [
        "Add one machine feature and fit the content within the template.",
        "Shorten the machine features copy but keep the technical meaning."
      ];
    case "standardAccessories":
      return [
        "Update the standard accessories list and fit the content within the template.",
        "Remove one standard accessory line and keep the layout clean."
      ];
    case "optionalAccessories":
      return [
        "Add two optional accessories and fit the content within the template.",
        "Remove MachineConnect from optional accessories and tighten the layout."
      ];
    case "specsPanel":
      return [
        "Update Swing Over Bed to 800 mm and fit the specifications within the template.",
        "Translate this catalog to Kannada and fit the content within the template."
      ];
    default:
      return samplePrompts.slice(0, 2);
  }
}

function isTranslatedLanguage(language) {
  return Boolean(language) && String(language).toLowerCase() !== "english";
}

function isDevanagariLanguage(language) {
  return ["dogri", "hindi", "konkani", "maithili", "marathi", "nepali", "sanskrit"].includes(String(language || "").toLowerCase());
}

function isRtlLanguage(language) {
  return ["arabic", "kashmiri", "sindhi", "urdu"].includes(String(language || "").toLowerCase());
}

function getLanguageCode(language) {
  return languageCodes[String(language || "").toLowerCase()] || "en";
}

function makeEditableRegionKey(regionId) {
  return `${editableRegionPrefix}${regionId}`;
}

function isEditableRegionKey(regionKey) {
  return String(regionKey || "").startsWith(editableRegionPrefix);
}

function getEditableRegionId(regionKey) {
  return isEditableRegionKey(regionKey)
    ? String(regionKey).slice(editableRegionPrefix.length)
    : null;
}

function normalizeTemplateRegionPage(page) {
  const normalized = String(page || "").toLowerCase();
  return ["page1", "page2", "page3", "page4"].includes(normalized) ? normalized : "page1";
}

function getTemplatePageIds(template) {
  return ["page1", "page2", "page3", "page4"].filter((pageId) => template?.[pageId]?.background);
}

function getTemplatePageLabel(pageId) {
  return `Page ${Math.max(1, Number.parseInt(String(pageId).replace("page", ""), 10) || 1)}`;
}

function getTemplateEditorRegionOptions(template) {
  if (!template) {
    return [];
  }

  const editableRegions = Array.isArray(template.editableRegions)
    ? template.editableRegions.filter((region) => region && typeof region === "object")
    : [];

  if (editableRegions.length) {
    return editableRegions.map((region, index) => {
      const page = normalizeTemplateRegionPage(region.page);
      const type = String(region.type || "").toLowerCase() === "image" ? "image" : "text";
      return {
        key: makeEditableRegionKey(region.id || `region-${index + 1}`),
        label: region.label || (type === "image" ? `Image ${index + 1}` : `Text ${index + 1}`),
        page,
        pageLabel: getTemplatePageLabel(page),
        type,
        dynamic: true,
        hidden: Boolean(region.hidden),
        deleted: Boolean(region.deleted)
      };
    });
  }

  return legacyTemplateRegionMeta.map((item) => {
    const region = getTemplateRegion(template, item.key);
    const page = normalizeTemplateRegionPage(region?.page || item.page);

    return {
      ...item,
      page,
      pageLabel: getTemplatePageLabel(page),
      type: item.key === "heroOverlay" ? "image" : "text",
      dynamic: false,
      hidden: Boolean(region?.hidden)
    };
  });
}

function getDefaultTemplateRegionKey(template) {
  const regionOptions = getTemplateEditorRegionOptions(template);
  const firstVisible = regionOptions.find((item) => !item.hidden);
  return firstVisible?.key || regionOptions[0]?.key || "heroOverlay";
}

function getDynamicRegionOriginalContent(region) {
  if (!region) {
    return "";
  }

  return typeof region.originalContent === "string"
    ? region.originalContent
    : (typeof region.content === "string" ? region.content : "");
}

function getDynamicRegionOriginalImage(region) {
  if (!region) {
    return null;
  }

  return typeof region.originalImageSrc === "string" && region.originalImageSrc.trim()
    ? region.originalImageSrc
    : null;
}

function hasDynamicTextOverride(region) {
  return String(region?.content || "").trim() !== String(getDynamicRegionOriginalContent(region) || "").trim();
}

function hasDynamicImageOverride(region) {
  return Boolean(region?.imageSrc) && region.imageSrc !== getDynamicRegionOriginalImage(region);
}

function isDynamicRegionDeleted(region) {
  return Boolean(region?.deleted);
}

function getRegionFrame(region) {
  return {
    x: Number(region?.x) || 0,
    y: Number(region?.y) || 0,
    width: Number(region?.width) || 0,
    height: Number(region?.height) || 0
  };
}

function getOriginalRegionFrame(region) {
  return {
    x: hasFiniteNumber(region?.originalX) ? Number(region.originalX) : Number(region?.x) || 0,
    y: hasFiniteNumber(region?.originalY) ? Number(region.originalY) : Number(region?.y) || 0,
    width: hasFiniteNumber(region?.originalWidth) ? Number(region.originalWidth) : Number(region?.width) || 0,
    height: hasFiniteNumber(region?.originalHeight) ? Number(region.originalHeight) : Number(region?.height) || 0
  };
}

function hasDynamicGeometryOverride(region) {
  if (!region) {
    return false;
  }

  const current = getRegionFrame(region);
  const original = getOriginalRegionFrame(region);

  return (
    Math.abs(current.x - original.x) >= 1 ||
    Math.abs(current.y - original.y) >= 1 ||
    Math.abs(current.width - original.width) >= 1 ||
    Math.abs(current.height - original.height) >= 1
  );
}

function isTransparentRegionBackground(background) {
  const value = String(background || "").trim().toLowerCase();
  if (!value || value === "transparent") {
    return true;
  }

  const rgbaMatch = value.match(/^rgba\(([^)]+)\)$/i);
  if (!rgbaMatch) {
    return false;
  }

  const parts = rgbaMatch[1].split(",").map((item) => Number(item.trim()));
  const alpha = parts[3];
  return Number.isFinite(alpha) && alpha <= 0.04;
}

function parseCssColor(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return null;
  }

  if (raw.startsWith("#")) {
    const hex = raw.slice(1);
    if (hex.length === 3) {
      return {
        red: Number.parseInt(hex[0] + hex[0], 16),
        green: Number.parseInt(hex[1] + hex[1], 16),
        blue: Number.parseInt(hex[2] + hex[2], 16),
        alpha: 1
      };
    }

    if (hex.length === 6) {
      return {
        red: Number.parseInt(hex.slice(0, 2), 16),
        green: Number.parseInt(hex.slice(2, 4), 16),
        blue: Number.parseInt(hex.slice(4, 6), 16),
        alpha: 1
      };
    }

    return null;
  }

  const rgbMatch = raw.match(/^rgba?\(([^)]+)\)$/i);
  if (!rgbMatch) {
    return null;
  }

  const parts = rgbMatch[1].split(",").map((item) => item.trim());
  if (parts.length < 3) {
    return null;
  }

  const red = Number(parts[0]);
  const green = Number(parts[1]);
  const blue = Number(parts[2]);
  const alpha = parts.length >= 4 ? Number(parts[3]) : 1;

  if (![red, green, blue].every(Number.isFinite)) {
    return null;
  }

  return {
    red: clamp(Math.round(red), 0, 255),
    green: clamp(Math.round(green), 0, 255),
    blue: clamp(Math.round(blue), 0, 255),
    alpha: Number.isFinite(alpha) ? Math.max(0, Math.min(alpha, 1)) : 1
  };
}

function flattenColorOnWhite(color) {
  if (!color) {
    return null;
  }

  const alpha = Number.isFinite(color.alpha) ? color.alpha : 1;
  if (alpha >= 0.995) {
    return {
      red: color.red,
      green: color.green,
      blue: color.blue
    };
  }

  return {
    red: Math.round((color.red * alpha) + (255 * (1 - alpha))),
    green: Math.round((color.green * alpha) + (255 * (1 - alpha))),
    blue: Math.round((color.blue * alpha) + (255 * (1 - alpha)))
  };
}

function getRelativeLuminance(color) {
  if (!color) {
    return 1;
  }

  const channels = [color.red, color.green, color.blue].map((value) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
}

function getContrastRatio(colorA, colorB) {
  const first = getRelativeLuminance(flattenColorOnWhite(colorA));
  const second = getRelativeLuminance(flattenColorOnWhite(colorB));
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

function getReadableTextColor(preferredColor, backgroundColor) {
  const background = flattenColorOnWhite(parseCssColor(backgroundColor));
  if (!background) {
    return preferredColor || "#1f2933";
  }

  const preferred = flattenColorOnWhite(parseCssColor(preferredColor));
  if (preferred && getContrastRatio(preferred, background) >= 4.2) {
    return preferredColor;
  }

  return getRelativeLuminance(background) <= 0.32 ? "#ffffff" : "#111111";
}

function getReadablePlaceholderColor(textColor, backgroundColor) {
  const background = flattenColorOnWhite(parseCssColor(backgroundColor));
  const resolvedTextColor = flattenColorOnWhite(parseCssColor(textColor));

  if (!background || !resolvedTextColor) {
    return "rgba(52, 66, 78, 0.45)";
  }

  return getRelativeLuminance(background) <= 0.32
    ? "rgba(255,255,255,0.7)"
    : "rgba(17,17,17,0.42)";
}

function getRegionBackgroundSize(objectFit) {
  const fit = String(objectFit || "").trim().toLowerCase();
  if (fit === "contain" || fit === "cover") {
    return fit;
  }

  if (fit === "fill") {
    return "100% 100%";
  }

  return "cover";
}

function getTemplateImageRegionFallback(templateId, regionId) {
  if (!templateId || !regionId) {
    return null;
  }

  return templateImageRegionFallbacks[String(templateId)]?.[String(regionId)] || null;
}

function getRegionImageScale(region) {
  const scale = Number(region?.imageScale);
  if (!Number.isFinite(scale) || scale <= 0) {
    return 1;
  }

  return clamp(scale, 1, 4);
}

function getRegionImageNaturalSize(region) {
  const width = Number(region?.imageNaturalWidth);
  const height = Number(region?.imageNaturalHeight);

  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    return null;
  }

  return { width, height };
}

function getRegionImageOffset(region) {
  return {
    x: Number.isFinite(Number(region?.imageOffsetX)) ? Number(region.imageOffsetX) : 0,
    y: Number.isFinite(Number(region?.imageOffsetY)) ? Number(region.imageOffsetY) : 0
  };
}

function getRegionImageBaseSize(region, frameWidth, frameHeight) {
  const safeFrameWidth = Math.max(1, Number(frameWidth) || 1);
  const safeFrameHeight = Math.max(1, Number(frameHeight) || 1);
  const naturalSize = getRegionImageNaturalSize(region);
  const fit = String(region?.objectFit || "cover").trim().toLowerCase();

  if (!naturalSize) {
    return {
      width: safeFrameWidth,
      height: safeFrameHeight
    };
  }

  if (fit === "fill") {
    return {
      width: safeFrameWidth,
      height: safeFrameHeight
    };
  }

  const frameAspect = safeFrameWidth / safeFrameHeight;
  const imageAspect = naturalSize.width / naturalSize.height;

  if (fit === "contain") {
    if (imageAspect >= frameAspect) {
      return {
        width: safeFrameWidth,
        height: safeFrameWidth / imageAspect
      };
    }

    return {
      width: safeFrameHeight * imageAspect,
      height: safeFrameHeight
    };
  }

  if (imageAspect >= frameAspect) {
    return {
      width: safeFrameHeight * imageAspect,
      height: safeFrameHeight
    };
  }

  return {
    width: safeFrameWidth,
    height: safeFrameWidth / imageAspect
  };
}

function getRegionImageLayout(region, frameOverride = null, scaleOverride = null) {
  const frame = frameOverride || getRegionFrame(region);
  const scale = scaleOverride == null ? getRegionImageScale(region) : Math.max(1, Number(scaleOverride) || 1);
  const baseSize = getRegionImageBaseSize(region, frame.width, frame.height);
  const renderedWidth = baseSize.width * scale;
  const renderedHeight = baseSize.height * scale;

  return {
    baseWidth: baseSize.width,
    baseHeight: baseSize.height,
    renderedWidth,
    renderedHeight,
    maxOffsetX: Math.max(0, (renderedWidth - frame.width) / 2),
    maxOffsetY: Math.max(0, (renderedHeight - frame.height) / 2)
  };
}

function clampRegionImageOffset(value, axis, region, frameOverride = null, scaleOverride = null) {
  const layout = getRegionImageLayout(region, frameOverride, scaleOverride);
  const maxOffset = axis === "y" ? layout.maxOffsetY : layout.maxOffsetX;
  return clamp(Number(value) || 0, -maxOffset, maxOffset);
}

function getFrameStyle(frame, pageSize, extra = {}) {
  return {
    left: `${(frame.x / pageSize.width) * 100}%`,
    top: `${(frame.y / pageSize.height) * 100}%`,
    width: `${(frame.width / pageSize.width) * 100}%`,
    height: `${(frame.height / pageSize.height) * 100}%`,
    ...extra
  };
}

function getRegionTextLines(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0);
}

function getFittedRegionTextStyle(region, text, frameOverride = null) {
  const frame = frameOverride || getRegionFrame(region);
  const baseFontSize = hasFiniteNumber(region?.fontSize) ? Number(region.fontSize) : 16;
  const lines = getRegionTextLines(text);
  const lineCount = Math.max(1, lines.length);
  const longestLineLength = Math.max(1, ...lines.map((line) => line.length));
  const availableWidth = Math.max(10, frame.width - 8);
  const availableHeight = Math.max(10, frame.height - 4);
  const compactSingleLine = lineCount === 1 && frame.height <= 28;
  const maxSizeByHeight = compactSingleLine
    ? availableHeight * 0.92
    : availableHeight / (lineCount * 1.18);
  // Use a conservative glyph-width estimate and allow very small source-PDF
  // labels to scale down. The old 8px floor forced longer detected text to be
  // replaced by an ellipsis even though the complete value was still present.
  const widthFactor = compactSingleLine ? 0.72 : 0.6;
  const maxSizeByWidth = availableWidth / Math.max(1, longestLineLength * widthFactor);
  const minFontSize = compactSingleLine ? 2.5 : 4;
  const fittedFontSize = clamp(
    Math.min(baseFontSize, maxSizeByHeight, maxSizeByWidth),
    minFontSize,
    Math.max(minFontSize, baseFontSize)
  );
  const lineHeight = compactSingleLine ? 1 : 1.15;

  return {
    fontSize: `${fittedFontSize}px`,
    lineHeight: `${lineHeight}`,
    whiteSpace: compactSingleLine ? "nowrap" : "pre-wrap",
    overflow: "hidden",
    textOverflow: "clip",
    overflowWrap: compactSingleLine ? "normal" : "anywhere"
  };
}

function getRegionBackgroundAsset(template, page) {
  return template?.[normalizeTemplateRegionPage(page)]?.background || null;
}

function getMedianValue(values) {
  if (!values.length) {
    return 255;
  }

  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function getPercentileValue(values, percentile) {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * percentile)));
  return sorted[index];
}

function loadBrowserImage(src) {
  return new Promise((resolve, reject) => {
    if (!src) {
      resolve(null);
      return;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load template background: ${src}`));
    image.src = src;
  });
}

function sampleFrameBackgroundColor(ctx, imageWidth, imageHeight, pageSize, frame) {
  if (!ctx || !pageSize?.width || !pageSize?.height) {
    return null;
  }

  const scaleX = imageWidth / pageSize.width;
  const scaleY = imageHeight / pageSize.height;
  const x = Math.max(0, Math.min(imageWidth - 1, Math.round(frame.x * scaleX)));
  const y = Math.max(0, Math.min(imageHeight - 1, Math.round(frame.y * scaleY)));
  const width = Math.max(1, Math.min(imageWidth - x, Math.round(frame.width * scaleX)));
  const height = Math.max(1, Math.min(imageHeight - y, Math.round(frame.height * scaleY)));
  const insetX = Math.max(0, Math.min(4, Math.round(width * 0.06)));
  const insetY = Math.max(0, Math.min(3, Math.round(height * 0.1)));
  const sampleX = Math.max(0, Math.min(imageWidth - 1, x + insetX));
  const sampleY = Math.max(0, Math.min(imageHeight - 1, y + insetY));
  const sampleWidth = Math.max(1, Math.min(imageWidth - sampleX, width - (insetX * 2)));
  const sampleHeight = Math.max(1, Math.min(imageHeight - sampleY, height - (insetY * 2)));
  const imageData = ctx.getImageData(sampleX, sampleY, sampleWidth, sampleHeight);
  const pixels = imageData.data;
  const buckets = new Map();
  const step = 24;

  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] < 200) {
      continue;
    }

    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const key = [
      Math.round(red / step) * step,
      Math.round(green / step) * step,
      Math.round(blue / step) * step
    ].join("|");
    const bucket = buckets.get(key) || {
      count: 0,
      red: 0,
      green: 0,
      blue: 0
    };
    bucket.count += 1;
    bucket.red += red;
    bucket.green += green;
    bucket.blue += blue;
    buckets.set(key, bucket);
  }

  const winningBucket = [...buckets.values()].sort((a, b) => b.count - a.count)[0];
  if (!winningBucket || winningBucket.count <= 0) {
    return null;
  }

  return `rgb(${Math.round(winningBucket.red / winningBucket.count)}, ${Math.round(winningBucket.green / winningBucket.count)}, ${Math.round(winningBucket.blue / winningBucket.count)})`;
}

async function sampleTemplateEditableRegionBackgrounds(template) {
  if (typeof document === "undefined" || !template) {
    return {};
  }

  const results = {};
  const pageCaches = new Map();

  for (const region of template.editableRegions || []) {
    if (!region || region.hidden || String(region.type || "").toLowerCase() === "image") {
      continue;
    }

    if (!isTransparentRegionBackground(region.background)) {
      continue;
    }

    const backgroundAsset = getRegionBackgroundAsset(template, region.page);
    if (!backgroundAsset) {
      continue;
    }

    if (!pageCaches.has(backgroundAsset)) {
      try {
        const image = await loadBrowserImage(backgroundAsset);
        if (!image) {
          pageCaches.set(backgroundAsset, null);
        } else {
          const canvas = document.createElement("canvas");
          canvas.width = image.naturalWidth || image.width;
          canvas.height = image.naturalHeight || image.height;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) {
            pageCaches.set(backgroundAsset, null);
          } else {
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            pageCaches.set(backgroundAsset, {
              width: canvas.width,
              height: canvas.height,
              ctx
            });
          }
        }
      } catch (_error) {
        pageCaches.set(backgroundAsset, null);
      }
    }

    const cachedPage = pageCaches.get(backgroundAsset);
    if (!cachedPage?.ctx) {
      continue;
    }

    const sampledBackground = sampleFrameBackgroundColor(
      cachedPage.ctx,
      cachedPage.width,
      cachedPage.height,
      template.pageSize,
      getOriginalRegionFrame(region)
    );

    if (sampledBackground) {
      results[makeEditableRegionKey(region.id)] = sampledBackground;
    }
  }

  return results;
}

function getFitLevel(layoutSettings) {
  const rawValue = Number(layoutSettings?.fitLevel || 0);
  return Math.max(0, Math.min(4, Number.isFinite(rawValue) ? Math.trunc(rawValue) : 0));
}

function usesLegacyPage2CanvasMask(background, pageSize) {
  return String(background || "").includes("/api/assets/j300/page-2.png")
    && Number(pageSize?.width) < Number(pageSize?.height);
}

function getTitleStyle(title, language, layoutSettings) {
  const fitLevel = getFitLevel(layoutSettings);
  const isDense = isTranslatedLanguage(language) || String(title).length > 10;
  const normalizedTitle = String(title || "").trim();
  const titleLength = normalizedTitle.length;
  const latinOnly = /^[A-Za-z0-9 .-]+$/.test(normalizedTitle);
  const protectShortLatinTitle = latinOnly && titleLength <= 10;
  let baseSize = isDense ? 28 : 36;

  if (latinOnly && titleLength >= 10) {
    baseSize = Math.min(baseSize, 26);
  }

  if (latinOnly && titleLength >= 14) {
    // Long machine names must fit inside the fixed title frame. Scale them
    // continuously instead of relying on CSS clipping after a few lines.
    const lengthFittedSize = Math.max(12, 34 - (titleLength - 10) * 0.62);
    baseSize = Math.min(baseSize, 24, lengthFittedSize);
  }

  const fitReduction = protectShortLatinTitle
    ? Math.min(fitLevel * 0.4, 1.2)
    : fitLevel * 2.5;

  return {
    "--preview-title-size": `${Math.max(isDense && !protectShortLatinTitle ? 12 : 24, baseSize - fitReduction)}px`,
    "--preview-title-family": latinOnly
      ? 'Aptos, "Segoe UI", sans-serif'
      : "inherit"
  };
}

function wrapPreviewText(text, maxChars) {
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

function estimatePreviewWrappedLineCount(text, width, fontSize, maxLines = Number.POSITIVE_INFINITY) {
  const approxChars = Math.max(10, Math.floor(width / (fontSize * 0.53)));
  return Math.min(wrapPreviewText(text, approxChars).length, maxLines);
}

function resolveColumnLayout(items, region, language, layoutSettings) {
  const fitLevel = getFitLevel(layoutSettings);
  const attempts = [
    { titleSize: 13, titleTop: 18, fontSize: 8.1, lineHeight: 9.4, gap: 4, maxLines: 2 },
    { titleSize: 12, titleTop: 16, fontSize: 7.4, lineHeight: 8.5, gap: 4, maxLines: 2 },
    { titleSize: 11, titleTop: 15, fontSize: 6.8, lineHeight: 7.8, gap: 3, maxLines: 2 },
    { titleSize: 10, titleTop: 14, fontSize: 6.3, lineHeight: 7.2, gap: 3, maxLines: 2 },
    { titleSize: 9.5, titleTop: 13, fontSize: 5.8, lineHeight: 6.7, gap: 2, maxLines: 2 },
    ...(isTranslatedLanguage(language)
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
      const lineCount = estimatePreviewWrappedLineCount(`- ${item}`, region.width - 20, attempt.fontSize, attempt.maxLines);
      requiredHeight += lineCount * attempt.lineHeight + attempt.gap;
    }

    if (requiredHeight <= region.height - 8) {
      return attempt;
    }
  }

  return attempts[attempts.length - 1];
}

function getVisibleColumnItems(items, region, language, layoutSettings) {
  const cappedItems = items.slice(0, 18);
  const typography = resolveColumnLayout(cappedItems, region, language, layoutSettings);
  const fitLevel = getFitLevel(layoutSettings);
  const reservedBottom = region.compact ? 4 : (fitLevel >= 4 ? 4 : fitLevel >= 3 ? 10 : 16);
  const availableHeight = region.height - (typography.titleTop + 18) - reservedBottom;
  let consumed = 0;
  const visibleItems = [];

  for (const item of cappedItems) {
    const lineCount = estimatePreviewWrappedLineCount(`- ${item}`, region.width - 20, typography.fontSize, typography.maxLines);
    const itemHeight = lineCount * typography.lineHeight + typography.gap;

    if (visibleItems.length > 0 && consumed + itemHeight > availableHeight) {
      break;
    }

    visibleItems.push(item);
    consumed += itemHeight;
  }

  return {
    visibleItems,
    hiddenCount: Math.max(0, items.length - visibleItems.length),
    style: {
      "--column-title-size": `${typography.titleSize}px`,
      "--column-item-size": `${typography.fontSize}px`,
      "--column-line-height-px": `${typography.lineHeight}px`,
      "--column-gap": `${typography.gap}px`,
      "--column-title-gap": `${Math.max(4, typography.gap + 2)}px`,
      "--column-max-lines": `${typography.maxLines}`
    }
  };
}

function getSpecPanelMetrics(catalog) {
  const totalItems = catalog.specSections.reduce((count, section) => count + section.items.length, 0);
  const longestLabel = Math.max(
    ...catalog.specSections.flatMap((section) => section.items.map((item) => String(item.label).length)),
    0
  );
  const isDenseLanguage = isTranslatedLanguage(catalog.language);
  const fitLevel = getFitLevel(catalog.layoutSettings);
  const score = totalItems + longestLabel / 10 + (isDenseLanguage ? 4 : 0);
  const shrinkBy = [0, 0.6, 1.1, 1.5, 1.8][fitLevel];
  const lineTightening = [0, 0.03, 0.06, 0.08, 0.1][fitLevel];

  let profile;
  if (score >= 36) {
    profile = {
      header: 12,
      section: 7.2,
      row: 5.4,
      lineHeight: 1.08,
      gap: 6,
      paddingY: 2,
      paddingX: 4,
      note: 5
    };
  } else if (score >= 34) {
    profile = {
      header: 13,
      section: 7.8,
      row: 5.9,
      lineHeight: 1.12,
      gap: 7,
      paddingY: 2,
      paddingX: 5,
      note: 5.4
    };
  } else if (score >= 30) {
    profile = {
      header: 14,
      section: 8.5,
      row: 6.5,
      lineHeight: 1.16,
      gap: 8,
      paddingY: 3,
      paddingX: 6,
      note: 6
    };
  } else {
    profile = {
      header: 15,
      section: 9,
      row: 7,
      lineHeight: 1.18,
      gap: 9,
      paddingY: 4,
      paddingX: 6,
      note: 6.2
    };
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

function getSpecPanelStyle(catalog) {
  const metrics = getSpecPanelMetrics(catalog);

  return {
    "--spec-header-size": `${metrics.header}px`,
    "--spec-section-size": `${metrics.section}px`,
    "--spec-row-size": `${metrics.row}px`,
    "--spec-row-line-height": `${metrics.lineHeight}`,
    "--spec-row-gap": `${metrics.gap}px`,
    "--spec-row-padding-y": `${metrics.paddingY}px`,
    "--spec-row-padding-x": `${metrics.paddingX}px`,
    "--spec-note-size": `${metrics.note}px`
  };
}

function getSpecPanelHeight(catalog, template) {
  const metrics = getSpecPanelMetrics(catalog);
  const panelWidth = template?.page2?.specsPanel?.width || 300;
  const maxHeight = template?.page2?.specsPanel?.height || 650;
  if (template?.page2?.specsPanel?.layout === "columns") {
    return maxHeight;
  }
  const contentWidth = Math.max(180, panelWidth - metrics.paddingX * 2);
  const labelWidth = contentWidth * 0.58;
  const valueWidth = contentWidth * 0.34;
  const wrapLimit = isTranslatedLanguage(catalog.language) ? 3 : 2;

  let bodyHeight = 0;
  for (const section of catalog.specSections) {
    bodyHeight += metrics.section + 6;

    for (const item of section.items) {
      const labelLines = estimatePreviewWrappedLineCount(item.label, labelWidth, metrics.row, wrapLimit);
      const valueLines = estimatePreviewWrappedLineCount(
        formatPreviewValue(item.label, item.value),
        valueWidth,
        metrics.row,
        /full power range/i.test(item.label) ? 3 : wrapLimit
      );

      bodyHeight += Math.max(labelLines, valueLines) * metrics.row * metrics.lineHeight + metrics.paddingY * 2 + 1;
    }

    bodyHeight += 2;
  }

  const noteLines = estimatePreviewWrappedLineCount(catalog.legalNote, contentWidth, metrics.note, 4);
  const noteHeight = noteLines * metrics.note * 1.2 + 12;
  const estimatedHeight = metrics.header + 16 + bodyHeight + noteHeight + 20;

  return Math.max(320, Math.min(maxHeight, estimatedHeight));
}

function resolveTemplateForVersion(snapshot, version) {
  if (!snapshot) {
    return null;
  }

  if (!version?.catalog?.templateId) {
    return snapshot.template || null;
  }

  return snapshot.templates?.find((template) => template.id === version.catalog.templateId) || snapshot.template || null;
}

function resolveHeroDisplayImage(catalog, template) {
  return catalog?.heroOverlayImage || template?.page1?.heroOverlay?.placeholderImage || null;
}

function resolveTemplateHeroPreviewImage(template) {
  const heroOverlay = template?.page1?.heroOverlay || {};
  return Object.prototype.hasOwnProperty.call(heroOverlay, "placeholderImage")
    ? heroOverlay.placeholderImage
    : templatePreviewHeroImage;
}

function templateUsesBakedInHeroArtwork(template) {
  return String(template?.page1?.background || "").includes("/api/assets/j300/page-1.png");
}

function formatPreviewValue(label, value) {
  if (/full power range/i.test(label)) {
    return String(value).replace(/\s*\|\s*/g, " / ");
  }

  return String(value);
}

function getTemplateRegion(template, regionKey) {
  if (!template) {
    return null;
  }

  if (isEditableRegionKey(regionKey)) {
    const regionId = getEditableRegionId(regionKey);
    return (template.editableRegions || []).find((region) => String(region.id) === regionId) || null;
  }

  if (regionKey === "titleRegion") {
    return template.page1.titleRegion;
  }

  if (regionKey === "heroOverlay") {
    return template.page1.heroOverlay;
  }

  if (regionKey === "specsPanel") {
    return template.page2.specsPanel;
  }

  return template.page1.columns.find((column) => column.key === regionKey) || null;
}

function updateTemplateRegion(template, regionKey, patch) {
  if (!template) {
    return template;
  }

  const next = deepClone(template);

  if (isEditableRegionKey(regionKey)) {
    const regionId = getEditableRegionId(regionKey);
    next.editableRegions = (next.editableRegions || []).map((region) =>
      String(region.id) === regionId
        ? {
            ...region,
            ...patch
          }
        : region
    );
    return next;
  }

  if (regionKey === "titleRegion") {
    next.page1.titleRegion = {
      ...next.page1.titleRegion,
      ...patch
    };
    return next;
  }

  if (regionKey === "heroOverlay") {
    next.page1.heroOverlay = {
      ...next.page1.heroOverlay,
      ...patch
    };
    return next;
  }

  if (regionKey === "specsPanel") {
    next.page2.specsPanel = {
      ...next.page2.specsPanel,
      ...patch
    };
    return next;
  }

  next.page1.columns = next.page1.columns.map((column) =>
    column.key === regionKey
      ? {
          ...column,
          ...patch
        }
      : column
  );

  return next;
}

function normalizeCatalogEditableRegionOverrides(overrides) {
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) {
    return {};
  }

  return overrides;
}

function applyCatalogRegionOverridesToTemplate(template, catalog, manualState = null) {
  if (!template) {
    return null;
  }

  const editableRegions = Array.isArray(template.editableRegions) ? template.editableRegions : [];
  if (!editableRegions.length) {
    return template;
  }

  const overrides = normalizeCatalogEditableRegionOverrides(catalog?.editableRegionOverrides);
  const nextEditableRegions = editableRegions.map((region) => {
    if (!region || typeof region !== "object") {
      return region;
    }

    const regionId = String(region.id || "").trim();
    const regionKey = makeEditableRegionKey(regionId);
    const override = regionId ? overrides[regionId] : null;
    const nextRegion = override && typeof override === "object"
      ? {
          ...region,
          ...override
        }
      : { ...region };

    if (manualState?.regionKey === regionKey) {
      const regionType = String(region.type || "").toLowerCase() === "image" ? "image" : "text";

      if (regionType === "image" && manualState.heroPreviewUrl) {
        nextRegion.imageSrc = manualState.heroPreviewUrl;
        nextRegion.deleted = false;
      }

      if (regionType !== "image" && typeof manualState.text === "string") {
        nextRegion.content = manualState.text;
        nextRegion.deleted = false;
      }
    }

    return nextRegion;
  });

  return {
    ...template,
    editableRegions: nextEditableRegions
  };
}

function getCatalogEditorRegionOptions(template) {
  const regionOptions = getTemplateEditorRegionOptions(template).filter((region) => !region.hidden);
  return regionOptions.map((region) => ({
    key: region.key,
    label: region.label,
    pageId: region.page,
    page: region.pageLabel,
    type: region.type,
    dynamic: region.dynamic,
    description: catalogEditorRegions.find((item) => item.key === region.key)?.description
      || (region.type === "image" ? "Editable image area" : "Editable text area")
  }));
}

function StatusPill({ children, tone = "neutral" }) {
  return <span className={`status-pill status-pill--${tone}`}>{children}</span>;
}

function LayoutWarning({ version }) {
  if (!version?.layoutIssues?.length) {
    return null;
  }

  return (
    <div className="layout-warning">
      Print warning: content exceeds this fixed template. Try a prompt like "fit this content to the template", "reduce the font size", or "remove one line from optional accessories".
    </div>
  );
}

function resolvePageSize(pageSize) {
  const width = Number(pageSize?.width);
  const height = Number(pageSize?.height);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return defaultPageSize;
  }

  return { width, height };
}

function getPageSizeStyle(pageSize, extra = {}) {
  const resolved = resolvePageSize(pageSize);
  return {
    aspectRatio: `${resolved.width} / ${resolved.height}`,
    ...extra
  };
}

function Page({ background, pageSize, children, className = "" }) {
  return (
    <div
      className={`catalog-page ${className}`.trim()}
      style={getPageSizeStyle(pageSize, { backgroundImage: `url(${background})` })}
    >
      {children}
    </div>
  );
}

function WrappedList({ items }) {
  return (
    <ul className="wrapped-list">
      {items.map((item, index) => (
        <li className="wrapped-list__item" key={`${item}-${index}`}>
          {item}
        </li>
      ))}
    </ul>
  );
}

function ColumnOverflowNote({ hiddenCount }) {
  if (!hiddenCount) {
    return null;
  }

  return <div className="column-overflow-note">+ {hiddenCount} more</div>;
}

function SpecPanel({ catalog, template }) {
  const panelStyle = getSpecPanelStyle(catalog);
  const usesColumnLayout = template.page2.specsPanel.layout === "columns";
  const usesSourceColumns = template.preserveSourceArtwork === true
    && template.page2.specsPanel.sourceColumns === true
    && isTranslatedLanguage(catalog.language);
  const renderSection = (section) => (
    <div className="spec-section" key={section.title}>
      <div className="spec-section__title">{section.title}</div>
      {section.items.map((item) => (
        <div className="spec-row" key={`${section.title}-${item.label}`}>
          <div className="spec-row__label">{item.label}</div>
          <div className="spec-row__value">{formatPreviewValue(item.label, item.value)}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`spec-panel ${usesColumnLayout ? "spec-panel--columns" : ""}`.trim()} style={panelStyle}>
      <div className="spec-panel__header spec-panel__header--template">
        <span style={{ color: template.page2.specsPanel.borderColor }}>
          {catalog.specificationsTitle || template.page2.specsPanel.title || "Specifications"}
        </span>
        <span>{catalog.title}</span>
      </div>
      <div className={`spec-panel__body ${usesColumnLayout ? "spec-panel__body--columns" : ""} ${usesSourceColumns ? "spec-panel__body--source-columns" : ""}`.trim()}>
        {usesSourceColumns
          ? [1, 2, 3].map((column) => (
              <div className="spec-panel__source-column" key={`spec-column-${column}`}>
                {catalog.specSections.filter((section) => Number(section.column || 1) === column).map(renderSection)}
              </div>
            ))
          : catalog.specSections.map(renderSection)}
      </div>
      {template.page2.specsPanel.showNote === false ? null : (
        <div className="spec-panel__note">{catalog.legalNote}</div>
      )}
    </div>
  );
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

function getSourceValueFontSize(region, value) {
  const maximum = Number(region.fontSize || 8.05);
  const minimum = Number(region.minFontSize || 5.6);
  const estimatedWidth = Math.max(1, String(value || "").length * maximum * 0.52);
  return Math.max(minimum, Math.min(maximum, maximum * (Number(region.width || 1) - 3) / estimatedWidth));
}

function toSourceContainerUnit(value, pageWidth) {
  return `${(Number.parseFloat(value) / pageWidth) * 100}cqw`;
}

const sourceSpecSectionRegions = [
  { sectionIndex: 0, x: 40, y: 66, width: 163, height: 15 },
  { sectionIndex: 1, x: 216, y: 66, width: 162, height: 15 },
  { sectionIndex: 2, x: 396, y: 66, width: 156, height: 15 },
  { sectionIndex: 3, x: 40, y: 166, width: 338, height: 15 },
  { sectionIndex: 4, x: 396, y: 166, width: 156, height: 15 },
  { sectionIndex: 5, x: 396, y: 229, width: 156, height: 15 },
  { sectionIndex: 6, x: 40, y: 304, width: 338, height: 15 },
  { sectionIndex: 7, x: 396, y: 304, width: 156, height: 15 }
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

  return { ...valueRegion, x: 396, width: 104 };
}

function getSourceTextFontSize(region, value, maximum = 6.1, minimum = 2.8) {
  const estimatedWidth = Math.max(1, Array.from(String(value || "")).length * maximum * 0.5);
  return Math.max(minimum, Math.min(maximum, maximum * (Number(region.width || 1) - 2) / estimatedWidth));
}

function SourceSpecTextOverlays({ catalog, template, pageId }) {
  if (pageId !== "page1") {
    return null;
  }

  const pageSize = resolvePageSize(template.pageSize);
  const valueRegions = (template.specValueRegions || []).filter(
    (region) => normalizeTemplateRegionPage(region.page) === pageId
  );
  const catalogItems = (catalog.specSections || []).flatMap((section) => section.items || []);
  const overlays = [
    {
      key: "specifications-title",
      value: catalog.specificationsTitle || "Specifications",
      x: 40,
      y: 42,
      width: 130,
      height: 24,
      background: "#ffffff",
      color: "#be1e2d",
      fontSize: 11,
      fontWeight: 700
    },
    ...sourceSpecSectionRegions.map((region) => ({
      ...region,
      key: `section-${region.sectionIndex}`,
      value: catalog.specSections?.[region.sectionIndex]?.title || "",
      background: "#e7e7e7",
      color: "#40454d",
      fontSize: getSourceTextFontSize(region, catalog.specSections?.[region.sectionIndex]?.title, 6.4, 3.8),
      fontWeight: 700
    })),
    ...valueRegions.map((valueRegion, index) => {
      const region = getSourceSpecLabelRegion(valueRegion);
      const value = catalogItems[index]?.label || valueRegion.label;
      return {
        ...region,
        key: `label-${index}`,
        value,
        background: "#ffffff",
        color: "#40454d",
        fontSize: getSourceTextFontSize(region, value),
        fontWeight: 500
      };
    })
  ];

  return overlays.map((region) => (
    <div
      className="overlay-spec-text"
      key={region.key}
      style={{
        left: `${(region.x / pageSize.width) * 100}%`,
        top: `${(region.y / pageSize.height) * 100}%`,
        width: `${(region.width / pageSize.width) * 100}%`,
        height: `${(region.height / pageSize.height) * 100}%`,
        background: region.background,
        color: region.color,
        fontSize: `${(region.fontSize / pageSize.width) * 100}cqw`,
        fontWeight: region.fontWeight
      }}
    >
      {region.value}
    </div>
  ));
}

function SourceSpecificationOverlay({ catalog, template, pageId }) {
  if (pageId !== "page1") {
    return null;
  }

  const pageSize = resolvePageSize(template.pageSize);
  const overlayFrame = { x: 36, y: 38, width: 528, height: 350 };
  const valueRegions = (template.specValueRegions || []).filter(
    (region) => normalizeTemplateRegionPage(region.page) === pageId
  );
  const catalogItems = (catalog.specSections || []).flatMap((section) => section.items || []);
  const getFixedRegionStyle = (region) => ({
    left: `${((Number(region.x) - overlayFrame.x) / overlayFrame.width) * 100}%`,
    top: `${((Number(region.y) - overlayFrame.y) / overlayFrame.height) * 100}%`,
    width: `${(Number(region.width) / overlayFrame.width) * 100}%`,
    height: `${(Number(region.height) / overlayFrame.height) * 100}%`
  });

  return (
    <div
      className="source-specification-overlay source-specification-overlay--fixed"
      style={{
        left: `${(overlayFrame.x / pageSize.width) * 100}%`,
        top: `${(overlayFrame.y / pageSize.height) * 100}%`,
        width: `${(overlayFrame.width / pageSize.width) * 100}%`,
        height: `${(overlayFrame.height / pageSize.height) * 100}%`
      }}
    >
      <div
        className="source-specification-overlay__title source-specification-overlay__fixed-title"
        style={getFixedRegionStyle({ x: 40, y: 42, width: 130, height: 24 })}
      >
        {catalog.specificationsTitle || "Specifications"}
      </div>
      {sourceSpecSectionRegions.map((region) => {
        const section = catalog.specSections?.[region.sectionIndex];
        const sectionTitle = section?.title || "";
        return (
          <div
            className="source-specification-overlay__section-title source-specification-overlay__fixed-section"
            key={`fixed-section-${region.sectionIndex}`}
            style={{
              ...getFixedRegionStyle(region),
              "--source-section-size": `${(getSourceTextFontSize(region, sectionTitle, 6.4, 3.8) / pageSize.width) * 100}cqw`
            }}
          >
            <span>{sectionTitle}</span>
            <span>{catalog.title}</span>
          </div>
        );
      })}
      {valueRegions.map((valueRegion, index) => {
        const item = catalogItems[index] || findCatalogSpecItem(catalog, valueRegion.label);
        const label = item?.label || valueRegion.label;
        const value = formatPreviewValue(label, item?.value ?? valueRegion.sourceValue);
        const labelRegion = getSourceSpecLabelRegion(valueRegion);
        const rowRegion = {
          x: labelRegion.x,
          y: valueRegion.y,
          width: (Number(valueRegion.x) + Number(valueRegion.width)) - Number(labelRegion.x),
          height: valueRegion.height
        };
        const labelShare = ((Number(valueRegion.x) - Number(labelRegion.x)) / rowRegion.width) * 100;

        return (
          <div
            className="source-specification-overlay__row source-specification-overlay__fixed-row"
            key={`fixed-row-${index}`}
            style={{
              ...getFixedRegionStyle(rowRegion),
              gridTemplateColumns: `${labelShare}% ${100 - labelShare}%`,
              "--source-label-size": `${(getSourceTextFontSize(labelRegion, label) / pageSize.width) * 100}cqw`,
              "--source-value-size": `${(getSourceValueFontSize(valueRegion, value) / pageSize.width) * 100}cqw`
            }}
          >
            <span className="source-specification-overlay__label">{label}</span>
            <span className="source-specification-overlay__value">{value}</span>
          </div>
        );
      })}
    </div>
  );
}

function SourceSpecValueOverlays({ catalog, template, pageId }) {
  const regions = Array.isArray(template.specValueRegions) ? template.specValueRegions : [];
  const pageSize = resolvePageSize(template.pageSize);
  const catalogItems = (catalog.specSections || []).flatMap((section) => section.items || []);

  return regions
    .filter((region) => normalizeTemplateRegionPage(region.page) === pageId)
    .map((region, index) => {
      const item = catalogItems[index] || findCatalogSpecItem(catalog, region.label);
      const value = item ? String(item.value ?? "") : String(region.sourceValue ?? "");

      if (!item || value.trim() === String(region.sourceValue ?? "").trim()) {
        return null;
      }

      return (
        <div
          className="overlay-spec-value"
          key={`${pageId}-${region.label}`}
          style={{
            left: `${(region.x / pageSize.width) * 100}%`,
            top: `${(region.y / pageSize.height) * 100}%`,
            width: `${(region.width / pageSize.width) * 100}%`,
            height: `${(region.height / pageSize.height) * 100}%`,
            background: region.background || "#ffffff",
            color: region.textColor || "#444444",
            fontSize: `${(getSourceValueFontSize(region, value) / pageSize.width) * 100}cqw`
          }}
        >
          {value}
        </div>
      );
    });
}

const fixedSourceTextBlockFrames = {
  "page4-cutting-heading": { height: 40 },
  "page4-udrilling-heading": { height: 40 },
  "page4-external-threading-heading": { height: 40 },
  "page4-internal-threading-heading": { height: 40 },
  "page4-tapping-heading": { height: 40 },
  "page4-grooving-heading": { height: 40 },
  "page4-cutting-labels": { x: 46, width: 93, tableRows: true },
  "page4-udrilling-labels": { x: 226, width: 93, tableRows: true },
  "page4-external-threading-labels": { x: 400, width: 93, tableRows: true },
  "page4-internal-threading-labels": { x: 46, width: 93, tableRows: true },
  "page4-tapping-labels": { x: 226, width: 93, tableRows: true },
  "page4-grooving-labels": { x: 400, width: 93, tableRows: true }
};

function SourcePageTextBlock({ block, pageSize, pageId }) {
  const blockRef = useRef(null);
  const baseFontSize = Number(block.fontSize || 10);
  const fixedFrame = fixedSourceTextBlockFrames[block.id] || {};
  const preservesSourceTableLines = fixedFrame.tableRows === true;
  const frame = {
    x: Number(fixedFrame.x ?? block.x ?? 0),
    y: Number(fixedFrame.y ?? block.y ?? 0),
    width: Number(fixedFrame.width ?? block.width ?? 0),
    height: Number(fixedFrame.height ?? block.height ?? 0)
  };

  useLayoutEffect(() => {
    const element = blockRef.current;
    if (!element) {
      return;
    }

    const minimumFontSize = Math.max(4.8, baseFontSize * 0.72);
    const hasOverflow = () => {
      const blockOverflows = element.scrollWidth > element.clientWidth + 1
        || element.scrollHeight > element.clientHeight + 1;
      const rowOverflows = Array.from(element.querySelectorAll(".overlay-source-text-block__row"))
        .some((row) => row.scrollWidth > row.clientWidth + 1 || row.scrollHeight > row.clientHeight + 1);
      return blockOverflows || rowOverflows;
    };

    let fittedFontSize = baseFontSize;
    element.style.fontSize = `${(fittedFontSize / pageSize.width) * 100}cqw`;
    while (hasOverflow() && fittedFontSize > minimumFontSize) {
      fittedFontSize = Math.max(minimumFontSize, fittedFontSize - 0.2);
      element.style.fontSize = `${(fittedFontSize / pageSize.width) * 100}cqw`;
    }
  }, [baseFontSize, block.id, block.rows, block.text, frame.height, frame.width, pageSize.width]);

  return (
    <div
      className={`overlay-source-text-block ${Array.isArray(block.rows) ? "overlay-source-text-block--rows" : ""} ${preservesSourceTableLines ? "overlay-source-text-block--preserve-table-lines" : ""}`.trim()}
      data-block-id={block.id || ""}
      ref={blockRef}
      style={{
        left: `${(frame.x / pageSize.width) * 100}%`,
        top: `${(frame.y / pageSize.height) * 100}%`,
        width: `${(frame.width / pageSize.width) * 100}%`,
        height: `${(frame.height / pageSize.height) * 100}%`,
        background: block.background || "#ffffff",
        color: block.textColor || "#333333",
        fontSize: `${(baseFontSize / pageSize.width) * 100}cqw`,
        fontWeight: Number(block.fontWeight || 400),
        lineHeight: Number(block.lineHeight || 1.3),
        textAlign: block.textAlign || "left",
        "--overlay-row-count": Array.isArray(block.rows) ? block.rows.length : 1
      }}
    >
      {Array.isArray(block.rows)
        ? block.rows.map((row, index) => (
            <div className="overlay-source-text-block__row" key={`${block.id || "row"}-${index}`}>
              {row}
            </div>
          ))
        : block.text}
    </div>
  );
}

function SourcePageTextOverlays({ catalog, template, pageId }) {
  const pageSize = resolvePageSize(template.pageSize);
  const blocks = Array.isArray(catalog.pageTextBlocks) ? catalog.pageTextBlocks : [];

  return blocks
    .filter((block) => normalizeTemplateRegionPage(block.page) === pageId)
    .map((block) => (
      <SourcePageTextBlock
        block={block}
        key={block.id || `${pageId}-${block.x}-${block.y}`}
        pageId={pageId}
        pageSize={pageSize}
      />
    ));
}

function SharedBrandFrame({ pageId, catalog }) {
  const footerPrimary = pageId === "page1" ? "Ace Micromatic Group" : "Ace Designers | Turning Center Division";
  const footerSecondary = pageId === "page1" ? catalog.machineCategory : "www.acemicromatic.net";

  return (
    <>
      <div className={`brand-frame brand-frame--${pageId}`}>
        <div className="brand-frame__logo-shell">
          <img className="brand-frame__logo" src="/ace-micromatic-logo.png" alt="Ace Micromatic Group" />
        </div>
      </div>
      <div className={`brand-footer brand-footer--${pageId}`}>
        <div className="brand-footer__primary">{footerPrimary}</div>
        <div className="brand-footer__secondary">{footerSecondary}</div>
      </div>
    </>
  );
}

function CatalogDynamicRegion({
  template,
  regionKey,
  label,
  isSelected,
  isInlineEditing = false,
  inlineEditValue = "",
  sampledBackground = null,
  printMode = false,
  onSelect,
  onInlineEditStart,
  onInlineEditChange,
  onInlineEditDone,
  onImageSelected
}) {
  const replaceImageInputRef = useRef(null);
  const regionRef = useRef(null);
  const [renderFrame, setRenderFrame] = useState(null);
  const region = getTemplateRegion(template, regionKey);
  const regionType = String(region?.type || "").toLowerCase() === "image" ? "image" : "text";

  useEffect(() => {
    if (!regionRef.current || typeof window === "undefined") {
      return undefined;
    }

    const element = regionRef.current;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      setRenderFrame((current) => {
        const next = {
          width: rect.width,
          height: rect.height
        };

        if (current && Math.abs(current.width - next.width) < 0.5 && Math.abs(current.height - next.height) < 0.5) {
          return current;
        }

        return next;
      });
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }

    const observer = new ResizeObserver(() => measure());
    observer.observe(element);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [regionKey, template.pageSize.height, template.pageSize.width]);

  if (!region || region.hidden) {
    return null;
  }

  const interactive = !printMode && typeof onSelect === "function";
  const isDeleted = isDynamicRegionDeleted(region);
  const hasTextOverride = regionType !== "image" && hasDynamicTextOverride(region);
  const hasImageOverride = regionType === "image" && hasDynamicImageOverride(region);
  const resolvedTextSurface = regionType === "image"
    ? "transparent"
    : (isTransparentRegionBackground(region.background)
      ? (sampledBackground || "rgba(255,255,255,0.92)")
      : region.background);
  const resolvedTextColor = getReadableTextColor(region.textColor || "#1f2933", resolvedTextSurface);
  const resolvedPlaceholderColor = getReadablePlaceholderColor(resolvedTextColor, resolvedTextSurface);
  const regionText = region.content || region.label || "";
  const activeText = isInlineEditing ? inlineEditValue : regionText;
  const shouldMaskSourceContent = regionType !== "image" && (isInlineEditing || hasTextOverride);
  const shouldShowOverlayContent = isDeleted
    ? false
    : (regionType === "image" ? hasImageOverride : (hasTextOverride || isInlineEditing));
  const currentFrame = getRegionFrame(region);
  const originalFrame = getOriginalRegionFrame(region);
  const maskSpread = Math.max(2, Math.round((region.fontSize || 18) * 0.12));
  const editableRegionId = isEditableRegionKey(regionKey) ? getEditableRegionId(regionKey) : null;
  const imageRegionFallback = getTemplateImageRegionFallback(template?.id, editableRegionId);
  const resolvedRegionClipPath = imageRegionFallback?.clipPath || (typeof region.clipPath === "string" && region.clipPath.trim()
    ? region.clipPath.trim()
    : null);
  const resolvedImageMatteColor = imageRegionFallback?.imageMatteColor || (typeof region.imageMatteColor === "string" && region.imageMatteColor.trim()
    ? region.imageMatteColor.trim()
    : "transparent");
  const regionStyle = getFrameStyle(currentFrame, template.pageSize, {
    background: shouldShowOverlayContent
      ? (regionType === "image" ? resolvedImageMatteColor : resolvedTextSurface)
      : "transparent",
    borderColor: printMode
      ? "transparent"
      : (isSelected ? (region.borderColor || "rgba(181,46,51,0.58)") : "transparent"),
    borderRadius: `${region.radius || 12}px`
  });
  const sourceMaskStyle = getFrameStyle(originalFrame, template.pageSize, {
    background: resolvedTextSurface,
    borderRadius: `${region.radius || 12}px`,
    boxShadow: `0 0 0 ${maskSpread}px ${resolvedTextSurface}`
  });
  const renderFrameForText = renderFrame
    ? {
        x: 0,
        y: 0,
        width: renderFrame.width,
        height: renderFrame.height
      }
    : null;
  const inlineTextStyle = {
    color: resolvedTextColor,
    fontWeight: Math.max(400, Math.round(region.fontWeight || 700)),
    textAlign: region.textAlign || "left",
    ...getFittedRegionTextStyle(region, activeText, renderFrameForText)
  };
  const inlineEditorStyle = {
    ...inlineTextStyle,
    background: resolvedTextSurface,
    caretColor: resolvedTextColor,
    "--editor-placeholder-color": resolvedPlaceholderColor
  };
  const renderHeight = renderFrame?.height || currentFrame.height;
  const isCompactSingleLineEditor = getRegionTextLines(activeText).length <= 1 && renderHeight <= 30;
  const imageScale = getRegionImageScale(region);
  const imageOffset = getRegionImageOffset(region);
  const renderScaleX = renderFrame && currentFrame.width > 0 ? renderFrame.width / currentFrame.width : 1;
  const renderScaleY = renderFrame && currentFrame.height > 0 ? renderFrame.height / currentFrame.height : 1;
  const imageTranslateX = clampRegionImageOffset(imageOffset.x, "x", region, currentFrame, imageScale) * renderScaleX;
  const imageTranslateY = clampRegionImageOffset(imageOffset.y, "y", region, currentFrame, imageScale) * renderScaleY;
  const renderImageFrame = renderFrame
    ? {
        x: 0,
        y: 0,
        width: renderFrame.width,
        height: renderFrame.height
      }
    : currentFrame;
  const renderImageLayout = getRegionImageLayout(region, renderImageFrame, imageScale);
  const handleInlineEditorKeyDown = (event) => {
    event.stopPropagation();

    if (event.key === "Escape") {
      event.preventDefault();
      onInlineEditDone?.(regionKey);
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      onInlineEditDone?.(regionKey);
      return;
    }

    if (isCompactSingleLineEditor && event.key === "Enter") {
      event.preventDefault();
      onInlineEditDone?.(regionKey);
    }
  };
  const handleSelect = (event) => {
    if (!interactive || isInlineEditing) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    onSelect?.(regionKey);

    if (regionType !== "image" && !isDeleted) {
      onInlineEditStart?.(regionKey);
    }
  };

  return (
    <>
      {shouldMaskSourceContent ? <div className="editor-region-mask" aria-hidden="true" style={sourceMaskStyle} /> : null}
      <div
        ref={regionRef}
        className={`editor-region editor-region--detected editor-region--${regionType} editor-region--dynamic ${isSelected && !printMode ? "editor-region--selected" : ""} ${isInlineEditing ? "editor-region--inline-editing" : ""}`.trim()}
        style={{
          ...regionStyle,
          cursor: interactive ? (isInlineEditing ? "text" : (regionType === "image" ? "pointer" : "text")) : "default"
        }}
        onClick={handleSelect}
        onDoubleClick={handleSelect}
        onKeyDown={(event) => {
          if (!interactive || isInlineEditing) {
            return;
          }

          if (event.key === "Enter" || event.key === " ") {
            handleSelect(event);
          }
        }}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-label={label}
      >
        {isSelected && interactive && !isInlineEditing ? <span className="editor-region__badge">{label}</span> : null}
        {isSelected && interactive && !isInlineEditing ? (
          <div
            className="editor-region__toolbar catalog-region-toolbar"
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {regionType !== "image" ? (
              <button className="editor-region__tool" type="button" onClick={() => onInlineEditStart?.(regionKey)}>
                Edit on canvas
              </button>
            ) : (
              <label className="editor-region__tool catalog-region-toolbar__file">
                Change image
                <input
                  ref={replaceImageInputRef}
                  className="editor-region__file-input"
                  type="file"
                  accept="image/*"
                  onChange={(event) => onImageSelected?.(event.target.files?.[0] || null, regionKey)}
                />
              </label>
            )}
            <span className="editor-region__tool-hint">
              {regionType === "image" ? "Click to replace" : "Editing"}
            </span>
          </div>
        ) : null}
        {regionType === "image" ? (
          shouldShowOverlayContent ? (
            <div
              aria-hidden="true"
              className="editor-region__image-fill"
              style={{
                background: resolvedImageMatteColor,
                clipPath: resolvedRegionClipPath || undefined
              }}
            >
              <img
                className="editor-region__image-fill-media"
                src={region.imageSrc}
                alt={label}
                style={{
                  width: `${renderImageLayout.renderedWidth}px`,
                  height: `${renderImageLayout.renderedHeight}px`,
                  transform: `translate(-50%, -50%) translate(${imageTranslateX}px, ${imageTranslateY}px)`
                }}
              />
            </div>
          ) : null
        ) : (
          isInlineEditing ? (
            isCompactSingleLineEditor ? (
              <input
                className="editor-region__inline-editor editor-region__inline-editor--single-line"
                type="text"
                value={inlineEditValue}
                autoFocus
                spellCheck={false}
                placeholder={regionText}
                style={inlineEditorStyle}
                onChange={(event) => onInlineEditChange?.(regionKey, event.target.value)}
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                onDoubleClick={(event) => event.stopPropagation()}
                onBlur={() => onInlineEditDone?.(regionKey)}
                onKeyDown={handleInlineEditorKeyDown}
              />
            ) : (
              <textarea
                className="editor-region__inline-editor"
                value={inlineEditValue}
                autoFocus
                spellCheck={false}
                placeholder={regionText}
                style={inlineEditorStyle}
                onChange={(event) => onInlineEditChange?.(regionKey, event.target.value)}
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                onDoubleClick={(event) => event.stopPropagation()}
                onBlur={() => onInlineEditDone?.(regionKey)}
                onKeyDown={handleInlineEditorKeyDown}
              />
            )
          ) : shouldShowOverlayContent ? (
            <span className="editor-region__text editor-region__text--dynamic" style={inlineTextStyle}>
              {regionText}
            </span>
          ) : null
        )}
      </div>
    </>
  );
}

function CatalogPages({
  version,
  template,
  printMode = false,
  focusRegionKey = null,
  onSelectRegion = null,
  editorState = null
}) {
  if (!version || !template) {
    return null;
  }

  const { catalog } = version;
  const activeEditorState = !printMode ? editorState : null;
  const selectedCanvasRegionKey = activeEditorState?.selectedRegionKey || focusRegionKey;
  const inlineCanvasRegionKey = activeEditorState?.inlineEditorRegionKey || null;
  const resolvedTemplate = useMemo(
    () => applyCatalogRegionOverridesToTemplate(template, catalog, activeEditorState?.manualState || null),
    [activeEditorState?.manualState, catalog, template]
  );
  const { page1, page2 } = resolvedTemplate;
  const preservesSourceArtwork = resolvedTemplate.preserveSourceArtwork === true;
  const translatesSourceArtwork = preservesSourceArtwork && isTranslatedLanguage(catalog.language);
  const regionOptions = useMemo(() => getCatalogEditorRegionOptions(resolvedTemplate), [resolvedTemplate]);
  const usesDetectedRegions = regionOptions.some((region) => region.dynamic);
  const pageIds = getTemplatePageIds(resolvedTemplate);
  const resolvedPageSize = resolvePageSize(resolvedTemplate.pageSize);
  const languageClass = isTranslatedLanguage(catalog.language) ? "catalog-surface--translated" : "";
  const scriptClass = isDevanagariLanguage(catalog.language) ? "catalog-surface--devanagari" : "";
  const directionClass = isRtlLanguage(catalog.language) ? "catalog-surface--rtl" : "";
  const languageCode = getLanguageCode(catalog.language);
  const titleStyle = getTitleStyle(catalog.title, catalog.language, catalog.layoutSettings);
  const heroImage = resolveHeroDisplayImage(catalog, resolvedTemplate);
  const heroFrameStyle = page1.heroOverlay.frameStyle || "card";
  const showLegacyPage2CanvasMask = !usesDetectedRegions
    && usesLegacyPage2CanvasMask(page2.background, resolvedTemplate.pageSize);
  const page2SpecPanelHeight = showLegacyPage2CanvasMask
    ? page2.specsPanel.height
    : getSpecPanelHeight(catalog, resolvedTemplate);
  const showSharedBrandFrame = resolvedTemplate.brandFrame === "shared";
  const previewHeroImage = selectedCanvasRegionKey === "heroOverlay" && activeEditorState?.heroPreviewUrl
    ? activeEditorState.heroPreviewUrl
    : heroImage;
  const [sampledRegionBackgrounds, setSampledRegionBackgrounds] = useState({});
  const backgroundSampleFingerprint = useMemo(
    () => JSON.stringify(
      (resolvedTemplate.editableRegions || []).map((region) => [
        region.id,
        region.page,
        region.type,
        region.x,
        region.y,
        region.width,
        region.height,
        region.originalX,
        region.originalY,
        region.originalWidth,
        region.originalHeight,
        region.background,
        region.content,
        region.imageSrc
      ])
    ),
    [resolvedTemplate]
  );

  useEffect(() => {
    if (!usesDetectedRegions) {
      setSampledRegionBackgrounds({});
      return undefined;
    }

    let ignore = false;

    sampleTemplateEditableRegionBackgrounds(resolvedTemplate)
      .then((backgrounds) => {
        if (!ignore) {
          setSampledRegionBackgrounds(backgrounds);
        }
      })
      .catch(() => {
        if (!ignore) {
          setSampledRegionBackgrounds({});
        }
      });

    return () => {
      ignore = true;
    };
  }, [backgroundSampleFingerprint, resolvedTemplate, usesDetectedRegions]);
  const getCatalogTextValue = (regionKey) => {
    if (
      selectedCanvasRegionKey !== regionKey ||
      !activeEditorState?.manualState ||
      activeEditorState.manualState.regionKey !== regionKey
    ) {
      if (regionKey === "titleRegion") {
        return catalog.title;
      }
      return formatListForTextarea(catalog[regionKey] || []);
    }

    if (regionKey === "titleRegion") {
      return activeEditorState.manualState.title || "";
    }

    return activeEditorState.manualState.listText || "";
  };
  const getCatalogListPreviewItems = (regionKey) => {
    if (
      selectedCanvasRegionKey === regionKey &&
      activeEditorState?.manualState &&
      activeEditorState.manualState.regionKey === regionKey
    ) {
      return normalizeTextareaListItems(activeEditorState.manualState.listText);
    }

    return Array.isArray(catalog[regionKey]) ? catalog[regionKey] : [];
  };
  const getInteractiveProps = (regionKey, { inlineEditable = false } = {}) => {
    if (printMode || typeof onSelectRegion !== "function") {
      return {};
    }

    return {
      role: "button",
      tabIndex: 0,
      onMouseDown: (event) => {
        event.preventDefault();
      },
      onClick: (event) => {
        event.preventDefault();
        event.stopPropagation();
        onSelectRegion(regionKey);

        if (inlineEditable) {
          activeEditorState?.onInlineEditStart?.(regionKey);
        }
      },
      onDoubleClick: inlineEditable
        ? (event) => {
            event.preventDefault();
            event.stopPropagation();
            activeEditorState?.onInlineEditStart?.(regionKey);
          }
        : undefined,
      onKeyDown: (event) => {
        if (inlineEditable && event.key === "Enter" && selectedCanvasRegionKey === regionKey) {
          event.preventDefault();
          activeEditorState?.onInlineEditStart?.(regionKey);
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelectRegion(regionKey);
        }
      }
    };
  };
  const renderCatalogToolbar = (regionKey, mode = "text") => {
    if (!activeEditorState || selectedCanvasRegionKey !== regionKey) {
      return null;
    }

    const isInlineEditing = inlineCanvasRegionKey === regionKey;

    return (
      <div
        className="editor-region__toolbar catalog-region-toolbar"
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {mode === "text" ? (
          <button
            className="editor-region__tool"
            type="button"
            onClick={() => (isInlineEditing ? activeEditorState.onInlineEditDone?.(regionKey) : activeEditorState.onInlineEditStart?.(regionKey))}
          >
            {isInlineEditing ? "Done" : "Edit on canvas"}
          </button>
        ) : null}
        {mode === "image" ? (
          <label className="editor-region__tool catalog-region-toolbar__file">
            Change image
            <input
              className="editor-region__file-input"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                if (activeEditorState.onRegionImageSelected) {
                  activeEditorState.onRegionImageSelected(file, regionKey);
                  return;
                }

                activeEditorState.onHeroImageSelected?.(file, regionKey);
              }}
            />
          </label>
        ) : null}
        {activeEditorState.onUseAiForRegion ? (
          <button className="editor-region__tool" type="button" onClick={() => activeEditorState.onUseAiForRegion(regionKey)}>
            Use AI
          </button>
        ) : null}
        <span className="editor-region__tool-hint">
          {mode === "image"
            ? "Click to select"
            : (isInlineEditing ? "Ctrl+Enter" : "Editing")}
        </span>
      </div>
    );
  };

  const renderDynamicRegions = (pageId) => regionOptions
    .filter((region) => region.dynamic && region.pageId === pageId)
    .map((region) => (
      <CatalogDynamicRegion
        key={region.key}
        template={resolvedTemplate}
        regionKey={region.key}
        label={region.label}
        isSelected={selectedCanvasRegionKey === region.key}
        isInlineEditing={inlineCanvasRegionKey === region.key}
        inlineEditValue={inlineCanvasRegionKey === region.key ? activeEditorState?.inlineEditorValue || "" : ""}
        sampledBackground={sampledRegionBackgrounds[region.key] || null}
        printMode={printMode}
        onSelect={onSelectRegion}
        onInlineEditStart={activeEditorState?.onInlineEditStart}
        onInlineEditChange={activeEditorState?.onInlineEditChange}
        onInlineEditDone={activeEditorState?.onInlineEditDone}
        onImageSelected={activeEditorState?.onRegionImageSelected}
      />
    ));

  const renderTitleRegion = (pageId) => {
    const region = page1.titleRegion;
    const sourceTitleIsUnchanged = String(catalog.title || "").trim() === String(region.sourceValue || "").trim();
    if (
      (preservesSourceArtwork && sourceTitleIsUnchanged)
      || usesDetectedRegions
      || region.hidden
      || normalizeTemplateRegionPage(region.page) !== pageId
    ) {
      return null;
    }

    return (
      <div
        className={`overlay-box overlay-box--title ${preservesSourceArtwork ? "overlay-box--source-artwork" : ""} ${selectedCanvasRegionKey === "titleRegion" ? "overlay-region--focused" : ""} ${onSelectRegion && !printMode ? "overlay-region--interactive" : ""}`.trim()}
        style={{
          left: `${(region.x / resolvedTemplate.pageSize.width) * 100}%`,
          top: `${(region.y / resolvedTemplate.pageSize.height) * 100}%`,
          width: `${(region.width / resolvedTemplate.pageSize.width) * 100}%`,
          height: `${(region.height / resolvedTemplate.pageSize.height) * 100}%`,
          background: region.background,
          ...titleStyle,
          ...(preservesSourceArtwork
            ? { "--preview-title-size": `${(34 / resolvedTemplate.pageSize.width) * 100}cqw` }
            : {})
        }}
        {...getInteractiveProps("titleRegion", { inlineEditable: true })}
      >
        {renderCatalogToolbar("titleRegion")}
        {inlineCanvasRegionKey === "titleRegion" ? (
          <input
            className="editor-region__inline-editor editor-region__inline-editor--single-line catalog-inline-editor catalog-inline-editor--title"
            type="text"
            value={activeEditorState?.inlineEditorValue || ""}
            autoFocus
            spellCheck={false}
            style={{
              background: region.background,
              color: region.textColor || "#a7192d",
              fontSize: "var(--preview-title-size)",
              fontFamily: "var(--preview-title-family)",
              fontWeight: 500,
              letterSpacing: "-0.03em",
              lineHeight: 1.02
            }}
            onChange={(event) => activeEditorState?.onInlineEditChange?.("titleRegion", event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onBlur={() => activeEditorState?.onInlineEditDone?.("titleRegion")}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === "Escape" || event.key === "Enter" || ((event.ctrlKey || event.metaKey) && event.key === "Enter")) {
                event.preventDefault();
                activeEditorState?.onInlineEditDone?.("titleRegion");
              }
            }}
          />
        ) : (
          <div className="overlay-title" style={{ color: region.textColor || "#a7192d", fontWeight: 500 }}>
            {getCatalogTextValue("titleRegion")}
          </div>
        )}
      </div>
    );
  };

  const renderHeroRegion = (pageId) => {
    const region = page1.heroOverlay;
    const isOnPage = normalizeTemplateRegionPage(region.page) === pageId;
    const shouldShow = (!preservesSourceArtwork || Boolean(previewHeroImage))
      && !usesDetectedRegions
      && !region.hidden
      && isOnPage
      && (previewHeroImage || !templateUsesBakedInHeroArtwork(resolvedTemplate));

    if (!shouldShow) {
      return null;
    }

    return (
      <div
        className={`overlay-hero-image overlay-hero-image--${heroFrameStyle} ${selectedCanvasRegionKey === "heroOverlay" ? "overlay-region--focused" : ""} ${onSelectRegion && !printMode ? "overlay-region--interactive" : ""}`.trim()}
        style={{
          left: `${(region.x / resolvedTemplate.pageSize.width) * 100}%`,
          top: `${(region.y / resolvedTemplate.pageSize.height) * 100}%`,
          width: `${(region.width / resolvedTemplate.pageSize.width) * 100}%`,
          height: `${(region.height / resolvedTemplate.pageSize.height) * 100}%`
        }}
        {...getInteractiveProps("heroOverlay")}
      >
        {renderCatalogToolbar("heroOverlay", "image")}
        {previewHeroImage ? (
          <img
            src={previewHeroImage}
            alt="Machine visual"
            style={{
              objectFit: region.objectFit || "contain",
              objectPosition: region.objectPosition || "center center"
            }}
          />
        ) : (
          <div className="overlay-hero-image__placeholder">Editable image area</div>
        )}
      </div>
    );
  };

  const renderMachineCategoryRegion = (pageId) => {
    const region = page1.machineCategoryRegion;
    if (!preservesSourceArtwork || !region || region.hidden || normalizeTemplateRegionPage(region.page) !== pageId) {
      return null;
    }

    const value = String(catalog.machineCategory || "");
    if (!translatesSourceArtwork && value.trim() === String(region.sourceValue || "").trim()) {
      return null;
    }

    return (
      <div
        className={`overlay-machine-category ${preservesSourceArtwork ? "overlay-machine-category--source-artwork" : ""}`.trim()}
        style={{
          left: `${(region.x / resolvedTemplate.pageSize.width) * 100}%`,
          top: `${(region.y / resolvedTemplate.pageSize.height) * 100}%`,
          width: `${(region.width / resolvedTemplate.pageSize.width) * 100}%`,
          height: `${(region.height / resolvedTemplate.pageSize.height) * 100}%`,
          background: region.background || "#ffffff",
          color: region.textColor || "#4b4b4b"
        }}
      >
        {value}
      </div>
    );
  };

  const renderColumns = (pageId) => {
    if (usesDetectedRegions) {
      return null;
    }

    return page1.columns
      .filter((region) => !region.hidden && normalizeTemplateRegionPage(region.page) === pageId)
      .filter((region) => {
        if (!preservesSourceArtwork || translatesSourceArtwork) {
          return true;
        }

        const sourceItems = Array.isArray(region.sourceItems) ? region.sourceItems : [];
        const currentItems = Array.isArray(catalog[region.key]) ? catalog[region.key] : [];
        return JSON.stringify(sourceItems) !== JSON.stringify(currentItems);
      })
      .map((region) => {
        const items = Array.isArray(catalog[region.key]) ? catalog[region.key] : [];
        const previewItems = selectedCanvasRegionKey === region.key ? getCatalogListPreviewItems(region.key) : items;
        const { visibleItems, hiddenCount, style } = getVisibleColumnItems(
          previewItems,
          region,
          catalog.language,
          catalog.layoutSettings
        );
        const textColor = region.textColor || "#ffffff";
        const sourceScaledStyle = preservesSourceArtwork
          ? {
              "--column-title-size": toSourceContainerUnit(style["--column-title-size"], resolvedTemplate.pageSize.width),
              "--column-item-size": toSourceContainerUnit(style["--column-item-size"], resolvedTemplate.pageSize.width),
              "--column-line-height-px": toSourceContainerUnit(style["--column-line-height-px"], resolvedTemplate.pageSize.width),
              "--column-gap": toSourceContainerUnit(style["--column-gap"], resolvedTemplate.pageSize.width),
              "--column-title-gap": toSourceContainerUnit(style["--column-title-gap"], resolvedTemplate.pageSize.width)
            }
          : {};

        return (
          <div
            className={`overlay-column ${preservesSourceArtwork ? "overlay-column--source-artwork" : ""} ${selectedCanvasRegionKey === region.key ? "overlay-region--focused" : ""} ${onSelectRegion && !printMode ? "overlay-region--interactive" : ""} ${inlineCanvasRegionKey === region.key ? "overlay-column--editing" : ""}`.trim()}
            key={region.key}
            style={{
              left: `${(region.x / resolvedTemplate.pageSize.width) * 100}%`,
              top: `${(region.y / resolvedTemplate.pageSize.height) * 100}%`,
              width: `${(region.width / resolvedTemplate.pageSize.width) * 100}%`,
              height: `${(region.height / resolvedTemplate.pageSize.height) * 100}%`,
              background: region.background,
              color: textColor,
              ...style,
              ...sourceScaledStyle
            }}
            {...getInteractiveProps(region.key, { inlineEditable: true })}
          >
            {renderCatalogToolbar(region.key)}
            <div className="overlay-column__title" style={{ color: region.titleColor || textColor }}>
              {catalog.sectionLabels?.[region.key] || region.label}
            </div>
            {inlineCanvasRegionKey === region.key ? (
              <textarea
                className="editor-region__inline-editor catalog-inline-editor catalog-inline-editor--list"
                value={activeEditorState?.inlineEditorValue || ""}
                autoFocus
                spellCheck={false}
                style={{
                  background: "transparent",
                  color: textColor,
                  fontSize: "8.8px",
                  lineHeight: 1.38,
                  padding: "0",
                  marginTop: "2px"
                }}
                onChange={(event) => activeEditorState?.onInlineEditChange?.(region.key, event.target.value)}
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                onBlur={() => activeEditorState?.onInlineEditDone?.(region.key)}
                onKeyDown={(event) => {
                  event.stopPropagation();
                  if (event.key === "Escape" || ((event.ctrlKey || event.metaKey) && event.key === "Enter")) {
                    event.preventDefault();
                    activeEditorState?.onInlineEditDone?.(region.key);
                  }
                }}
              />
            ) : (
              <>
                <WrappedList items={visibleItems} />
                <ColumnOverflowNote hiddenCount={hiddenCount} />
              </>
            )}
          </div>
        );
      });
  };

  const renderSpecsPanel = (pageId) => {
    const region = page2.specsPanel;
    if (
      preservesSourceArtwork
      || usesDetectedRegions
      || region.hidden
      || normalizeTemplateRegionPage(region.page || "page2") !== pageId
    ) {
      return null;
    }

    return (
      <div
        className={`overlay-spec-panel ${selectedCanvasRegionKey === "specsPanel" ? "overlay-region--focused" : ""} ${onSelectRegion && !printMode ? "overlay-region--interactive" : ""}`.trim()}
        style={{
          left: `${(region.x / resolvedTemplate.pageSize.width) * 100}%`,
          top: `${(region.y / resolvedTemplate.pageSize.height) * 100}%`,
          width: `${(region.width / resolvedTemplate.pageSize.width) * 100}%`,
          height: `${(page2SpecPanelHeight / resolvedTemplate.pageSize.height) * 100}%`,
          background: region.background,
          borderLeftColor: region.borderColor,
          "--spec-accent-color": region.accentColor || region.borderColor
        }}
        {...getInteractiveProps("specsPanel")}
      >
        {renderCatalogToolbar("specsPanel", "specs")}
        <SpecPanel catalog={catalog} template={resolvedTemplate} />
      </div>
    );
  };

  const renderLegalNote = (pageId) => {
    const region = page1.legalNoteRegion;
    if (!region || region.hidden || normalizeTemplateRegionPage(region.page) !== pageId) {
      return null;
    }

    if (
      preservesSourceArtwork
      && !translatesSourceArtwork
      && String(catalog.legalNote || "").trim() === String(region.sourceValue || "").trim()
    ) {
      return null;
    }

    return (
      <div
        className={`overlay-legal-note ${preservesSourceArtwork ? "overlay-legal-note--source-artwork" : ""}`.trim()}
        style={{
          left: `${(region.x / resolvedTemplate.pageSize.width) * 100}%`,
          top: `${(region.y / resolvedTemplate.pageSize.height) * 100}%`,
          width: `${(region.width / resolvedTemplate.pageSize.width) * 100}%`,
          height: `${(region.height / resolvedTemplate.pageSize.height) * 100}%`,
          background: region.background,
          color: region.textColor || "#4d545d"
        }}
      >
        <strong>{catalog.sectionLabels?.note || "Note"}:</strong> {catalog.legalNote}
      </div>
    );
  };

  return (
    <div
      className={`catalog-pages ${languageClass} ${scriptClass} ${directionClass} ${printMode ? "catalog-pages--print" : ""}`.trim()}
      lang={languageCode}
    >
      {pageIds.map((pageId) => (
        <div
          className={printMode ? "print-page" : ""}
          key={pageId}
          style={printMode ? { width: resolvedPageSize.width, height: resolvedPageSize.height } : undefined}
        >
          <Page background={resolvedTemplate[pageId].background} pageSize={resolvedTemplate.pageSize}>
            {showSharedBrandFrame && ["page1", "page2"].includes(pageId)
              ? <SharedBrandFrame pageId={pageId} catalog={catalog} />
              : null}
            {pageId === "page2" && showLegacyPage2CanvasMask ? (
              <div
                className="catalog-page__canvas-mask"
                style={{
                  left: `${(278 / resolvedTemplate.pageSize.width) * 100}%`,
                  top: "0%",
                  width: `${((resolvedTemplate.pageSize.width - 278) / resolvedTemplate.pageSize.width) * 100}%`,
                  height: `${(702 / resolvedTemplate.pageSize.height) * 100}%`
                }}
              />
            ) : null}
            {usesDetectedRegions ? renderDynamicRegions(pageId) : null}
            {renderTitleRegion(pageId)}
            {renderMachineCategoryRegion(pageId)}
            {renderHeroRegion(pageId)}
            {renderColumns(pageId)}
            {renderSpecsPanel(pageId)}
            {renderLegalNote(pageId)}
            {preservesSourceArtwork && translatesSourceArtwork ? (
              <SourceSpecificationOverlay catalog={catalog} template={resolvedTemplate} pageId={pageId} />
            ) : null}
            {preservesSourceArtwork && translatesSourceArtwork ? (
              <SourcePageTextOverlays catalog={catalog} template={resolvedTemplate} pageId={pageId} />
            ) : null}
            {preservesSourceArtwork && !translatesSourceArtwork ? (
              <SourceSpecValueOverlays catalog={catalog} template={resolvedTemplate} pageId={pageId} />
            ) : null}
          </Page>
        </div>
      ))}
    </div>
  );
}

function CatalogPreview({ label, version, template, focusRegionKey = null, onSelectRegion = null, editorState = null }) {
  if (!version || !template) {
    return null;
  }

  const { catalog } = version;
  const translatedClass = isTranslatedLanguage(catalog.language) ? "catalog-surface--translated" : "";
  const scriptClass = isDevanagariLanguage(catalog.language) ? "catalog-surface--devanagari" : "";
  const directionClass = isRtlLanguage(catalog.language) ? "catalog-surface--rtl" : "";

  return (
    <section
      className={`catalog-surface ${translatedClass} ${scriptClass} ${directionClass}`.trim()}
      lang={getLanguageCode(catalog.language)}
    >
      <div className="catalog-surface__header">
        <div>
          <h3>{label}</h3>
          <p>
            {version.versionLabel} | {catalog.language}
          </p>
        </div>
        <StatusPill tone={version.status === "approved" ? "success" : "warning"}>
          {version.status}
        </StatusPill>
      </div>
      <LayoutWarning version={version} />
      <CatalogPages
        version={version}
        template={template}
        focusRegionKey={focusRegionKey}
        onSelectRegion={onSelectRegion}
        editorState={editorState}
      />
    </section>
  );
}

function VersionCard({ version, isSelected, onSelect, onApprove, onExport }) {
  const hasLayoutIssue = Boolean(version.layoutIssues?.length);

  return (
    <div
      className={`version-card ${isSelected ? "version-card--selected" : ""}`}
      onClick={() => onSelect(version.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(version.id);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="version-card__topline">
        <strong>{version.versionLabel}</strong>
        <StatusPill
          tone={
            hasLayoutIssue
              ? "warning"
              : version.status === "approved"
                ? "success"
                : version.status === "draft"
                  ? "warning"
                  : "neutral"
          }
        >
          {hasLayoutIssue ? "needs reflow" : version.status}
        </StatusPill>
      </div>
      <div className="version-card__meta">
        <span>{version.language}</span>
        <span>{new Date(version.createdAt).toLocaleString()}</span>
      </div>
      <p>{version.summary}</p>
      {hasLayoutIssue ? <div className="version-card__warning">{version.layoutIssues[0].message}</div> : null}
      <div className="version-card__actions">
        {version.status === "draft" ? (
          <button
            className="inline-action"
            onClick={(event) => {
              event.stopPropagation();
              onApprove(version.id);
            }}
            type="button"
          >
            Approve
          </button>
        ) : null}
        <button
          className="inline-action"
          onClick={(event) => {
            event.stopPropagation();
            onExport(version.id);
          }}
          type="button"
          disabled={hasLayoutIssue}
          title={hasLayoutIssue ? "Reduce content or use a larger template before export" : "Export PDF"}
        >
          Export PDF
        </button>
      </div>
    </div>
  );
}

function TemplateThumbnail({ template }) {
  const page1 = template.page1;
  const specsPanel = template.page2.specsPanel;
  const heroPreview = resolveTemplateHeroPreviewImage(template);
  const showHeroZone = !page1.heroOverlay.hidden && (heroPreview || !templateUsesBakedInHeroArtwork(template));
  const editableRegionCount = (template.editableRegions || []).filter((region) => !region.hidden).length;
  const usesDetectedRegions = editableRegionCount > 0;
  const renderThumbnailColumns = (pageId) => page1.columns
    .filter((column) => !column.hidden && normalizeTemplateRegionPage(column.page) === pageId)
    .map((column) => (
      <div
        key={column.key}
        className="template-thumb__column"
        style={{
          left: `${(column.x / template.pageSize.width) * 100}%`,
          top: `${(column.y / template.pageSize.height) * 100}%`,
          width: `${(column.width / template.pageSize.width) * 100}%`,
          height: `${(column.height / template.pageSize.height) * 100}%`,
          background: column.background,
          color: column.textColor || "#ffffff"
        }}
      >
        <strong style={{ color: column.titleColor || column.textColor || "#ffffff" }}>{column.label}</strong>
        <span>
          {(templatePreviewCatalog[column.key] || templatePreviewCatalog.features)
            .slice(0, 3)
            .join(" • ")}
        </span>
      </div>
    ));
  const renderThumbnailSpecs = (pageId) => {
    if (specsPanel.hidden || normalizeTemplateRegionPage(specsPanel.page || "page2") !== pageId) {
      return null;
    }

    return (
      <div
        className="template-thumb__specs"
        style={{
          left: `${(specsPanel.x / template.pageSize.width) * 100}%`,
          top: `${(specsPanel.y / template.pageSize.height) * 100}%`,
          width: `${(specsPanel.width / template.pageSize.width) * 100}%`,
          height: `${(specsPanel.height / template.pageSize.height) * 100}%`,
          background: specsPanel.background,
          borderLeftColor: specsPanel.borderColor
        }}
      >
        <div className="template-thumb__specs-title">{specsPanel.title || "Specifications"}</div>
        <div className="template-thumb__specs-row" />
        <div className="template-thumb__specs-row" />
        <div className="template-thumb__specs-row" />
        <div className="template-thumb__specs-row" />
      </div>
    );
  };

  return (
    <div className="template-thumb">
      <div className="template-thumb__grid">
        <div
          className="template-thumb__page template-thumb__page--primary"
          style={getPageSizeStyle(template.pageSize, { backgroundImage: `url(${page1.background})` })}
        >
          {!page1.titleRegion.hidden && normalizeTemplateRegionPage(page1.titleRegion.page) === "page1" ? (
            <div
              className="template-thumb__title"
              style={{
                left: `${(page1.titleRegion.x / template.pageSize.width) * 100}%`,
                top: `${(page1.titleRegion.y / template.pageSize.height) * 100}%`,
                width: `${(page1.titleRegion.width / template.pageSize.width) * 100}%`,
                height: `${(page1.titleRegion.height / template.pageSize.height) * 100}%`,
                background: page1.titleRegion.background
              }}
            >
              {templatePreviewCatalog.title}
            </div>
          ) : null}

          {!usesDetectedRegions && showHeroZone && normalizeTemplateRegionPage(page1.heroOverlay.page) === "page1" ? (
            <div
              className="template-thumb__hero"
              style={{
                left: `${(page1.heroOverlay.x / template.pageSize.width) * 100}%`,
                top: `${(page1.heroOverlay.y / template.pageSize.height) * 100}%`,
                width: `${(page1.heroOverlay.width / template.pageSize.width) * 100}%`,
                height: `${(page1.heroOverlay.height / template.pageSize.height) * 100}%`
              }}
            >
              {heroPreview ? <img src={heroPreview} alt="" /> : <div className="template-thumb__hero-placeholder">Image Area</div>}
            </div>
          ) : null}

          {!usesDetectedRegions ? renderThumbnailColumns("page1") : null}
          {!usesDetectedRegions ? renderThumbnailSpecs("page1") : null}
        </div>

        <div
          className="template-thumb__page template-thumb__page--secondary"
          style={getPageSizeStyle(template.pageSize, { backgroundImage: `url(${template.page2.background})` })}
        >
          {!usesDetectedRegions ? renderThumbnailColumns("page2") : null}
          {!usesDetectedRegions ? renderThumbnailSpecs("page2") : null}
        </div>
      </div>
      {usesDetectedRegions ? (
        <div className="template-thumb__region-count">{editableRegionCount} editable areas detected from the source design</div>
      ) : null}
    </div>
  );
}

function TemplateCard({ template, isSelected, isActive, onSelect }) {
  return (
    <button
      className={`template-card ${isSelected ? "template-card--selected" : ""} ${isActive ? "template-card--active" : ""}`.trim()}
      type="button"
      onClick={() => onSelect(template.id)}
    >
      <TemplateThumbnail template={template} />
      <div className="template-card__body">
        <div className="template-card__topline">
          <strong>{template.name}</strong>
          <StatusPill tone={template.kind === "custom" ? "success" : "neutral"}>
            {template.kind === "custom" ? "custom" : "built in"}
          </StatusPill>
        </div>
        <p>{template.description}</p>
      </div>
    </button>
  );
}

function WorkspaceModal({ open, title, subtitle, onClose, children, size = "wide" }) {
  if (!open) {
    return null;
  }

  return (
    <div className="workspace-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className={`workspace-modal workspace-modal--${size}`.trim()}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="workspace-modal__header">
          <div>
            <h3>{title}</h3>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button className="icon-button workspace-modal__close" type="button" onClick={onClose} aria-label="Close dialog">
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="workspace-modal__body">
          {children}
        </div>
      </div>
    </div>
  );
}

function CatalogLibraryCard({ item, isActive, onSelect }) {
  const kindLabel = item.kind === "uploaded_pdf" ? "uploaded pdf" : "structured";

  return (
    <article className={`catalog-tile ${isActive ? "catalog-tile--active" : ""}`.trim()}>
      <div className="catalog-tile__media">
        {item.coverImage ? (
          <img src={item.coverImage} alt={`${item.title} preview`} />
        ) : (
          <div className="catalog-tile__placeholder">
            <strong>{item.title}</strong>
            <span>{item.sourceType === "pdf" ? "PDF catalog" : "Catalog preview"}</span>
          </div>
        )}
      </div>
      <div className="catalog-tile__body">
        <div className="template-card__topline">
          <strong>{item.title}</strong>
          <StatusPill tone={isActive ? "success" : "neutral"}>{isActive ? "active" : kindLabel}</StatusPill>
        </div>
        <p>{item.description}</p>
        <div className="catalog-tile__meta">
          <span>{item.language}</span>
          <span>{item.sourceType === "pdf" ? "Uploaded PDF" : "System catalog"}</span>
        </div>
        <div className="catalog-tile__actions">
          <button className="primary-button" type="button" onClick={() => onSelect(item.id)}>
            {isActive ? "Selected" : "Use Catalog"}
          </button>
          {item.sourcePdfUrl ? (
            <a className="catalog-tile__link" href={item.sourcePdfUrl} target="_blank" rel="noreferrer">
              View PDF
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function EditorPageCard({ page, isSelected, blockCount, activeBlockLabel, onClick }) {
  return (
    <button
      className={`editor-page-card ${isSelected ? "editor-page-card--selected" : ""}`.trim()}
      type="button"
      onClick={onClick}
    >
      <div className={`editor-page-card__thumb editor-page-card__thumb--${page.id}`}>
        <div className="editor-page-card__shape editor-page-card__shape--title" />
        {page.id === "page1" ? (
          <>
            <div className="editor-page-card__shape editor-page-card__shape--hero" />
            <div className="editor-page-card__shape editor-page-card__shape--column" />
            <div className="editor-page-card__shape editor-page-card__shape--column" />
            <div className="editor-page-card__shape editor-page-card__shape--column" />
          </>
        ) : (
          <>
            <div className="editor-page-card__shape editor-page-card__shape--panel" />
            <div className="editor-page-card__shape editor-page-card__shape--table-row" />
            <div className="editor-page-card__shape editor-page-card__shape--table-row" />
            <div className="editor-page-card__shape editor-page-card__shape--table-row" />
          </>
        )}
      </div>
      <div className="editor-page-card__body">
        <span>{page.label}</span>
        <strong>{page.title}</strong>
        <small>{blockCount} blocks</small>
        {activeBlockLabel ? <em>Focused: {activeBlockLabel}</em> : null}
      </div>
    </button>
  );
}

function InspectorMetric({ label, value }) {
  return (
    <div className="inspector-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EditorRegion({
  template,
  regionKey,
  label,
  isSelected,
  isImageAdjusting = false,
  sampleText,
  regionType = "text",
  isDynamic = false,
  inlineEditValue = "",
  isInlineEditing = false,
  sampledBackground = null,
  onSelect,
  onStartDrag,
  onDelete,
  onRestore,
  onImageSelected,
  onRequestEdit,
  onToggleImageAdjust,
  onImagePanStart,
  onImageZoom,
  onResetImageCrop,
  onInlineEditStart,
  onInlineEditChange,
  onInlineEditDone
}) {
  const replaceImageInputRef = useRef(null);
  const regionRef = useRef(null);
  const [renderFrame, setRenderFrame] = useState(null);
  const region = getTemplateRegion(template, regionKey);
  if (!region || region.hidden) {
    return null;
  }

  useEffect(() => {
    if (!regionRef.current || typeof window === "undefined") {
      return undefined;
    }

    const element = regionRef.current;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      setRenderFrame((current) => {
        const next = {
          width: rect.width,
          height: rect.height
        };

        if (current && Math.abs(current.width - next.width) < 0.5 && Math.abs(current.height - next.height) < 0.5) {
          return current;
        }

        return next;
      });
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }

    const observer = new ResizeObserver(() => measure());
    observer.observe(element);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [regionKey, template.pageSize.height, template.pageSize.width]);

  const isDeleted = isDynamic && isDynamicRegionDeleted(region);
  const hasTextOverride = isDynamic && regionType !== "image" && hasDynamicTextOverride(region);
  const hasImageOverride = isDynamic && regionType === "image" && hasDynamicImageOverride(region);
  const hasGeometryOverride = isDynamic && regionType !== "image" && hasDynamicGeometryOverride(region);
  const canInlineEdit = isDynamic && regionType !== "image" && !isDeleted;
  const resolvedTextSurface = regionType === "image"
    ? "transparent"
    : (isTransparentRegionBackground(region.background)
      ? (sampledBackground || "rgba(255,255,255,0.92)")
      : region.background);
  const resolvedTextColor = isDynamic
    ? getReadableTextColor(region.textColor || "#1f2933", resolvedTextSurface)
    : (region.textColor || "#1f2933");
  const resolvedPlaceholderColor = isDynamic
    ? getReadablePlaceholderColor(resolvedTextColor, resolvedTextSurface)
    : "rgba(52, 66, 78, 0.45)";
  const shouldMaskSourceContent = canInlineEdit && (isInlineEditing || hasTextOverride || hasGeometryOverride);
  const shouldShowOverlayContent = !isDynamic || isDeleted || hasTextOverride || hasImageOverride || isInlineEditing || (canInlineEdit && hasGeometryOverride);
  const shouldShowToolbar = isDynamic && isSelected && !isInlineEditing;
  const shouldShowBadge = !isDynamic || (isSelected && !isInlineEditing);
  const dynamicOverlayBackground = isDeleted
    ? (region.background || "rgba(255,255,255,0.92)")
    : (isInlineEditing
      ? resolvedTextSurface
      : (shouldShowOverlayContent
      ? (regionType === "image" ? (region.background || "rgba(255,255,255,0.08)") : resolvedTextSurface)
      : "transparent"));
  const heroImage = template.page1.heroOverlay.placeholderImage;
  const regionText = region.content || region.label || region.title || sampleText;
  const activeText = isInlineEditing ? inlineEditValue : regionText;
  const dynamicImageSrc = region.imageSrc || null;
  const resolvedImageSrc = dynamicImageSrc || (regionKey === "heroOverlay" ? heroImage : null);
  const shouldShowImageFill = Boolean(resolvedImageSrc) && (!isDynamic || hasImageOverride) && !isDeleted;
  const editableRegionId = isEditableRegionKey(regionKey) ? getEditableRegionId(regionKey) : null;
  const imageRegionFallback = getTemplateImageRegionFallback(template?.id, editableRegionId);
  const resolvedRegionClipPath = imageRegionFallback?.clipPath || (typeof region.clipPath === "string" && region.clipPath.trim()
    ? region.clipPath.trim()
    : null);
  const resolvedImageMatteColor = imageRegionFallback?.imageMatteColor || (typeof region.imageMatteColor === "string" && region.imageMatteColor.trim()
    ? region.imageMatteColor.trim()
    : "transparent");
  const currentFrame = getRegionFrame(region);
  const originalFrame = getOriginalRegionFrame(region);
  const maskSpread = Math.max(2, Math.round((region.fontSize || 18) * 0.12));
  const regionStyle = getFrameStyle(currentFrame, template.pageSize, {
    background: isDynamic
      ? ((regionType === "image" && shouldShowImageFill) ? resolvedImageMatteColor : dynamicOverlayBackground)
      : (region.background || "rgba(255,255,255,0.95)"),
    borderColor: isDynamic
      ? (isSelected ? (region.borderColor || "rgba(181,46,51,0.58)") : "transparent")
      : (region.borderColor || (regionKey === "specsPanel" ? region.borderColor : undefined)),
    borderRadius: `${region.radius || (isDynamic ? 12 : 14)}px`
  });
  const sourceMaskStyle = getFrameStyle(originalFrame, template.pageSize, {
    background: resolvedTextSurface,
    borderRadius: `${region.radius || 12}px`,
    boxShadow: `0 0 0 ${maskSpread}px ${resolvedTextSurface}`
  });
  const imageScale = getRegionImageScale(region);
  const imageOffset = getRegionImageOffset(region);
  const regionClassKey = isDynamic ? "detected" : regionKey;
  const renderFrameForText = renderFrame
    ? {
        x: 0,
        y: 0,
        width: renderFrame.width,
        height: renderFrame.height
      }
    : null;
  const inlineTextStyle = isDynamic
      ? {
        color: resolvedTextColor,
        fontWeight: Math.max(400, Math.round(region.fontWeight || 700)),
        textAlign: region.textAlign || "left",
        ...getFittedRegionTextStyle(region, activeText, renderFrameForText)
      }
    : undefined;
  const renderHeight = renderFrame?.height || currentFrame.height;
  const renderScaleX = renderFrame && currentFrame.width > 0 ? renderFrame.width / currentFrame.width : 1;
  const renderScaleY = renderFrame && currentFrame.height > 0 ? renderFrame.height / currentFrame.height : 1;
  const imageTranslateX = clampRegionImageOffset(imageOffset.x, "x", region, currentFrame, imageScale) * renderScaleX;
  const imageTranslateY = clampRegionImageOffset(imageOffset.y, "y", region, currentFrame, imageScale) * renderScaleY;
  const renderImageFrame = renderFrame
    ? {
        x: 0,
        y: 0,
        width: renderFrame.width,
        height: renderFrame.height
      }
    : currentFrame;
  const renderImageLayout = getRegionImageLayout(region, renderImageFrame, imageScale);
  const isCompactSingleLineEditor = getRegionTextLines(activeText).length <= 1 && renderHeight <= 30;
  const inlineEditorStyle = isDynamic
    ? {
        ...inlineTextStyle,
        background: resolvedTextSurface,
        caretColor: resolvedTextColor,
        "--editor-placeholder-color": resolvedPlaceholderColor
      }
    : undefined;
  const handleClick = (event) => {
    if (isInlineEditing) {
      return;
    }

    event.stopPropagation();
    onSelect(regionKey);
  };
  const handleKeyDown = (event) => {
    if (isInlineEditing) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (canInlineEdit && isSelected) {
        onInlineEditStart?.(regionKey);
        return;
      }

      onSelect(regionKey);
    }
  };
  const handleMouseDown = (event) => {
    if (isInlineEditing) {
      return;
    }

    event.stopPropagation();
    onSelect(regionKey);

    if (regionType === "image" && isImageAdjusting && shouldShowImageFill) {
      onImagePanStart?.(regionKey, event);
      return;
    }

    onStartDrag(regionKey, event);
  };
  const handleWheel = (event) => {
    if (!(regionType === "image" && isImageAdjusting && shouldShowImageFill)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    onImageZoom?.(regionKey, event.deltaY);
  };
  const handleDoubleClick = (event) => {
    if (!canInlineEdit) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    onInlineEditStart?.(regionKey);
  };
  const handleInlineEditorKeyDown = (event) => {
    event.stopPropagation();

    if (event.key === "Escape") {
      event.preventDefault();
      onInlineEditDone?.(regionKey);
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      onInlineEditDone?.(regionKey);
      return;
    }

    if (isCompactSingleLineEditor && event.key === "Enter") {
      event.preventDefault();
      onInlineEditDone?.(regionKey);
    }
  };

  return (
    <>
      {shouldMaskSourceContent ? <div className="editor-region-mask" aria-hidden="true" style={sourceMaskStyle} /> : null}
      <div
        ref={regionRef}
        className={`editor-region editor-region--${regionClassKey} editor-region--${regionType} ${isDynamic ? "editor-region--dynamic" : ""} ${isSelected ? "editor-region--selected" : ""} ${isInlineEditing ? "editor-region--inline-editing" : ""}`.trim()}
        style={regionStyle}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseDown={handleMouseDown}
        onWheelCapture={handleWheel}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        role="button"
        tabIndex={0}
        aria-label={label}
      >
        {shouldShowBadge ? <span className="editor-region__badge">{label}</span> : null}
        {shouldShowToolbar ? (
          <div
            className="editor-region__toolbar"
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onWheel={(event) => event.stopPropagation()}
          >
            {regionType === "image" ? (
              <>
                <button className="editor-region__tool" type="button" onClick={() => onToggleImageAdjust?.(regionKey)}>
                  {isImageAdjusting ? "Done" : "Adjust image"}
                </button>
                {isImageAdjusting ? (
                  <>
                    <button className="editor-region__tool" type="button" onClick={() => onImageZoom?.(regionKey, -160)}>
                      Zoom +
                    </button>
                    <button className="editor-region__tool" type="button" onClick={() => onImageZoom?.(regionKey, 160)}>
                      Zoom -
                    </button>
                  </>
                ) : null}
                {hasImageOverride ? (
                  <button className="editor-region__tool" type="button" onClick={() => onResetImageCrop?.(regionKey)}>
                    Reset crop
                  </button>
                ) : null}
              </>
            ) : (
              <button
                className="editor-region__tool"
                type="button"
                onClick={() => (isInlineEditing ? onInlineEditDone?.(regionKey) : onInlineEditStart?.(regionKey))}
              >
                {isInlineEditing ? "Done" : "Edit on canvas"}
              </button>
            )}
            {regionType === "image" ? (
              <>
                <button className="editor-region__tool" type="button" onClick={() => replaceImageInputRef.current?.click()}>
                  Change image
                </button>
                <input
                  ref={replaceImageInputRef}
                  className="editor-region__file-input"
                  type="file"
                  accept="image/*"
                  onChange={(event) => onImageSelected?.(event.target.files?.[0] || null)}
                />
              </>
            ) : null}
            <button
              className="editor-region__tool editor-region__tool--danger"
              type="button"
              onClick={() => (isDeleted ? onRestore?.() : onDelete?.())}
            >
              {isDeleted ? "Restore" : "Delete"}
            </button>
            <span className="editor-region__tool-hint">{isImageAdjusting ? "Drag image" : "Drag to move"}</span>
          </div>
        ) : null}
        {regionType === "image" ? (
          shouldShowImageFill
            ? <div
                aria-hidden="true"
              className="editor-region__image-fill"
              style={{
                background: resolvedImageMatteColor,
                clipPath: resolvedRegionClipPath || undefined
              }}
            >
                <img
                  className="editor-region__image-fill-media"
                  src={resolvedImageSrc}
                  alt={label}
                  style={{
                    width: `${renderImageLayout.renderedWidth}px`,
                    height: `${renderImageLayout.renderedHeight}px`,
                    transform: `translate(-50%, -50%) translate(${imageTranslateX}px, ${imageTranslateY}px)`
                  }}
                />
              </div>
            : (!isDynamic ? <span className="editor-region__hero-label">Image</span> : null)
        ) : (
          isInlineEditing ? (
            isCompactSingleLineEditor ? (
              <input
                className="editor-region__inline-editor editor-region__inline-editor--single-line"
                type="text"
                value={inlineEditValue}
                autoFocus
                spellCheck={false}
                placeholder={regionText}
                style={inlineEditorStyle}
                onChange={(event) => onInlineEditChange?.(regionKey, event.target.value)}
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                onDoubleClick={(event) => event.stopPropagation()}
                onBlur={() => onInlineEditDone?.(regionKey)}
                onKeyDown={handleInlineEditorKeyDown}
              />
            ) : (
              <textarea
                className="editor-region__inline-editor"
                value={inlineEditValue}
                autoFocus
                spellCheck={false}
                placeholder={regionText}
                style={inlineEditorStyle}
                onChange={(event) => onInlineEditChange?.(regionKey, event.target.value)}
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                onDoubleClick={(event) => event.stopPropagation()}
                onBlur={() => onInlineEditDone?.(regionKey)}
                onKeyDown={handleInlineEditorKeyDown}
              />
            )
          ) : shouldShowOverlayContent ? (
            <span
              className={`editor-region__text ${isDynamic ? "editor-region__text--dynamic" : ""}`.trim()}
              style={inlineTextStyle}
            >
              {isDeleted ? "" : regionText}
            </span>
          ) : null
        )}
        {regionType === "image" && isImageAdjusting && shouldShowImageFill ? (
          <div className="editor-region__adjust-hint">Drag image to reposition. Use Zoom + / Zoom - or the mouse wheel.</div>
        ) : null}
      </div>
    </>
  );
}

function TemplateEditorCanvas({
  template,
  selectedRegionKey,
  imageAdjustRegionKey,
  inlineEditorRegionKey,
  inlineEditorValue,
  onSelectRegion,
  onStartDrag,
  sampleTitle,
  onDeleteRegion,
  onRestoreRegion,
  onRegionImageSelected,
  onRequestEditRegion,
  onToggleImageAdjust,
  onImagePanStart,
  onImageZoom,
  onResetImageCrop,
  onInlineEditStart,
  onInlineEditChange,
  onInlineEditDone
}) {
  const [sampledRegionBackgrounds, setSampledRegionBackgrounds] = useState({});
  const editableRegions = template?.editableRegions || [];
  const pageIds = getTemplatePageIds(template);
  const resolvedPageSize = resolvePageSize(template?.pageSize);
  const stackPages = resolvedPageSize.width > resolvedPageSize.height;
  const regionOptions = template ? getTemplateEditorRegionOptions(template) : [];
  const backgroundSampleFingerprint = useMemo(
    () => JSON.stringify(
      editableRegions.map((region) => [
        region.id,
        region.page,
        region.type,
        region.x,
        region.y,
        region.width,
        region.height,
        region.originalX,
        region.originalY,
        region.originalWidth,
        region.originalHeight,
        region.background
      ])
    ),
    [editableRegions]
  );

  useEffect(() => {
    if (!template) {
      setSampledRegionBackgrounds({});
      return undefined;
    }

    let ignore = false;

    sampleTemplateEditableRegionBackgrounds(template)
      .then((backgrounds) => {
        if (!ignore) {
          setSampledRegionBackgrounds(backgrounds);
        }
      })
      .catch(() => {
        if (!ignore) {
          setSampledRegionBackgrounds({});
        }
      });

    return () => {
      ignore = true;
    };
  }, [backgroundSampleFingerprint, template?.id, pageIds.map((pageId) => template?.[pageId]?.background).join("|")]);

  if (!template) {
    return null;
  }

  return (
    <div className={`template-editor-canvas ${stackPages ? "template-editor-canvas--stacked" : ""}`.trim()}>
      {pageIds.map((pageId) => (
        <div
          className="template-editor-page"
          data-editor-page={pageId}
          key={pageId}
          style={getPageSizeStyle(template.pageSize, { backgroundImage: `url(${template[pageId].background})` })}
        >
          {regionOptions.filter((item) => item.page === pageId).map((item) => (
          <EditorRegion
            key={item.key}
            template={template}
            regionKey={item.key}
            label={item.label}
            regionType={item.type}
            isDynamic={item.dynamic}
            isSelected={selectedRegionKey === item.key}
            isImageAdjusting={imageAdjustRegionKey === item.key}
            isInlineEditing={inlineEditorRegionKey === item.key}
            inlineEditValue={inlineEditorRegionKey === item.key ? inlineEditorValue : ""}
            sampledBackground={sampledRegionBackgrounds[item.key] || null}
            sampleText={item.key === "specsPanel" ? template.page2.specsPanel.title || "Specifications" : sampleTitle}
            onSelect={onSelectRegion}
            onStartDrag={onStartDrag}
            onDelete={onDeleteRegion}
            onRestore={onRestoreRegion}
            onImageSelected={onRegionImageSelected}
            onRequestEdit={onRequestEditRegion}
            onToggleImageAdjust={onToggleImageAdjust}
            onImagePanStart={onImagePanStart}
            onImageZoom={onImageZoom}
            onResetImageCrop={onResetImageCrop}
            onInlineEditStart={onInlineEditStart}
            onInlineEditChange={onInlineEditChange}
            onInlineEditDone={onInlineEditDone}
          />
          ))}
        </div>
      ))}
    </div>
  );
}

function TemplateInspector({
  template,
  selectedRegionKey,
  onSelectRegion,
  onTemplateMetaChange,
  onRegionChange,
  onRegionImageSelected,
  onDeleteRegion,
  onRestoreRegion,
  assetState,
  onAssetChange,
  onPublish,
  publishing
}) {
  if (!template) {
    return null;
  }

  const region = getTemplateRegion(template, selectedRegionKey);
  const regionOptions = getTemplateEditorRegionOptions(template);
  const selectedMeta = regionOptions.find((item) => item.key === selectedRegionKey) || regionOptions[0] || null;
  const isDynamicRegion = Boolean(selectedMeta?.dynamic);
  const isImageRegion = selectedMeta?.type === "image";
  const isDeletedRegion = isDynamicRegion && isDynamicRegionDeleted(region);

  return (
    <div className="template-inspector">
      <div className="template-inspector__section">
        <div className="panel-header">
          <strong>Publish Template</strong>
          <span>{template.kind === "custom" ? "custom" : "built in"}</span>
        </div>
        <label className="prompt-panel__label" htmlFor="template-name">
          Template name
        </label>
        <input
          id="template-name"
          type="text"
          value={template.name}
          onChange={(event) => onTemplateMetaChange({ name: event.target.value })}
        />
        <label className="prompt-panel__label" htmlFor="template-description">
          Description
        </label>
        <textarea
          id="template-description"
          className="compact-textarea"
          value={template.description || ""}
          onChange={(event) => onTemplateMetaChange({ description: event.target.value })}
        />
      </div>

      <div className="template-inspector__section">
        <div className="panel-header">
          <strong>Layer Picker</strong>
          <span>drag on canvas</span>
        </div>
        <div className="layer-chip-grid">
          {regionOptions.map((item) => {
            const itemRegion = getTemplateRegion(template, item.key);
            return (
              <button
                key={item.key}
                className={`layer-chip ${selectedRegionKey === item.key ? "layer-chip--selected" : ""}`.trim()}
                type="button"
                onClick={() => onSelectRegion(item.key)}
              >
                {item.label}
                {itemRegion?.hidden ? " (hidden)" : ""}
                {!itemRegion?.hidden && item?.deleted ? " (deleted)" : ""}
              </button>
            );
          })}
        </div>
      </div>

      <div className="template-inspector__section">
        <div className="panel-header">
          <strong>Template Images</strong>
          <span>replace assets</span>
        </div>
        <label className="prompt-panel__label" htmlFor="page1-background">
          Page 1 background
        </label>
        <input
          id="page1-background"
          type="file"
          accept="image/*"
          onChange={(event) => onAssetChange("page1Background", event.target.files?.[0] || null)}
        />
        <label className="prompt-panel__label" htmlFor="page2-background">
          Page 2 background
        </label>
        <input
          id="page2-background"
          type="file"
          accept="image/*"
          onChange={(event) => onAssetChange("page2Background", event.target.files?.[0] || null)}
        />
        <label className="prompt-panel__label" htmlFor="hero-placeholder">
          Image area placeholder
        </label>
        <input
          id="hero-placeholder"
          type="file"
          accept="image/*"
          onChange={(event) => onAssetChange("heroPlaceholder", event.target.files?.[0] || null)}
        />
        {(assetState.page1Background || assetState.page2Background || assetState.heroPlaceholder) ? (
          <div className="helper-note">New image assets will be saved when you publish the template.</div>
        ) : null}
      </div>

      {!region && template.editableRegions?.length ? (
        <div className="template-inspector__section">
          <div className="helper-note">
            Click the actual text or image area on the template to select it. After selection, you can move it, edit the content, delete it, or replace the image.
          </div>
        </div>
      ) : null}

      {region && selectedMeta ? (
        <div className="template-inspector__section" id="template-region-panel">
          <div className="panel-header">
            <strong>{selectedMeta.label}</strong>
            <span>{selectedMeta.pageLabel || selectedMeta.page}</span>
          </div>

          {"label" in region ? (
            <>
              <label className="prompt-panel__label" htmlFor="region-label">
                {isDynamicRegion ? "Layer label" : "Heading text"}
              </label>
              <input
                id="region-label"
                type="text"
                value={region.label || ""}
                onChange={(event) => onRegionChange({ label: event.target.value })}
              />
            </>
          ) : null}

          {isDynamicRegion && !isImageRegion ? (
            <>
              <label className="prompt-panel__label" htmlFor="region-content">
                Text content
              </label>
              <textarea
                id="region-content"
                className="compact-textarea"
                value={region.content || ""}
                onChange={(event) => onRegionChange({ content: event.target.value, deleted: false })}
              />
            </>
          ) : null}

          {isDynamicRegion && isImageRegion ? (
            <>
              <label className="prompt-panel__label" htmlFor="region-image-upload">
                Replace image on canvas
              </label>
              <input
                id="region-image-upload"
                type="file"
                accept="image/*"
                onChange={(event) => onRegionImageSelected?.(event.target.files?.[0] || null)}
              />
              {hasDynamicImageOverride(region) ? (
                <button className="ghost-button" type="button" onClick={() => onRegionChange({ imageSrc: getDynamicRegionOriginalImage(region) })}>
                  Clear Overlay Image
                </button>
              ) : (
                <div className="helper-note">If no replacement image is added, the editor keeps using the original image area from the source design.</div>
              )}
            </>
          ) : null}

          {!isDynamicRegion && "title" in region ? (
            <>
              <label className="prompt-panel__label" htmlFor="region-title">
                Panel title
              </label>
              <input
                id="region-title"
                type="text"
                value={region.title || ""}
                onChange={(event) => onRegionChange({ title: event.target.value })}
              />
            </>
          ) : null}

          {"background" in region ? (
            <>
              <label className="prompt-panel__label" htmlFor="region-background">
                {isDynamicRegion ? "Background fill" : "Background color"}
              </label>
              <input
                id="region-background"
                type={isDynamicRegion ? "text" : "color"}
                value={region.background || (isDynamicRegion ? "rgba(255,255,255,0.92)" : "#ffffff")}
                onChange={(event) => onRegionChange({ background: event.target.value })}
              />
            </>
          ) : null}

          {isDynamicRegion && !isImageRegion ? (
            <>
              <label className="prompt-panel__label" htmlFor="region-text-color">
                Text color
              </label>
              <input
                id="region-text-color"
                type="text"
                value={region.textColor || "#1f2933"}
                onChange={(event) => onRegionChange({ textColor: event.target.value })}
              />
              <div className="field-grid">
                <div className="field-group">
                  <label className="prompt-panel__label" htmlFor="region-font-size">
                    Font size
                  </label>
                  <input
                    id="region-font-size"
                    type="number"
                    value={Math.round(region.fontSize || 24)}
                    onChange={(event) => onRegionChange({ fontSize: Number(event.target.value) || 0 })}
                  />
                </div>
                <div className="field-group">
                  <label className="prompt-panel__label" htmlFor="region-font-weight">
                    Font weight
                  </label>
                  <input
                    id="region-font-weight"
                    type="number"
                    value={Math.round(region.fontWeight || 700)}
                    onChange={(event) => onRegionChange({ fontWeight: Number(event.target.value) || 0 })}
                  />
                </div>
              </div>
            </>
          ) : null}

          {"borderColor" in region ? (
            <>
              <label className="prompt-panel__label" htmlFor="region-border-color">
                Accent border
              </label>
              <input
                id="region-border-color"
                type={isDynamicRegion ? "text" : "color"}
                value={region.borderColor || (isDynamicRegion ? "rgba(181,46,51,0.46)" : "#b52e33")}
                onChange={(event) => onRegionChange({ borderColor: event.target.value })}
              />
            </>
          ) : null}

          <div className="field-grid">
            <div className="field-group">
              <label className="prompt-panel__label" htmlFor="region-x">
                X
              </label>
              <input
                id="region-x"
                type="number"
                value={Math.round(region.x || 0)}
                onChange={(event) => onRegionChange({ x: Number(event.target.value) || 0 })}
              />
            </div>
            <div className="field-group">
              <label className="prompt-panel__label" htmlFor="region-y">
                Y
              </label>
              <input
                id="region-y"
                type="number"
                value={Math.round(region.y || 0)}
                onChange={(event) => onRegionChange({ y: Number(event.target.value) || 0 })}
              />
            </div>
            <div className="field-group">
              <label className="prompt-panel__label" htmlFor="region-width">
                Width
              </label>
              <input
                id="region-width"
                type="number"
                value={Math.round(region.width || 0)}
                onChange={(event) => onRegionChange({ width: Number(event.target.value) || 0 })}
              />
            </div>
            <div className="field-group">
              <label className="prompt-panel__label" htmlFor="region-height">
                Height
              </label>
              <input
                id="region-height"
                type="number"
                value={Math.round(region.height || 0)}
                onChange={(event) => onRegionChange({ height: Number(event.target.value) || 0 })}
              />
            </div>
          </div>

          {isDynamicRegion && !isImageRegion ? (
            <>
              <label className="prompt-panel__label" htmlFor="region-text-align">
                Text alignment
              </label>
              <select
                id="region-text-align"
                value={region.textAlign || "left"}
                onChange={(event) => onRegionChange({ textAlign: event.target.value })}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </>
          ) : null}

          {isDynamicRegion && isImageRegion ? (
            <>
              <label className="prompt-panel__label" htmlFor="region-object-fit">
                Image fit
              </label>
              <select
                id="region-object-fit"
                value={region.objectFit || "cover"}
                onChange={(event) => onRegionChange({ objectFit: event.target.value })}
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="fill">Fill</option>
              </select>
            </>
          ) : null}

          {"radius" in region ? (
            <>
              <label className="prompt-panel__label" htmlFor="region-radius">
                Radius
              </label>
              <input
                id="region-radius"
                type="number"
                value={Math.round(region.radius || 0)}
                onChange={(event) => onRegionChange({ radius: Number(event.target.value) || 0 })}
              />
            </>
          ) : null}

          <div className="template-inspector__actions">
            <button className="ghost-button" type="button" onClick={region.hidden || isDeletedRegion ? onRestoreRegion : onDeleteRegion}>
              {region.hidden || isDeletedRegion ? "Restore Element" : "Delete Element"}
            </button>
          </div>
        </div>
      ) : null}

      <button className="primary-button" type="button" onClick={onPublish} disabled={publishing}>
        {publishing ? "Publishing..." : "Publish Template"}
      </button>
    </div>
  );
}

function CatalogQuickEditor({
  regionMeta,
  manualState,
  onManualStateChange,
  onSave,
  saving
}) {
  if (!regionMeta) {
    return null;
  }

  const canSave = canManuallySaveCatalogRegion(regionMeta.key);

  return (
    <div className="setup-panel catalog-quick-editor">
      <div className="panel-header">
        <strong>Selected Block</strong>
        <span>{regionMeta.page}</span>
      </div>
      <div className="editor-properties-panel__intro">
        <strong>{regionMeta.label}</strong>
        <p>{regionMeta.description}</p>
      </div>

      {regionMeta.key === "titleRegion" ? (
        <div className="field-grid">
          <div className="field-group">
            <label className="prompt-panel__label" htmlFor="catalog-editor-title">
              Catalog title
            </label>
            <input
              id="catalog-editor-title"
              type="text"
              value={manualState.title}
              onChange={(event) => onManualStateChange((current) => ({ ...current, title: event.target.value }))}
            />
          </div>
          <div className="field-group">
            <label className="prompt-panel__label" htmlFor="catalog-editor-category">
              Machine category
            </label>
            <input
              id="catalog-editor-category"
              type="text"
              value={manualState.machineCategory}
              onChange={(event) => onManualStateChange((current) => ({ ...current, machineCategory: event.target.value }))}
            />
          </div>
        </div>
      ) : null}

      {["features", "standardAccessories", "optionalAccessories"].includes(regionMeta.key) ? (
        <>
          <label className="prompt-panel__label" htmlFor="catalog-editor-list">
            One line per item
          </label>
          <textarea
            id="catalog-editor-list"
            className="editor-list-textarea"
            value={manualState.listText}
            onChange={(event) => onManualStateChange((current) => ({ ...current, listText: event.target.value }))}
          />
        </>
      ) : null}

      {regionMeta.key === "heroOverlay" ? (
        <>
          <label className="prompt-panel__label" htmlFor="catalog-editor-image">
            Replace machine image
          </label>
          <input
            id="catalog-editor-image"
            type="file"
            accept="image/*"
            onChange={(event) => onManualStateChange((current) => ({ ...current, heroImage: event.target.files?.[0] || null }))}
          />
          <div className="helper-note">
            {manualState.heroImage
              ? `Ready to save: ${manualState.heroImage.name}`
              : "Choose a new machine image, then save a new draft from this selected block."}
          </div>
        </>
      ) : null}

      {regionMeta.key === "specsPanel" ? (
        <div className="editor-property-hint">
          Use the AI chat panel to update specifications, translate the catalog, or ask the system to fit the second page to the template.
        </div>
      ) : null}

      {canSave ? (
        <div className="catalog-quick-editor__actions">
          <button className="primary-button" type="button" onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : "Save Draft"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

const initialCatalogPromptState = {
  prompt: "",
  attachment: null
};

const initialCatalogSetupState = {
  title: "",
  machineCategory: "",
  language: "English"
};

const initialCatalogCreatorState = {
  title: "",
  machineCategory: "",
  language: "English",
  templateId: ""
};

const initialTemplatePromptState = {
  prompt: "",
  sourceDesign: null,
  applyBrandAssets: true
};

const initialTemplateAssetState = {
  page1Background: null,
  page2Background: null,
  heroPlaceholder: null
};

export default function App() {
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const printMode = searchParams.get("print") === "1";
  const requestedVersionId = searchParams.get("versionId");
  const requestedPageId = searchParams.get("page");

  const [snapshot, setSnapshot] = useState(null);
  const [activePage, setActivePage] = useState(pageMetaById[requestedPageId] ? requestedPageId : "dashboard");
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [catalogLibrary, setCatalogLibrary] = useState({
    activeCatalogId: "j300-lm",
    items: []
  });
  const [showCatalogLibrary, setShowCatalogLibrary] = useState(false);
  const [catalogUploadFile, setCatalogUploadFile] = useState(null);
  const [selectedRegionKey, setSelectedRegionKey] = useState("heroOverlay");
  const [selectedCatalogRegionKey, setSelectedCatalogRegionKey] = useState("titleRegion");
  const [catalogPromptState, setCatalogPromptState] = useState(initialCatalogPromptState);
  const [catalogSetupState, setCatalogSetupState] = useState(initialCatalogSetupState);
  const [catalogCreatorState, setCatalogCreatorState] = useState(initialCatalogCreatorState);
  const [catalogManualState, setCatalogManualState] = useState({
    regionKey: "titleRegion",
    title: "",
    machineCategory: "",
    listText: "",
    text: "",
    heroImage: null,
    heroPreviewUrl: ""
  });
  const [catalogInlineEditorRegionKey, setCatalogInlineEditorRegionKey] = useState(null);
  const [catalogInlineEditorValue, setCatalogInlineEditorValue] = useState("");
  const [templatePromptState, setTemplatePromptState] = useState(initialTemplatePromptState);
  const [templatePromptSourceId, setTemplatePromptSourceId] = useState(BLANK_TEMPLATE_ID);
  const [templateDraft, setTemplateDraft] = useState(null);
  const [templateAssetState, setTemplateAssetState] = useState(initialTemplateAssetState);
  const [templateStudioView, setTemplateStudioView] = useState("library");
  const [templateCreatorResultId, setTemplateCreatorResultId] = useState(null);
  const [showTemplateAdmin, setShowTemplateAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [creatingCatalog, setCreatingCatalog] = useState(false);
  const [uploadingCatalog, setUploadingCatalog] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState(false);
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [showCatalogCreateDialog, setShowCatalogCreateDialog] = useState(false);
  const [showCatalogUploadDialog, setShowCatalogUploadDialog] = useState(false);
  const [showTemplateDetailsDialog, setShowTemplateDetailsDialog] = useState(false);
  const [detectingTemplateRegions, setDetectingTemplateRegions] = useState(false);
  const [publishingTemplate, setPublishingTemplate] = useState(false);
  const [savingCatalogManualEdit, setSavingCatalogManualEdit] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("info");
  const [lastParsed, setLastParsed] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [imagePanState, setImagePanState] = useState(null);
  const [imageAdjustRegionKey, setImageAdjustRegionKey] = useState(null);
  const [inlineEditorRegionKey, setInlineEditorRegionKey] = useState(null);
  const [inlineEditorValue, setInlineEditorValue] = useState("");
  const templateDraftRef = useRef(null);
  const catalogHeroPreviewUrlRef = useRef("");

  function clearMessage() {
    setMessage("");
    setMessageTone("info");
  }

  function clearInlineTemplateEditor() {
    setInlineEditorRegionKey(null);
    setInlineEditorValue("");
  }

  function revokeCatalogHeroPreviewUrl() {
    if (!catalogHeroPreviewUrlRef.current || typeof URL === "undefined") {
      return;
    }

    URL.revokeObjectURL(catalogHeroPreviewUrlRef.current);
    catalogHeroPreviewUrlRef.current = "";
  }

  function clearCatalogInlineEditor() {
    setCatalogInlineEditorRegionKey(null);
    setCatalogInlineEditorValue("");
  }

  function getCatalogRegionInlineSeed(regionKey, catalog = editorVersion?.catalog) {
    if (!catalog) {
      return "";
    }

    if (isEditableRegionKey(regionKey)) {
      const region = getTemplateRegion(editorCatalogTemplate, regionKey);
      return String(region?.content || "");
    }

    if (regionKey === "titleRegion") {
      return catalog.title || "";
    }

    if (["features", "standardAccessories", "optionalAccessories"].includes(regionKey)) {
      return formatListForTextarea(catalog[regionKey] || []);
    }

    return "";
  }

  function startCatalogInlineEdit(regionKey) {
    if (!canInlineEditCatalogRegion(regionKey) || !editorVersion?.catalog) {
      return;
    }

    if (isEditableRegionKey(regionKey)) {
      const region = getTemplateRegion(editorCatalogTemplate, regionKey);
      const isImageRegion = String(region?.type || "").toLowerCase() === "image";

      if (!region || region.hidden || isImageRegion || isDynamicRegionDeleted(region)) {
        return;
      }
    }

    const nextValue = selectedCatalogRegionKey === regionKey
      ? (
        isEditableRegionKey(regionKey)
          ? catalogManualState.text
          : (regionKey === "titleRegion"
          ? catalogManualState.title
          : catalogManualState.listText)
      )
      : getCatalogRegionInlineSeed(regionKey, editorVersion.catalog);

    setSelectedCatalogRegionKey(regionKey);
    setCatalogInlineEditorRegionKey(regionKey);
    setCatalogInlineEditorValue(nextValue);
  }

  function updateCatalogInlineEdit(regionKey, value) {
    setCatalogInlineEditorValue(value);
    setCatalogManualState((current) => {
      if (isEditableRegionKey(regionKey)) {
        return { ...current, regionKey, text: value };
      }

      return regionKey === "titleRegion"
        ? { ...current, regionKey, title: value }
        : { ...current, regionKey, listText: value };
    });
  }

  function finishCatalogInlineEdit(regionKey) {
    if (catalogInlineEditorRegionKey && catalogInlineEditorRegionKey !== regionKey) {
      return;
    }

    clearCatalogInlineEditor();
  }

  function setCatalogHeroImageFile(file, regionKey = selectedCatalogRegionKey) {
    revokeCatalogHeroPreviewUrl();

    const previewUrl = file && typeof URL !== "undefined"
      ? URL.createObjectURL(file)
      : "";

    if (previewUrl) {
      catalogHeroPreviewUrlRef.current = previewUrl;
    }

    setCatalogManualState((current) => ({
      ...current,
      regionKey,
      heroImage: file,
      heroPreviewUrl: previewUrl
    }));
  }

  function getPreparedTemplateDraftForPublish() {
    const currentDraft = templateDraftRef.current;
    if (!currentDraft) {
      return null;
    }

    let nextDraft = deepClone(currentDraft);

    if (inlineEditorRegionKey) {
      nextDraft = updateTemplateRegion(nextDraft, inlineEditorRegionKey, {
        content: inlineEditorValue,
        deleted: false
      });
    }

    return nextDraft;
  }

  function showMessage(text, tone = "info") {
    setMessage(text);
    setMessageTone(tone);
  }

  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setMessage("");
      setMessageTone("info");
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [message]);

  useEffect(() => {
    templateDraftRef.current = templateDraft;
  }, [templateDraft]);

  useEffect(() => () => {
    revokeCatalogHeroPreviewUrl();
  }, []);

  async function fetchCatalog({ preserveSelection = true } = {}) {
    const response = await fetch("/api/catalog", { cache: "no-store" });
    const data = await response.json();
    setSnapshot(data);
    setCatalogLibrary(data.catalogLibrary || {
      activeCatalogId: "j300-lm",
      items: []
    });
    setSelectedVersionId((current) => {
      if (requestedVersionId && data.versions.some((version) => version.id === requestedVersionId)) {
        return requestedVersionId;
      }

      const hasCurrentVersion = current && data.versions.some((version) => version.id === current);
      if (preserveSelection && hasCurrentVersion) {
        return current;
      }

      return data.workingVersion?.id || data.approvedVersion?.id || data.versions[0]?.id || null;
    });
    return data;
  }

  useEffect(() => {
    fetchCatalog().catch((error) => {
      showMessage(`Failed to load catalog data: ${error.message}`, "error");
    });
  }, []);

  useEffect(() => {
    if (!snapshot) {
      return;
    }

    setSelectedTemplateId((current) => {
      if (current && snapshot.templates?.some((template) => template.id === current)) {
        return current;
      }

      return snapshot.template?.id || snapshot.templates?.[0]?.id || null;
    });

    setCatalogSetupState((current) => ({
      title: current.title || snapshot.approvedVersion?.catalog?.title || "",
      machineCategory: current.machineCategory || snapshot.approvedVersion?.catalog?.machineCategory || "",
      language: current.language || snapshot.approvedVersion?.catalog?.language || "English"
    }));
  }, [snapshot]);

  useEffect(() => {
    if (!snapshot?.templates?.length) {
      return;
    }

    setTemplatePromptSourceId((current) => {
      if (current === BLANK_TEMPLATE_ID) {
        return current;
      }

      return snapshot.templates.some((template) => template.id === current)
        ? current
        : BLANK_TEMPLATE_ID;
    });
  }, [snapshot]);

  const selectedVersion = useMemo(() => {
    if (!snapshot) {
      return null;
    }

    if (requestedVersionId) {
      return snapshot.versions.find((version) => version.id === requestedVersionId) || snapshot.workingVersion;
    }

    return snapshot.versions.find((version) => version.id === selectedVersionId) || snapshot.workingVersion;
  }, [requestedVersionId, selectedVersionId, snapshot]);

  const selectedTemplate = useMemo(() => {
    if (!snapshot) {
      return null;
    }

    return snapshot.templates?.find((template) => template.id === selectedTemplateId) || snapshot.template || null;
  }, [selectedTemplateId, snapshot]);
  const templatePromptSourceTemplate = useMemo(() => {
    if (!snapshot || templatePromptSourceId === BLANK_TEMPLATE_ID) {
      return null;
    }

    return snapshot.templates?.find((template) => template.id === templatePromptSourceId) || null;
  }, [snapshot, templatePromptSourceId]);

  useEffect(() => {
    if (!selectedTemplate) {
      return;
    }

    setTemplateDraft(createTemplateDraft(selectedTemplate));
    setTemplateAssetState(initialTemplateAssetState);
    setSelectedRegionKey((selectedTemplate.editableRegions || []).length ? null : getDefaultTemplateRegionKey(selectedTemplate));
    setImageAdjustRegionKey(null);
    setImagePanState(null);
    clearInlineTemplateEditor();
  }, [selectedTemplate]);

  useEffect(() => {
    if (!templateDraft) {
      return;
    }

    const availableRegions = getTemplateEditorRegionOptions(templateDraft);
    if (!availableRegions.length) {
      return;
    }

    if (!availableRegions.some((item) => item.key === selectedRegionKey)) {
      setSelectedRegionKey((templateDraft.editableRegions || []).length ? null : getDefaultTemplateRegionKey(templateDraft));
    }
  }, [selectedRegionKey, templateDraft]);

  useEffect(() => {
    if (!inlineEditorRegionKey || !templateDraft) {
      return;
    }

    const region = getTemplateRegion(templateDraft, inlineEditorRegionKey);
    const isImageRegion = String(region?.type || "").toLowerCase() === "image";
    if (!region || region.hidden || isImageRegion || isDynamicRegionDeleted(region)) {
      clearInlineTemplateEditor();
    }
  }, [inlineEditorRegionKey, templateDraft]);

  useEffect(() => {
    if (!inlineEditorRegionKey) {
      return;
    }

    if (selectedRegionKey !== inlineEditorRegionKey) {
      clearInlineTemplateEditor();
    }
  }, [inlineEditorRegionKey, selectedRegionKey]);

  useEffect(() => {
    if (!imageAdjustRegionKey || !templateDraft) {
      return;
    }

    const region = getTemplateRegion(templateDraft, imageAdjustRegionKey);
    const isImageRegion = String(region?.type || "").toLowerCase() === "image";
    if (!region || region.hidden || !isImageRegion || isDynamicRegionDeleted(region) || !region.imageSrc) {
      setImageAdjustRegionKey(null);
    }
  }, [imageAdjustRegionKey, templateDraft]);

  useEffect(() => {
    if (!imageAdjustRegionKey) {
      return;
    }

    if (selectedRegionKey !== imageAdjustRegionKey) {
      setImageAdjustRegionKey(null);
    }
  }, [imageAdjustRegionKey, selectedRegionKey]);

  useEffect(() => {
    if (!templateDraft || typeof window === "undefined") {
      return undefined;
    }

    const pendingRegions = (templateDraft.editableRegions || []).filter((region) => {
      const isImageRegion = String(region?.type || "").toLowerCase() === "image";
      return isImageRegion && region.imageSrc && !getRegionImageNaturalSize(region);
    });

    if (!pendingRegions.length) {
      return undefined;
    }

    let cancelled = false;

    Promise.all(
      pendingRegions.map(async (region) => {
        const image = await loadBrowserImage(region.imageSrc).catch(() => null);
        const naturalWidth = image?.naturalWidth || image?.width || 0;
        const naturalHeight = image?.naturalHeight || image?.height || 0;

        if (!naturalWidth || !naturalHeight) {
          return null;
        }

        return {
          regionKey: makeEditableRegionKey(region.id),
          imageSrc: region.imageSrc,
          naturalWidth,
          naturalHeight
        };
      })
    ).then((results) => {
      if (cancelled) {
        return;
      }

      const updates = results.filter(Boolean);
      if (!updates.length) {
        return;
      }

      setTemplateDraft((current) => {
        if (!current) {
          return current;
        }

        let next = current;
        let changed = false;

        updates.forEach((update) => {
          const region = getTemplateRegion(next, update.regionKey);
          if (!region || region.imageSrc !== update.imageSrc || getRegionImageNaturalSize(region)) {
            return;
          }

          next = updateTemplateRegion(next, update.regionKey, {
            imageNaturalWidth: update.naturalWidth,
            imageNaturalHeight: update.naturalHeight
          });
          changed = true;
        });

        return changed ? next : current;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [templateDraft]);

  useEffect(() => {
    if (!dragState) {
      return undefined;
    }

    function handleMove(event) {
      setTemplateDraft((current) => {
        if (!current) {
          return current;
        }

        const region = getTemplateRegion(current, dragState.regionKey);
        if (!region) {
          return current;
        }

        const deltaX = ((event.clientX - dragState.startClientX) / dragState.pagePixelWidth) * current.pageSize.width;
        const deltaY = ((event.clientY - dragState.startClientY) / dragState.pagePixelHeight) * current.pageSize.height;
        const maxX = current.pageSize.width - region.width;
        const maxY = current.pageSize.height - region.height;

        return updateTemplateRegion(current, dragState.regionKey, {
          x: Math.round(clamp(dragState.originX + deltaX, 0, maxX)),
          y: Math.round(clamp(dragState.originY + deltaY, 0, maxY))
        });
      });
    }

    function handleUp() {
      setDragState(null);
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragState]);

  useEffect(() => {
    if (!imagePanState) {
      return undefined;
    }

    function handleMove(event) {
      setTemplateDraft((current) => {
        if (!current) {
          return current;
        }

        const region = getTemplateRegion(current, imagePanState.regionKey);
        if (!region) {
          return current;
        }

        const imageScale = getRegionImageScale(region);
        const deltaX = ((event.clientX - imagePanState.startClientX) / imagePanState.pagePixelWidth) * current.pageSize.width;
        const deltaY = ((event.clientY - imagePanState.startClientY) / imagePanState.pagePixelHeight) * current.pageSize.height;
        const nextOffsetX = clampRegionImageOffset(
          imagePanState.originImageOffsetX + deltaX,
          "x",
          region,
          getRegionFrame(region),
          imageScale
        );
        const nextOffsetY = clampRegionImageOffset(
          imagePanState.originImageOffsetY + deltaY,
          "y",
          region,
          getRegionFrame(region),
          imageScale
        );

        return updateTemplateRegion(current, imagePanState.regionKey, {
          imageOffsetX: Math.round(nextOffsetX * 100) / 100,
          imageOffsetY: Math.round(nextOffsetY * 100) / 100
        });
      });
    }

    function handleUp() {
      setImagePanState(null);
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [imagePanState]);

  const approvedTemplate = useMemo(
    () => resolveTemplateForVersion(snapshot, snapshot?.approvedVersion),
    [snapshot]
  );
  const selectedVersionTemplate = useMemo(
    () => resolveTemplateForVersion(snapshot, selectedVersion),
    [selectedVersion, snapshot]
  );
  const activeCatalog = useMemo(
    () => catalogLibrary.items.find((item) => item.id === catalogLibrary.activeCatalogId) || catalogLibrary.items[0] || null,
    [catalogLibrary]
  );
  useEffect(() => {
    if (!snapshot?.templates?.length) {
      return;
    }

    setCatalogCreatorState((current) => {
      const templateId = current.templateId && snapshot.templates.some((template) => template.id === current.templateId)
        ? current.templateId
        : (selectedTemplateId || snapshot.template?.id || snapshot.templates[0]?.id || "");

      return {
        title: current.title || activeCatalog?.title || "",
        machineCategory: current.machineCategory || activeCatalog?.machineCategory || snapshot.approvedVersion?.catalog?.machineCategory || "",
        language: current.language || activeCatalog?.language || snapshot.approvedVersion?.catalog?.language || "English",
        templateId
      };
    });
  }, [activeCatalog, selectedTemplateId, snapshot]);
  const activePageMeta = useMemo(
    () => pageMetaById[activePage] || pageMetaById.dashboard,
    [activePage]
  );
  const isCatalogLibraryPage = activePage === "catalogs";
  const builtInTemplateCount = snapshot?.templates?.filter((template) => template.kind === "built_in").length || 0;
  const customTemplateCount = snapshot?.templates?.filter((template) => template.kind === "custom").length || 0;
  const workingPreviewVersion = useMemo(
    () => selectedVersion || snapshot?.workingVersion || snapshot?.approvedVersion || null,
    [selectedVersion, snapshot]
  );
  const workingPreviewTemplate = useMemo(
    () => resolveTemplateForVersion(snapshot, workingPreviewVersion) || selectedTemplate || approvedTemplate || null,
    [approvedTemplate, selectedTemplate, snapshot, workingPreviewVersion]
  );
  const editorVersion = useMemo(
    () => snapshot?.workingVersion || snapshot?.approvedVersion || selectedVersion || null,
    [selectedVersion, snapshot]
  );
  const editorTemplate = useMemo(
    () => resolveTemplateForVersion(snapshot, editorVersion) || selectedTemplate || approvedTemplate || null,
    [approvedTemplate, editorVersion, selectedTemplate, snapshot]
  );
  const catalogCreatorSelectedTemplate = useMemo(
    () => snapshot?.templates?.find((template) => template.id === catalogCreatorState.templateId) || null,
    [catalogCreatorState.templateId, snapshot]
  );
  const selectedTemplatePreviewVersion = useMemo(
    () => editorVersion || workingPreviewVersion || snapshot?.approvedVersion || null,
    [editorVersion, snapshot, workingPreviewVersion]
  );
  const isSelectedTemplateApplied = useMemo(
    () => Boolean(selectedTemplateId) && selectedTemplateId === editorVersion?.catalog?.templateId,
    [editorVersion, selectedTemplateId]
  );
  const editorCatalogTemplate = useMemo(
    () => editorTemplate && editorVersion?.catalog
      ? applyCatalogRegionOverridesToTemplate(editorTemplate, editorVersion.catalog)
      : editorTemplate,
    [editorTemplate, editorVersion]
  );
  const catalogRegionOptions = useMemo(
    () => getCatalogEditorRegionOptions(editorCatalogTemplate),
    [editorCatalogTemplate]
  );
  const selectedCatalogRegionMeta = useMemo(
    () => catalogRegionOptions.find((region) => region.key === selectedCatalogRegionKey) || catalogRegionOptions[0] || catalogEditorRegions[0],
    [catalogRegionOptions, selectedCatalogRegionKey]
  );
  const catalogAssistantSuggestions = useMemo(
    () => getCatalogPromptSuggestions(selectedCatalogRegionKey, selectedCatalogRegionMeta),
    [selectedCatalogRegionKey, selectedCatalogRegionMeta]
  );
  const catalogCanvasEditorState = editorVersion ? {
    selectedRegionKey: selectedCatalogRegionKey,
    inlineEditorRegionKey: catalogInlineEditorRegionKey,
    inlineEditorValue: catalogInlineEditorValue,
    manualState: catalogManualState,
    heroPreviewUrl: catalogManualState.heroPreviewUrl || "",
    saving: savingCatalogManualEdit,
    onInlineEditStart: startCatalogInlineEdit,
    onInlineEditChange: updateCatalogInlineEdit,
    onInlineEditDone: finishCatalogInlineEdit,
    onHeroImageSelected: setCatalogHeroImageFile,
    onRegionImageSelected: setCatalogHeroImageFile,
    onSaveRegionDraft: () => saveCatalogManualEdit(),
    onUseAiForRegion: useAiForCatalogRegion
  } : null;

  useEffect(() => {
    if (!catalogRegionOptions.length) {
      return;
    }

    if (!catalogRegionOptions.some((region) => region.key === selectedCatalogRegionKey)) {
      setSelectedCatalogRegionKey(catalogRegionOptions[0].key);
    }
  }, [catalogRegionOptions, selectedCatalogRegionKey]);

  const templateCreatorDraft = useMemo(() => {
    if (!templateCreatorResultId || !templateDraft?.id) {
      return null;
    }

    return templateDraft.id === templateCreatorResultId ? templateDraft : null;
  }, [templateCreatorResultId, templateDraft]);

  useEffect(() => {
    if (!editorVersion?.catalog) {
      return;
    }

    const catalog = editorVersion.catalog;
    const nextState = {
      regionKey: selectedCatalogRegionKey,
      title: catalog.title || "",
      machineCategory: catalog.machineCategory || "",
      listText: "",
      text: "",
      heroImage: null,
      heroPreviewUrl: ""
    };

    if (isEditableRegionKey(selectedCatalogRegionKey)) {
      const region = getTemplateRegion(editorCatalogTemplate, selectedCatalogRegionKey);
      const isImageRegion = String(region?.type || "").toLowerCase() === "image";
      if (!isImageRegion) {
        nextState.text = region?.content || "";
      }
    } else if (selectedCatalogRegionKey === "features") {
      nextState.listText = formatListForTextarea(catalog.features || []);
    } else if (selectedCatalogRegionKey === "standardAccessories") {
      nextState.listText = formatListForTextarea(catalog.standardAccessories || []);
    } else if (selectedCatalogRegionKey === "optionalAccessories") {
      nextState.listText = formatListForTextarea(catalog.optionalAccessories || []);
    }

    setCatalogManualState(nextState);
  }, [editorCatalogTemplate, editorVersion, selectedCatalogRegionKey]);

  useEffect(() => {
    clearCatalogInlineEditor();
    revokeCatalogHeroPreviewUrl();
  }, [editorVersion?.id]);

  function navigateToPage(pageId) {
    setActivePage(pageId);

    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (pageId === "dashboard") {
      params.delete("page");
    } else {
      params.set("page", pageId);
    }

    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState({}, "", nextUrl);
  }

  function openTemplateCreator() {
    navigateToPage("template-create");
    setTemplateCreatorResultId(null);
    setTemplatePromptState(initialTemplatePromptState);
    setTemplatePromptSourceId(BLANK_TEMPLATE_ID);
    setTemplateAssetState(initialTemplateAssetState);
    setSelectedRegionKey("heroOverlay");
    clearInlineTemplateEditor();
    setShowTemplateAdmin(false);
  }

  function openTemplateCreatorWindow() {
    if (typeof window === "undefined") {
      openTemplateCreator();
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set("page", "template-create");
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  }

  function openTemplateLibrary() {
    navigateToPage("templates");
    setSelectedRegionKey("heroOverlay");
    clearInlineTemplateEditor();
    setShowTemplateAdmin(false);
    setShowTemplateDetailsDialog(false);
  }

  function openTemplateDetailsDialog(templateId) {
    if (!templateId) {
      return;
    }

    setSelectedTemplateId(templateId);
    setSelectedRegionKey("heroOverlay");
    setShowTemplateDetailsDialog(true);
  }

  async function detectEditableRegionsForTemplate(templateId, { quiet = false } = {}) {
    if (!templateId) {
      return;
    }

    setDetectingTemplateRegions(true);
    if (!quiet) {
      showMessage("Detecting editable text and image regions from the uploaded template...", "info");
    }

    try {
      const response = await fetch(`/api/templates/${templateId}/detect-regions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || "Unable to detect template regions");
      }

      const data = await response.json();
      setSnapshot(data.snapshot);
      setSelectedTemplateId(data.template.id);
      setTemplateDraft(createTemplateDraft(data.template));
      setSelectedRegionKey(null);

      if (!quiet) {
        showMessage("Editable regions detected from the uploaded template. You can now click directly on the design to edit them.", "success");
      }
    } catch (error) {
      if (!quiet) {
        showMessage(`Unable to detect editable regions for this template: ${error.message}`, "error");
      }
    } finally {
      setDetectingTemplateRegions(false);
    }
  }

  function openSelectedTemplateEditor() {
    if (!selectedTemplate) {
      return;
    }

    openTemplateEditorWorkspace(selectedTemplate);
  }

  function openTemplateEditorWorkspace(template, { navigateToTemplates = false } = {}) {
    if (!template) {
      return;
    }

    const editableRegions = Array.isArray(template.editableRegions)
      ? template.editableRegions.filter((region) => region && typeof region === "object")
      : [];
    const hasImageRegion = editableRegions.some(
      (region) => String(region?.type || "").toLowerCase() === "image" && !region.hidden
    );
    const sourceMimeType = String(template.sourceDesign?.mimeType || "").toLowerCase();
    const needsFreshPdfDetection = Boolean(template.sourceDesign) &&
      sourceMimeType.includes("pdf") &&
      template.regionDetectionVersion !== "pdf-v1";
    const needsRegionDetection = needsFreshPdfDetection || !editableRegions.length || !hasImageRegion;

    setSelectedTemplateId(template.id);
    setShowTemplateDetailsDialog(false);
    setShowCatalogCreateDialog(false);
    setShowTemplateAdmin(true);
    if (navigateToTemplates) {
      navigateToPage("templates");
    }
    if (needsRegionDetection) {
      detectEditableRegionsForTemplate(template.id);
    }

    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        window.setTimeout(() => {
          document.getElementById("advanced-template-editor")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }, navigateToTemplates ? 140 : 0);
      });
    }
  }

  function selectCatalogCreatorTemplate(templateId) {
    if (!templateId) {
      return;
    }

    setCatalogCreatorState((current) => ({
      ...current,
      templateId
    }));
    setSelectedTemplateId(templateId);
    setSelectedRegionKey("heroOverlay");
  }

  function openCatalogTemplateEditor() {
    const template = snapshot?.templates?.find((item) => item.id === catalogCreatorState.templateId) || selectedTemplate;
    if (!template) {
      showMessage("Select a template before opening the advanced editor.", "warning");
      return;
    }

    openTemplateEditorWorkspace(template, {
      navigateToTemplates: true
    });
  }

  function selectCatalogPage(pageId) {
    const nextRegion = catalogEditorRegions.find((region) => region.pageId === pageId);
    if (nextRegion) {
      setSelectedCatalogRegionKey(nextRegion.key);
    }
  }

  function getSelectedRegionPrimaryMetric() {
    const catalog = editorVersion?.catalog;

    if (!catalog) {
      return "0";
    }

    if (isEditableRegionKey(selectedCatalogRegionKey)) {
      const region = getTemplateRegion(editorCatalogTemplate, selectedCatalogRegionKey);
      const isImageRegion = String(region?.type || "").toLowerCase() === "image";

      if (isImageRegion) {
        return region?.imageSrc ? "custom image" : "image area";
      }

      return `${String(region?.content || "").length} chars`;
    }

    if (selectedCatalogRegionKey === "titleRegion") {
      return `${String(catalog.title || "").length} chars`;
    }

    if (selectedCatalogRegionKey === "heroOverlay") {
      return catalog.heroOverlayImage ? "custom image" : "template image";
    }

    if (selectedCatalogRegionKey === "specsPanel") {
      return `${(catalog.specSections || []).reduce((count, section) => count + (section.items?.length || 0), 0)} rows`;
    }

    return `${catalog[selectedCatalogRegionKey]?.length || 0} items`;
  }

  function focusCatalogAssistantPanel() {
    if (typeof window === "undefined") {
      return;
    }

    window.requestAnimationFrame(() => {
      document.getElementById("catalog-ai-prompt")?.focus();
      document.getElementById("catalog-ai-panel")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  }

  function queueCatalogPromptSuggestion(promptText) {
    setCatalogPromptState((current) => ({
      ...current,
      prompt: promptText
    }));
    focusCatalogAssistantPanel();
  }

  function useAiForCatalogRegion(regionKey) {
    const regionMeta = catalogRegionOptions.find((region) => region.key === regionKey) || selectedCatalogRegionMeta;
    const suggestions = getCatalogPromptSuggestions(regionKey, regionMeta);
    const fallbackLabel = regionMeta?.label || "this section";
    queueCatalogPromptSuggestion(suggestions[0] || `Update ${fallbackLabel} and keep the layout print-ready.`);
  }

  async function applyCatalogPrompt(event) {
    event?.preventDefault?.();
    const effectivePrompt = catalogPromptState.prompt.trim() || (catalogPromptState.attachment ? "Apply changes from the uploaded attachment." : "");

    if (!effectivePrompt) {
      showMessage("Enter a prompt so the POC can prepare a draft.", "warning");
      return;
    }

    setLoading(true);
    clearMessage();

    try {
      const payload = new FormData();
      payload.append("prompt", effectivePrompt);
      if (selectedVersion?.id) {
        payload.append("parentVersionId", selectedVersion.id);
      }
      if (catalogPromptState.attachment) {
        payload.append("attachment", catalogPromptState.attachment);
      }

      const response = await fetch("/api/catalog/prompt", {
        method: "POST",
        body: payload
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || "Prompt request failed");
      }

      const data = await response.json();
      setSnapshot(data.snapshot);
      setSelectedVersionId(data.draftVersion.id);
      setLastParsed(data.parsed);
      setCatalogPromptState((current) => ({
        ...current,
        prompt: ""
      }));
      showMessage(
        data.warning || "Catalog draft updated. Review the live preview and approve when ready.",
        data.warning ? "warning" : "success"
      );
    } catch (error) {
      showMessage(`Unable to apply catalog prompt: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  }

  async function startCatalogWorkspace({ navigateAfterStart = false } = {}) {
    const effectiveTemplateId = catalogCreatorState.templateId || selectedTemplateId || snapshot?.template?.id || "";
    const effectiveTitle = String(catalogCreatorState.title || "").trim();

    if (!effectiveTemplateId) {
      showMessage("Select a template before creating a catalog.", "warning");
      return false;
    }

    if (!effectiveTitle) {
      showMessage("Enter a catalog name before creating it.", "warning");
      return false;
    }

    setCreatingCatalog(true);
    clearMessage();

    try {
      const response = await fetch("/api/catalog-library/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          templateId: effectiveTemplateId,
          title: effectiveTitle,
          machineCategory: catalogCreatorState.machineCategory,
          language: catalogCreatorState.language
        })
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || "Unable to start catalog");
      }

      const data = await response.json();
      setSnapshot(data.snapshot);
      setCatalogLibrary(data.catalogLibrary || catalogLibrary);
      setSelectedVersionId(data.snapshot.workingVersion?.id || data.snapshot.approvedVersion?.id || null);
      setSelectedTemplateId(effectiveTemplateId);
      setShowCatalogCreateDialog(false);
      showMessage(`Catalog created from ${data.snapshot.template.name}.`, "success");
      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => {
          document.getElementById("catalog-workspace-editor")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        });
      }
      if (navigateAfterStart) {
        navigateToPage("catalogs");
      }
      return true;
    } catch (error) {
      showMessage(`Unable to create catalog: ${error.message}`, "error");
      return false;
    } finally {
      setCreatingCatalog(false);
    }
  }

  async function applySelectedTemplateToCatalog({ navigateAfterApply = false } = {}) {
    if (!editorVersion?.id) {
      showMessage("Start or open a catalog before applying a new template.", "warning");
      return false;
    }

    if (!selectedTemplateId) {
      showMessage("Select a template card first.", "warning");
      return false;
    }

    if (selectedTemplateId === editorVersion.catalog?.templateId) {
      showMessage("This template is already applied to the current catalog.", "info");
      if (navigateAfterApply) {
        navigateToPage("dashboard");
      }
      return true;
    }

    setApplyingTemplate(true);
    clearMessage();

    try {
      const response = await fetch(`/api/catalog/version/${editorVersion.id}/apply-template`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          templateId: selectedTemplateId
        })
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || "Unable to apply template");
      }

      const data = await response.json();
      setSnapshot(data.snapshot);
      setSelectedVersionId(data.draftVersion.id);
      showMessage(`Template applied: ${selectedTemplate?.name || "Selected template"}.`, "success");
      if (navigateAfterApply) {
        navigateToPage("dashboard");
      }
      return true;
    } catch (error) {
      showMessage(`Unable to apply template: ${error.message}`, "error");
      return false;
    } finally {
      setApplyingTemplate(false);
    }
  }

  async function deleteSelectedTemplate() {
    if (!selectedTemplate?.id || selectedTemplate.kind !== "custom") {
      showMessage("Only custom templates can be deleted.", "warning");
      return false;
    }

    if (typeof window !== "undefined") {
      const confirmed = window.confirm(`Delete custom template "${selectedTemplate.name}"? This cannot be undone.`);
      if (!confirmed) {
        return false;
      }
    }

    setDeletingTemplate(true);
    clearMessage();

    try {
      const deletingTemplateId = selectedTemplate.id;
      const response = await fetch(`/api/templates/${deletingTemplateId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || "Unable to delete template");
      }

      const data = await response.json();
      setSnapshot(data.snapshot);
      setSelectedTemplateId(data.snapshot.template?.id || data.snapshot.templates?.[0]?.id || null);
      setTemplateDraft((current) => (current?.id === deletingTemplateId ? null : current));
      setTemplateCreatorResultId((current) => (current === deletingTemplateId ? null : current));
      setShowTemplateAdmin(false);
      showMessage(`Template deleted: ${selectedTemplate.name}.`, "success");
      return true;
    } catch (error) {
      showMessage(`Unable to delete template: ${error.message}`, "error");
      return false;
    } finally {
      setDeletingTemplate(false);
    }
  }

  async function approve(versionId) {
    setLoading(true);
    clearMessage();

    try {
      const response = await fetch(`/api/catalog/version/${versionId}/approve`, {
        method: "POST"
      });
      if (!response.ok) {
        throw new Error("Approval failed");
      }
      const data = await response.json();
      setSnapshot(data.snapshot);
      setSelectedVersionId(data.approvedVersion.id);
      showMessage("Version approved and promoted as the current catalog.", "success");
    } catch (error) {
      showMessage(`Unable to approve version: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  }

  async function resetWorkspace() {
    setResetting(true);
    clearMessage();

    try {
      const response = await fetch("/api/catalog/reset", {
        method: "POST"
      });
      if (!response.ok) {
        throw new Error("Reset failed");
      }

      await response.json();
      await fetchCatalog({ preserveSelection: false });
      setLastParsed(null);
      setCatalogPromptState(initialCatalogPromptState);
      setTemplatePromptState(initialTemplatePromptState);
      setCatalogUploadFile(null);
      showMessage("Original template restored with the default sample catalog.", "success");
    } catch (error) {
      showMessage(`Unable to reset workspace: ${error.message}`, "error");
    } finally {
      setResetting(false);
    }
  }

  async function selectCatalogLibraryItem(catalogId) {
    if (!catalogId) {
      return;
    }

    setCreatingCatalog(true);
    clearMessage();

    try {
      const response = await fetch("/api/catalog-library/select", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          catalogId
        })
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || "Unable to select catalog");
      }

      const data = await response.json();
      setSnapshot(data.snapshot);
      setCatalogLibrary(data.catalogLibrary || catalogLibrary);
      setSelectedVersionId(data.snapshot.workingVersion?.id || data.snapshot.approvedVersion?.id || null);
      setShowCatalogLibrary(false);
      showMessage(`Catalog selected: ${data.selectedCatalog?.title || "Catalog"}.`, "success");
      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => {
          document.getElementById("catalog-workspace-editor")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        });
      }
    } catch (error) {
      showMessage(`Unable to select catalog: ${error.message}`, "error");
    } finally {
      setCreatingCatalog(false);
    }
  }

  async function uploadCatalogPdf() {
    if (!catalogUploadFile) {
      showMessage("Choose a PDF catalog file before uploading.", "warning");
      return;
    }

    setUploadingCatalog(true);
    clearMessage();

    try {
      const payload = new FormData();
      payload.append("pdf", catalogUploadFile);

      const response = await fetch("/api/catalog-library/upload", {
        method: "POST",
        body: payload
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || "Unable to upload catalog");
      }

      const data = await response.json();
      setSnapshot(data.snapshot);
      setCatalogLibrary(data.catalogLibrary || catalogLibrary);
      setCatalogUploadFile(null);
      setShowCatalogUploadDialog(false);
      showMessage(`Catalog uploaded: ${data.uploaded?.title || "New catalog"}.`, "success");
    } catch (error) {
      showMessage(`Unable to upload catalog: ${error.message}`, "error");
    } finally {
      setUploadingCatalog(false);
    }
  }

  async function exportPdf(versionId) {
    clearMessage();

    try {
      const response = await fetch(`/api/catalog/version/${versionId}/export`);
      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || "Export failed");
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      showMessage(`Unable to export PDF: ${error.message}`, "error");
    }
  }

  async function saveCatalogManualEdit() {
    if (!editorVersion?.id) {
      showMessage("Start a catalog workspace before editing on the canvas.", "warning");
      return;
    }

    finishCatalogInlineEdit(selectedCatalogRegionKey);
    const selectedDynamicRegion = isEditableRegionKey(selectedCatalogRegionKey)
      ? getTemplateRegion(editorCatalogTemplate, selectedCatalogRegionKey)
      : null;
    const selectedDynamicRegionType = String(selectedDynamicRegion?.type || "").toLowerCase() === "image" ? "image" : "text";

    const updates = {
      sectionKey: selectedCatalogRegionKey,
      summary: `Edited ${selectedCatalogRegionMeta.label} in visual editor`,
      autoFit: true
    };

    if (selectedDynamicRegion) {
      updates.editableRegionKey = getEditableRegionId(selectedCatalogRegionKey);
      updates.editableRegionType = selectedDynamicRegionType;

      if (selectedDynamicRegionType === "text") {
        updates.editableRegionText = catalogManualState.text;
      }
    } else if (selectedCatalogRegionKey === "titleRegion") {
      updates.title = catalogManualState.title;
      updates.machineCategory = catalogManualState.machineCategory;
    } else if (selectedCatalogRegionKey === "features") {
      updates.featuresText = catalogManualState.listText;
    } else if (selectedCatalogRegionKey === "standardAccessories") {
      updates.standardAccessoriesText = catalogManualState.listText;
    } else if (selectedCatalogRegionKey === "optionalAccessories") {
      updates.optionalAccessoriesText = catalogManualState.listText;
    }

    if ((selectedCatalogRegionKey === "heroOverlay" || selectedDynamicRegionType === "image") && !catalogManualState.heroImage) {
      showMessage("Choose an image file before saving the machine visual.", "warning");
      return;
    }

    setSavingCatalogManualEdit(true);
    clearMessage();

    try {
      const payload = new FormData();
      payload.append("updates", JSON.stringify(updates));
      if ((selectedCatalogRegionKey === "heroOverlay" || selectedDynamicRegionType === "image") && catalogManualState.heroImage) {
        payload.append("heroImage", catalogManualState.heroImage);
      }

      const submitManualUpdate = async (versionId) => {
        const response = await fetch(`/api/catalog/version/${versionId}/manual-update`, {
          method: "POST",
          body: payload
        });

        if (response.ok) {
          return response.json();
        }

        const errorPayload = await response.json().catch(() => ({}));
        const errorMessage = errorPayload.error || "Unable to save block edits";

        if (response.status === 404 && /version not found/i.test(errorMessage)) {
          return {
            missingVersion: true,
            errorMessage
          };
        }

        throw new Error(errorMessage);
      };

      let data = await submitManualUpdate(editorVersion.id);

      if (data?.missingVersion) {
        const refreshed = await fetchCatalog({ preserveSelection: false });
        const fallbackVersionId = refreshed?.workingVersion?.id || refreshed?.approvedVersion?.id || null;

        if (!fallbackVersionId) {
          throw new Error(data.errorMessage);
        }

        data = await submitManualUpdate(fallbackVersionId);

        if (data?.missingVersion) {
          throw new Error(data.errorMessage);
        }
      }

      setSnapshot(data.snapshot);
      setSelectedVersionId(data.draftVersion.id);
      revokeCatalogHeroPreviewUrl();
      setCatalogManualState((current) => ({
        ...current,
        heroImage: null,
        heroPreviewUrl: ""
      }));
      showMessage(`${selectedCatalogRegionMeta.label} updated in a new draft version.`, "success");
    } catch (error) {
      showMessage(`Unable to save block edits: ${error.message}`, "error");
    } finally {
      setSavingCatalogManualEdit(false);
    }
  }

  async function runTemplatePrompt(mode) {
    const effectivePrompt = templatePromptState.prompt.trim();
    if (!effectivePrompt) {
      showMessage("Describe the template you want to create or modify.", "warning");
      return;
    }

    setCreatingTemplate(true);
    clearMessage();

    try {
      const payload = new FormData();
      payload.append("prompt", effectivePrompt);
      payload.append("mode", mode);
      if (mode === "create" && templatePromptSourceId && templatePromptSourceId !== BLANK_TEMPLATE_ID) {
        payload.append("sourceTemplateId", templatePromptSourceId);
      }
      if (mode === "create" && templatePromptSourceId === BLANK_TEMPLATE_ID) {
        payload.append("sourceTemplateId", BLANK_TEMPLATE_ID);
      }
      if (mode === "update" && selectedTemplateId) {
        payload.append("sourceTemplateId", selectedTemplateId);
      }
      if (mode === "update" && selectedTemplateId) {
        payload.append("templateId", selectedTemplateId);
      }
      if (templatePromptState.sourceDesign) {
        payload.append("sourceDesign", templatePromptState.sourceDesign);
      }
      payload.append("applyBrandAssets", String(templatePromptState.applyBrandAssets));

      const response = await fetch("/api/templates/prompt", {
        method: "POST",
        body: payload
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || "Template prompt failed");
      }

      const data = await response.json();
      setSnapshot(data.snapshot);
      setSelectedTemplateId(data.template.id);
      setTemplateDraft(createTemplateDraft(data.template));
      setTemplatePromptState(initialTemplatePromptState);
      if (mode === "create") {
        setTemplateStudioView("create");
        setTemplateCreatorResultId(data.template.id);
      } else {
        setTemplateStudioView("library");
        setTemplateCreatorResultId(null);
      }
      showMessage(
        mode === "update"
          ? `Template updated from prompt: ${data.template.name}.`
          : `New template created from prompt: ${data.template.name}.`,
        "success"
      );
    } catch (error) {
      showMessage(`Unable to process template prompt: ${error.message}`, "error");
    } finally {
      setCreatingTemplate(false);
    }
  }

  async function publishTemplate() {
    const draftForPublish = getPreparedTemplateDraftForPublish();

    if (!draftForPublish?.id) {
      showMessage("Select a template before publishing.", "warning");
      return;
    }

    if (inlineEditorRegionKey) {
      setTemplateDraft(draftForPublish);
      clearInlineTemplateEditor();
    }

    setPublishingTemplate(true);
    clearMessage();

    try {
      const payload = new FormData();
      payload.append("updates", JSON.stringify({
        name: draftForPublish.name,
        description: draftForPublish.description,
        brandFrame: draftForPublish.brandFrame || "shared",
        editableRegions: draftForPublish.editableRegions || [],
        page1: draftForPublish.page1,
        page2: draftForPublish.page2
      }));

      if (templateAssetState.page1Background) {
        payload.append("page1Background", templateAssetState.page1Background);
      }
      if (templateAssetState.page2Background) {
        payload.append("page2Background", templateAssetState.page2Background);
      }
      if (templateAssetState.heroPlaceholder) {
        payload.append("heroPlaceholder", templateAssetState.heroPlaceholder);
      }

      const response = await fetch(`/api/templates/${draftForPublish.id}/publish`, {
        method: "POST",
        body: payload
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || "Template publish failed");
      }

      const data = await response.json();
      setSnapshot(data.snapshot);
      setSelectedTemplateId(data.template.id);
      setTemplateDraft(createTemplateDraft(data.template));
      setTemplateAssetState(initialTemplateAssetState);
      showMessage(`Template published: ${data.template.name}.`, "success");
    } catch (error) {
      showMessage(`Unable to publish template: ${error.message}`, "error");
    } finally {
      setPublishingTemplate(false);
    }
  }

  function toggleTemplateImageAdjust(regionKey = selectedRegionKey) {
    if (!templateDraft || !regionKey || !isEditableRegionKey(regionKey)) {
      return;
    }

    const region = getTemplateRegion(templateDraft, regionKey);
    const isImageRegion = String(region?.type || "").toLowerCase() === "image";
    if (!region || region.hidden || !isImageRegion || isDynamicRegionDeleted(region) || !region.imageSrc) {
      showMessage("Replace the image first, then use Adjust image to pan and zoom it inside the frame.", "info");
      return;
    }

    setSelectedRegionKey(regionKey);
    setImageAdjustRegionKey((current) => (current === regionKey ? null : regionKey));
  }

  function startTemplateImagePan(regionKey, event) {
    if (!templateDraft || !regionKey || !isEditableRegionKey(regionKey)) {
      return;
    }

    const region = getTemplateRegion(templateDraft, regionKey);
    const isImageRegion = String(region?.type || "").toLowerCase() === "image";
    const pageElement = event.currentTarget.closest("[data-editor-page]");
    if (!region || !isImageRegion || !region.imageSrc || !pageElement) {
      return;
    }

    event.preventDefault();
    setSelectedRegionKey(regionKey);
    setImageAdjustRegionKey(regionKey);
    setImagePanState({
      regionKey,
      startClientX: event.clientX,
      startClientY: event.clientY,
      pagePixelWidth: pageElement.getBoundingClientRect().width,
      pagePixelHeight: pageElement.getBoundingClientRect().height,
      originImageOffsetX: getRegionImageOffset(region).x,
      originImageOffsetY: getRegionImageOffset(region).y
    });
  }

  function zoomTemplateImage(regionKey, deltaY) {
    if (!regionKey || !isEditableRegionKey(regionKey)) {
      return;
    }

    setTemplateDraft((current) => {
      if (!current) {
        return current;
      }

      const region = getTemplateRegion(current, regionKey);
      const isImageRegion = String(region?.type || "").toLowerCase() === "image";
      if (!region || !isImageRegion || !region.imageSrc) {
        return current;
      }

      const currentScale = getRegionImageScale(region);
      const nextScale = clamp(currentScale + (deltaY < 0 ? 0.14 : -0.14), 1, 4);
      const currentOffset = getRegionImageOffset(region);
      const nextOffsetX = clampRegionImageOffset(currentOffset.x, "x", region, getRegionFrame(region), nextScale);
      const nextOffsetY = clampRegionImageOffset(currentOffset.y, "y", region, getRegionFrame(region), nextScale);

      return updateTemplateRegion(current, regionKey, {
        imageScale: Math.round(nextScale * 100) / 100,
        imageOffsetX: Math.round(nextOffsetX * 100) / 100,
        imageOffsetY: Math.round(nextOffsetY * 100) / 100,
        deleted: false
      });
    });
  }

  function resetTemplateImageCrop(regionKey = selectedRegionKey) {
    if (!regionKey || !isEditableRegionKey(regionKey)) {
      return;
    }

    setTemplateDraft((current) => {
      if (!current) {
        return current;
      }

      const region = getTemplateRegion(current, regionKey);
      const isImageRegion = String(region?.type || "").toLowerCase() === "image";
      if (!region || !isImageRegion) {
        return current;
      }

      return updateTemplateRegion(current, regionKey, {
        imageScale: 1,
        imageOffsetX: 0,
        imageOffsetY: 0,
        deleted: false
      });
    });
  }

  async function replaceSelectedTemplateRegionImage(file) {
    if (!file || !selectedRegionKey || !isEditableRegionKey(selectedRegionKey)) {
      return;
    }

    try {
      const imageAsset = await readImageFileAsset(file);
      if (!imageAsset?.src) {
        throw new Error("Unsupported image");
      }

      setTemplateDraft((current) => updateTemplateRegion(current, selectedRegionKey, {
        imageSrc: imageAsset.src,
        imageNaturalWidth: imageAsset.naturalWidth || null,
        imageNaturalHeight: imageAsset.naturalHeight || null,
        imageScale: 1,
        imageOffsetX: 0,
        imageOffsetY: 0,
        deleted: false
      }));
      setImageAdjustRegionKey(selectedRegionKey);
      showMessage("Template image area updated. Use Adjust image to drag it inside the frame and the mouse wheel to zoom.", "success");
    } catch (error) {
      showMessage(`Unable to load image into the template editor: ${error.message}`, "error");
    }
  }

  function startInlineRegionEdit(regionKey = selectedRegionKey) {
    if (!templateDraft || !regionKey || !isEditableRegionKey(regionKey)) {
      return;
    }

    const region = getTemplateRegion(templateDraft, regionKey);
    const isImageRegion = String(region?.type || "").toLowerCase() === "image";
    if (!region || region.hidden || isImageRegion || isDynamicRegionDeleted(region)) {
      focusSelectedTemplateRegionInspector();
      return;
    }

    setSelectedRegionKey(regionKey);
    setInlineEditorRegionKey(regionKey);
    setInlineEditorValue(region.content || "");
  }

  function updateInlineRegionText(regionKey, value) {
    if (!regionKey) {
      return;
    }

    setInlineEditorRegionKey(regionKey);
    setInlineEditorValue(value);
    setTemplateDraft((current) => {
      if (!current) {
        return current;
      }

      const region = getTemplateRegion(current, regionKey);
      if (!region) {
        return current;
      }

      return updateTemplateRegion(current, regionKey, {
        content: value,
        deleted: false
      });
    });
  }

  function finishInlineRegionEdit(regionKey = inlineEditorRegionKey) {
    if (!regionKey) {
      return;
    }

    if (inlineEditorRegionKey && regionKey !== inlineEditorRegionKey) {
      return;
    }

    clearInlineTemplateEditor();

    const clearSelection = () => {
      setSelectedRegionKey((current) => (current === regionKey ? null : current));
    };

    if (typeof window === "undefined") {
      clearSelection();
      return;
    }

    window.requestAnimationFrame(clearSelection);
  }

  function requestTemplateRegionEdit(regionKey) {
    if (!regionKey) {
      return;
    }

    setSelectedRegionKey(regionKey);
    const region = getTemplateRegion(templateDraft, regionKey);
    const isTextRegion = isEditableRegionKey(regionKey) && String(region?.type || "").toLowerCase() !== "image";

    if (isTextRegion && !isDynamicRegionDeleted(region)) {
      startInlineRegionEdit(regionKey);
      return;
    }

    focusSelectedTemplateRegionInspector(regionKey);
  }

  function focusSelectedTemplateRegionInspector(regionKey = selectedRegionKey) {
    if (typeof document === "undefined") {
      return;
    }

    const regionPanel = document.getElementById("template-region-panel");
    regionPanel?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    window.setTimeout(() => {
      const fieldId = regionKey && isEditableRegionKey(regionKey)
        ? (getTemplateRegion(templateDraft, regionKey)?.type === "image" ? "region-image-upload" : "region-content")
        : "region-label";
      document.getElementById(fieldId)?.focus();
    }, 140);
  }

  function deleteSelectedTemplateRegion() {
    if (selectedRegionKey && selectedRegionKey === inlineEditorRegionKey) {
      clearInlineTemplateEditor();
    }

    if (selectedRegionKey && selectedRegionKey === imageAdjustRegionKey) {
      setImageAdjustRegionKey(null);
      setImagePanState(null);
    }

    setTemplateDraft((current) => {
      if (!current || !selectedRegionKey) {
        return current;
      }

      if (isEditableRegionKey(selectedRegionKey)) {
        return updateTemplateRegion(current, selectedRegionKey, { deleted: true });
      }

      return updateTemplateRegion(current, selectedRegionKey, { hidden: true });
    });
  }

  function restoreSelectedTemplateRegion() {
    setTemplateDraft((current) => {
      if (!current || !selectedRegionKey) {
        return current;
      }

      if (isEditableRegionKey(selectedRegionKey)) {
        const region = getTemplateRegion(current, selectedRegionKey);
        return updateTemplateRegion(current, selectedRegionKey, {
          deleted: false,
          content: getDynamicRegionOriginalContent(region),
          imageSrc: getDynamicRegionOriginalImage(region)
        });
      }

      return updateTemplateRegion(current, selectedRegionKey, { hidden: false });
    });
  }

  function startRegionDrag(regionKey, event) {
    if (!templateDraft) {
      return;
    }

    const region = getTemplateRegion(templateDraft, regionKey);
    const pageElement = event.currentTarget.closest("[data-editor-page]");
    if (!region || !pageElement) {
      return;
    }

    const pageRect = pageElement.getBoundingClientRect();
    setSelectedRegionKey(regionKey);
    setDragState({
      regionKey,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: region.x,
      originY: region.y,
      pagePixelWidth: pageRect.width,
      pagePixelHeight: pageRect.height
    });
  }

  if (printMode) {
    return (
      <main className="print-shell">
        {snapshot && selectedVersion && selectedVersionTemplate ? (
          <CatalogPages version={selectedVersion} template={selectedVersionTemplate} printMode />
        ) : (
          <div className="loading-state">Preparing catalog for print...</div>
        )}
      </main>
    );
  }

  return (
    <div className={`app-shell ${isCatalogLibraryPage ? "app-shell--catalogs" : ""}`.trim()}>
      {!isCatalogLibraryPage ? (
      <aside className="app-sidebar">
        <div className="brand-block brand-block--navigation">
          <div className="brand-block__topline">
            <div>
              <img className="brand-logo" src="/ace-micromatic-logo.png" alt="Ace Micromatic Group" />
              <h1>Catalog AI POC</h1>
            </div>
          </div>
          <nav className="page-nav page-nav--compact" aria-label="Primary sections">
            {sidebarMenuPages.map((page) => (
              <button
                key={page.id}
                className={`page-nav__button ${
                  activePage === page.id || (page.id === "templates" && activePage === "template-create")
                    ? "page-nav__button--active"
                    : ""
                }`.trim()}
                type="button"
                onClick={() => navigateToPage(page.id)}
              >
                <span className="page-nav__title">{page.label}</span>
              </button>
            ))}
          </nav>
          {activePage !== "dashboard" ? (
            <button className="ghost-button brand-block__secondary-action" type="button" onClick={() => navigateToPage("dashboard")}>
              Back To Dashboard
            </button>
          ) : null}
        </div>

        <div className="setup-panel workspace-card workspace-card--catalog">
          <div className="card-eyebrow">Catalog</div>
          <div className="workspace-card__row workspace-card__row--headline">
            <strong>{activeCatalog?.title || snapshot?.approvedVersion?.catalog?.title || "J 300 LM"}</strong>
            <button
              className="icon-button"
              type="button"
              onClick={resetWorkspace}
              disabled={resetting || loading || creatingCatalog || creatingTemplate || publishingTemplate}
              aria-label="Reset to original catalog"
              title={resetting ? "Resetting..." : "Reset to original catalog"}
            >
              <span aria-hidden="true">{resetting ? "..." : "\u21ba"}</span>
            </button>
          </div>
          <label className="prompt-panel__label" htmlFor="catalog-selector">
            Select catalog
          </label>
          <select
            id="catalog-selector"
            value={catalogLibrary.activeCatalogId || ""}
            onChange={(event) => selectCatalogLibraryItem(event.target.value)}
            disabled={creatingCatalog}
          >
            {(catalogLibrary.items || []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
          <div className="workspace-card__row">
            <span>Source</span>
            <strong>{activeCatalog?.sourceType === "pdf" ? "Uploaded PDF" : "System catalog"}</strong>
          </div>
          <div className="workspace-card__row">
            <span>Template in use</span>
            <strong>{editorTemplate?.name || snapshot?.template?.name || "J 300 LM 2-Page Catalog"}</strong>
          </div>
          <div className="workspace-card__row">
            <span>Language</span>
            <strong>{editorVersion?.catalog?.language || activeCatalog?.language || "English"}</strong>
          </div>
          {activeCatalog?.sourcePdfUrl ? (
            <a className="catalog-tile__link" href={activeCatalog.sourcePdfUrl} target="_blank" rel="noreferrer">
              Open source PDF
            </a>
          ) : null}
          <div className="workspace-card__actions">
            <button className="ghost-button" type="button" onClick={() => navigateToPage("catalogs")}>
              Browse Catalogs
            </button>
          </div>
        </div>

        {activePage === "dashboard" ? (
          <>
            <form className="prompt-panel" onSubmit={applyCatalogPrompt}>
              <div className="panel-header">
                <strong>Change request</strong>
              </div>
              <textarea
                id="prompt"
                value={catalogPromptState.prompt}
                onChange={(event) => setCatalogPromptState((current) => ({ ...current, prompt: event.target.value }))}
                placeholder="Under Optional Accessories add hydraulic power operated chuck (O200 mm) and keep the layout print-ready."
              />

              <div className="prompt-suggestions prompt-suggestions--stacked">
                {samplePrompts.map((samplePrompt) => (
                  <button
                    key={samplePrompt}
                    className="prompt-chip prompt-chip--full"
                    type="button"
                    onClick={() => setCatalogPromptState((current) => ({ ...current, prompt: samplePrompt }))}
                  >
                    {samplePrompt}
                  </button>
                ))}
              </div>

              <label className="prompt-panel__label" htmlFor="attachment">
                Optional attachment
              </label>
              <input
                id="attachment"
                type="file"
                accept=".txt,.md,.json,.csv,.xlsx,.xls,image/*"
                onChange={(event) =>
                  setCatalogPromptState((current) => ({
                    ...current,
                    attachment: event.target.files?.[0] || null
                  }))
                }
              />

              <div className="attachment-note">
                {catalogPromptState.attachment ? `Attached: ${catalogPromptState.attachment.name}` : "No file chosen."}
              </div>

              <button
                className="primary-button"
                type="submit"
                disabled={loading || resetting || creatingCatalog || creatingTemplate || publishingTemplate}
              >
                {loading ? "Working..." : "Generate Draft"}
              </button>
            </form>

            {lastParsed?.operations?.length ? (
              <div className="parsed-panel">
                <div className="parsed-panel__header">
                  <strong>Detected Changes</strong>
                  <span>{lastParsed.operations.length} ops</span>
                </div>
                <ul>
                  {lastParsed.operations.map((operation, index) => (
                    <li key={`${operation.type}-${index}`}>
                      <code>{operation.type}</code>
                      {operation.label ? ` | ${operation.label}` : ""}
                      {operation.value ? ` -> ${operation.value}` : ""}
                      {operation.language ? ` -> ${operation.language}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="version-list">
              <div className="version-list__header">
                <strong>Versions</strong>
                <span>{snapshot?.versions?.length || 0}</span>
              </div>
              {snapshot?.versions?.map((version) => (
                <VersionCard
                  key={version.id}
                  version={version}
                  isSelected={selectedVersion?.id === version.id}
                  onSelect={setSelectedVersionId}
                  onApprove={approve}
                  onExport={exportPdf}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="page-hint">
              <strong>{activePageMeta.label}</strong>
              <p>{activePageMeta.description}</p>
              <div className="helper-note">
                Active draft: <strong>{snapshot?.workingVersion?.versionLabel || snapshot?.approvedVersion?.versionLabel || "Not available yet"}</strong>
              </div>
            </div>
            {selectedTemplate ? (
              <div className="setup-panel selected-template-card compact-template-card">
                <div className="panel-header">
                  <strong>Selected Template</strong>
                  <StatusPill tone={selectedTemplate.kind === "custom" ? "success" : "neutral"}>
                    {selectedTemplate.kind === "custom" ? "custom" : "built in"}
                  </StatusPill>
                </div>
                <div className="selected-template-card__summary">
                  <strong>{selectedTemplate.name}</strong>
                  <p>{selectedTemplate.description}</p>
                </div>
                <TemplateThumbnail template={selectedTemplate} />
              </div>
            ) : null}
          </>
        )}
      </aside>
      ) : null}

      <main className="app-main">
        {message ? <div className={`message-banner message-banner--${messageTone}`}>{message}</div> : null}

        {!snapshot ? <div className="loading-state">Loading catalog workspace...</div> : null}

        {snapshot && activePage === "dashboard" ? (
          <section className="main-page">
            <section className="preview-section preview-section--legacy">
              <div className="preview-grid preview-grid--dashboard">
                <CatalogPreview label="Current approved" version={snapshot.approvedVersion} template={approvedTemplate} />
                <CatalogPreview label="Selected working version" version={workingPreviewVersion} template={workingPreviewTemplate} />
              </div>
            </section>
          </section>
        ) : null}

        {snapshot && activePage === "templates" ? (
          <section className="main-page">
            <section className="studio-shell">
              <div className="studio-header">
                <div>
                  <h2>Template Library</h2>
                  <p>Select a template card to preview, apply, or open the advanced editor. Create flow opens in a separate window.</p>
                </div>
                <div className="studio-header__actions">
                  <button className="primary-button" type="button" onClick={openTemplateCreatorWindow}>
                    + Create New Template
                  </button>
                  {selectedTemplate ? (
                    <div className="studio-header__meta">
                      <StatusPill tone={selectedTemplate.kind === "custom" ? "success" : "neutral"}>
                        {selectedTemplate.kind === "custom" ? "custom" : "built in"}
                      </StatusPill>
                      <strong>{selectedTemplate.name}</strong>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="helper-note">
                Click any template card to open a compact preview dialog. Advanced layout editing stays optional and only appears when you need to refine the template itself.
              </div>

              <div className="template-gallery">
                {snapshot.templates?.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isSelected={selectedTemplateId === template.id}
                    isActive={editorVersion?.catalog?.templateId === template.id}
                    onSelect={openTemplateDetailsDialog}
                  />
                ))}
              </div>

              <WorkspaceModal
                open={showTemplateDetailsDialog && Boolean(selectedTemplate)}
                title={selectedTemplate?.name || "Template Preview"}
                subtitle="Preview the template on the active catalog, apply it, or open the advanced editor."
                onClose={() => setShowTemplateDetailsDialog(false)}
                size="xl"
              >
                {selectedTemplate ? (
                  <div className="workspace-modal__grid workspace-modal__grid--template">
                    <div className="selected-template-focus setup-panel">
                      <div className="panel-header">
                        <strong>Selected Template</strong>
                        <StatusPill tone={selectedTemplate.kind === "custom" ? "success" : "neutral"}>
                          {selectedTemplate.kind === "custom" ? "custom" : "built in"}
                        </StatusPill>
                      </div>
                      <div className="selected-template-card__summary">
                        <strong>{selectedTemplate.name}</strong>
                        <p>{selectedTemplate.description}</p>
                      </div>
                      {selectedTemplate.sourceDesign ? (
                        <div className="helper-note">
                          Source file attached:{" "}
                          <a href={selectedTemplate.sourceDesign.assetUrl} target="_blank" rel="noreferrer">
                            {selectedTemplate.sourceDesign.name}
                          </a>
                        </div>
                      ) : null}
                      <div className="helper-note">
                        {isSelectedTemplateApplied
                          ? "This template is already active for the current catalog."
                          : `Current catalog is still using ${editorTemplate?.name || "another template"}. Review the live preview, then apply this selection when ready.`}
                      </div>
                      <TemplateThumbnail template={selectedTemplate} />
                      <div className="template-browser-actions">
                        <button className="ghost-button" type="button" onClick={openSelectedTemplateEditor} disabled={detectingTemplateRegions}>
                          {detectingTemplateRegions ? "Detecting Layers..." : (showTemplateAdmin ? "Editor Open" : "Edit Template")}
                        </button>
                        {selectedTemplate.kind === "custom" ? (
                          <button
                            className="ghost-button ghost-button--danger"
                            type="button"
                            onClick={deleteSelectedTemplate}
                            disabled={deletingTemplate || applyingTemplate}
                          >
                            {deletingTemplate ? "Deleting..." : "Delete Template"}
                          </button>
                        ) : null}
                        <button
                          className="primary-button"
                          type="button"
                          onClick={() => applySelectedTemplateToCatalog({ navigateAfterApply: true })}
                          disabled={applyingTemplate || deletingTemplate || !selectedTemplateId || !editorVersion}
                        >
                          {applyingTemplate ? "Applying..." : isSelectedTemplateApplied ? "Open Dashboard" : "Apply To Active Catalog"}
                        </button>
                      </div>
                    </div>

                    <div className="setup-panel template-preview-panel">
                      <div className="panel-header">
                        <strong>Preview Before Apply</strong>
                        <span>live</span>
                      </div>
                      <p className="helper-note">
                        The preview below uses the current active catalog content with the selected template layout.
                      </p>
                      {selectedTemplatePreviewVersion ? (
                        <CatalogPreview
                          label={`Preview on ${activeCatalog?.title || "active catalog"}`}
                          version={selectedTemplatePreviewVersion}
                          template={selectedTemplate}
                        />
                      ) : (
                        <div className="helper-note">No active catalog preview is available yet.</div>
                      )}
                    </div>
                  </div>
                ) : null}
              </WorkspaceModal>

              {showTemplateAdmin ? (
                <div className="admin-template-shell" id="advanced-template-editor">
                  <div className="studio-header">
                    <div>
                      <h2>Advanced Template Editor</h2>
                      <p>Click a region, drag it, update headings, replace assets, and publish the refined template.</p>
                    </div>
                  </div>

                  <div className="template-workbench">
                    <div className="template-workbench__canvas">
                      <TemplateEditorCanvas
                        template={templateDraft}
                        selectedRegionKey={selectedRegionKey}
                        imageAdjustRegionKey={imageAdjustRegionKey}
                        inlineEditorRegionKey={inlineEditorRegionKey}
                        inlineEditorValue={inlineEditorValue}
                        onSelectRegion={setSelectedRegionKey}
                        onStartDrag={startRegionDrag}
                        onDeleteRegion={deleteSelectedTemplateRegion}
                        onRestoreRegion={restoreSelectedTemplateRegion}
                        onRegionImageSelected={replaceSelectedTemplateRegionImage}
                        onRequestEditRegion={requestTemplateRegionEdit}
                        onToggleImageAdjust={toggleTemplateImageAdjust}
                        onImagePanStart={startTemplateImagePan}
                        onImageZoom={zoomTemplateImage}
                        onResetImageCrop={resetTemplateImageCrop}
                        onInlineEditStart={startInlineRegionEdit}
                        onInlineEditChange={updateInlineRegionText}
                        onInlineEditDone={finishInlineRegionEdit}
                        sampleTitle={catalogSetupState.title || snapshot.approvedVersion?.catalog?.title || "J 300 LM"}
                      />
                    </div>

                    <TemplateInspector
                      template={templateDraft}
                      selectedRegionKey={selectedRegionKey}
                      onSelectRegion={setSelectedRegionKey}
                      onTemplateMetaChange={(patch) => setTemplateDraft((current) => ({ ...current, ...patch }))}
                      onRegionImageSelected={replaceSelectedTemplateRegionImage}
                      onRegionChange={(patch) => setTemplateDraft((current) => updateTemplateRegion(current, selectedRegionKey, patch))}
                      onDeleteRegion={deleteSelectedTemplateRegion}
                      onRestoreRegion={restoreSelectedTemplateRegion}
                      assetState={templateAssetState}
                      onAssetChange={(key, file) => setTemplateAssetState((current) => ({ ...current, [key]: file }))}
                      onPublish={publishTemplate}
                      publishing={publishingTemplate}
                    />
                  </div>
                </div>
              ) : null}
            </section>
          </section>
        ) : null}

        {snapshot && activePage === "catalogs" ? (
          <section className="main-page">
            <section className="studio-shell">
              <div className="studio-header">
                <div>
                  <h2>Catalog Library</h2>
                  <p>Keep the catalog page focused on the active workspace. Create new catalogs, upload PDFs, and choose templates in compact pop-ups.</p>
                </div>
                <div className="studio-header__actions">
                  <button className="primary-button" type="button" onClick={() => setShowCatalogCreateDialog(true)}>
                    Create New Catalog
                  </button>
                  <button className="ghost-button" type="button" onClick={() => setShowCatalogUploadDialog(true)}>
                    Upload PDF Catalog
                  </button>
                  <button className="ghost-button" type="button" onClick={() => navigateToPage("templates")}>
                    Open Templates
                  </button>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => {
                      document.getElementById("catalog-workspace-editor")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                      });
                    }}
                  >
                    Open Active Editor
                  </button>
                  <button className="ghost-button" type="button" onClick={() => navigateToPage("dashboard")}>
                    Back To Dashboard
                  </button>
                </div>
              </div>

              <WorkspaceModal
                open={showCatalogCreateDialog}
                title="Create New Catalog"
                subtitle="Fill in the catalog details, choose a template, optionally edit that template, then create the catalog."
                onClose={() => setShowCatalogCreateDialog(false)}
                size="xl"
              >
                <div className="workspace-modal__grid workspace-modal__grid--catalog-create">
                  <div className="setup-panel catalog-create-panel">
                    <div className="panel-header">
                      <strong>Catalog Details</strong>
                      <span>step 1</span>
                    </div>
                    <div className="field-grid">
                      <div className="field-group">
                        <label className="prompt-panel__label" htmlFor="catalog-create-title">
                          Catalog name
                        </label>
                        <input
                          id="catalog-create-title"
                          type="text"
                          value={catalogCreatorState.title}
                          onChange={(event) => setCatalogCreatorState((current) => ({ ...current, title: event.target.value }))}
                          placeholder="Example: ACE VMC 850"
                        />
                      </div>
                      <div className="field-group">
                        <label className="prompt-panel__label" htmlFor="catalog-create-category">
                          Machine category
                        </label>
                        <input
                          id="catalog-create-category"
                          type="text"
                          value={catalogCreatorState.machineCategory}
                          onChange={(event) => setCatalogCreatorState((current) => ({ ...current, machineCategory: event.target.value }))}
                          placeholder="Vertical Machining Center"
                        />
                      </div>
                    </div>
                    <div className="field-grid">
                      <div className="field-group">
                        <label className="prompt-panel__label" htmlFor="catalog-create-language">
                          Language
                        </label>
                        <select
                          id="catalog-create-language"
                          value={catalogCreatorState.language}
                          onChange={(event) => setCatalogCreatorState((current) => ({ ...current, language: event.target.value }))}
                        >
                          {supportedLanguages.map((language) => (
                            <option key={language} value={language}>
                              {language}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="catalog-template-pill">
                      <span>Selected template</span>
                      <strong>{catalogCreatorSelectedTemplate?.name || "Choose a template card"}</strong>
                    </div>
                    <div className="helper-note">
                      Creating a catalog adds it to the library, selects it as the active workspace, and opens the on-canvas editor in this page.
                    </div>
                    <div className="catalog-create-panel__actions">
                      <button className="primary-button" type="button" onClick={() => startCatalogWorkspace({ navigateAfterStart: true })} disabled={creatingCatalog}>
                        {creatingCatalog ? "Creating..." : "Create New Catalog"}
                      </button>
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={openCatalogTemplateEditor}
                        disabled={!catalogCreatorSelectedTemplate}
                      >
                        Edit Selected Template
                      </button>
                    </div>
                  </div>

                  <div className="setup-panel catalog-template-browser">
                    <div className="panel-header">
                      <strong>Choose Template</strong>
                      <span>{snapshot.templates?.length || 0} layouts</span>
                    </div>
                    <div className="helper-note">
                      Click a template card to select it. You can open the same advanced Canva-style template editor before creating the catalog.
                    </div>
                    <div className="template-gallery template-gallery--catalogs">
                      {(snapshot.templates || []).map((template) => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          isSelected={catalogCreatorState.templateId === template.id}
                          isActive={editorVersion?.catalog?.templateId === template.id}
                          onSelect={selectCatalogCreatorTemplate}
                        />
                      ))}
                    </div>

                    {catalogCreatorSelectedTemplate ? (
                      <div className="catalog-template-focus">
                        <div className="catalog-template-focus__meta">
                          <div className="panel-header">
                            <strong>{catalogCreatorSelectedTemplate.name}</strong>
                            <StatusPill tone={catalogCreatorSelectedTemplate.kind === "custom" ? "success" : "neutral"}>
                              {catalogCreatorSelectedTemplate.kind === "custom" ? "custom" : "built in"}
                            </StatusPill>
                          </div>
                          <p>{catalogCreatorSelectedTemplate.description}</p>
                          <div className="helper-note">
                            Use this layout for the new catalog, or edit the template first if you want to adjust image/text regions.
                          </div>
                        </div>
                        <TemplateThumbnail template={catalogCreatorSelectedTemplate} />
                      </div>
                    ) : null}
                  </div>
                </div>
              </WorkspaceModal>

              <WorkspaceModal
                open={showCatalogUploadDialog}
                title="Upload PDF Catalog"
                subtitle="Add another machine catalog PDF to the library so it can be selected and used in the workspace."
                onClose={() => setShowCatalogUploadDialog(false)}
                size="medium"
              >
                <div className="setup-panel catalog-upload-modal">
                  <div className="panel-header">
                    <strong>Catalog PDF</strong>
                    <span>library import</span>
                  </div>
                  <div className="field-group">
                    <label className="prompt-panel__label" htmlFor="catalog-upload-file">
                      Choose PDF file
                    </label>
                    <input
                      id="catalog-upload-file"
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(event) => setCatalogUploadFile(event.target.files?.[0] || null)}
                    />
                  </div>
                  <div className="attachment-note">
                    {catalogUploadFile ? `Selected: ${catalogUploadFile.name}` : "No file chosen yet."}
                  </div>
                  <div className="catalog-create-panel__actions">
                    <button className="primary-button" type="button" onClick={uploadCatalogPdf} disabled={uploadingCatalog}>
                      {uploadingCatalog ? "Uploading..." : "Upload PDF"}
                    </button>
                    <button className="ghost-button" type="button" onClick={() => setShowCatalogUploadDialog(false)}>
                      Close
                    </button>
                  </div>
                </div>
              </WorkspaceModal>

              {editorVersion && editorTemplate ? (
                <div className="catalog-editor-shell" id="catalog-workspace-editor">
                  <div className="catalog-editor-main">
                    <div className="editor-inspector-hero">
                      <div className="editor-inspector-hero__topline">
                        <span>Catalog Editor</span>
                        <StatusPill tone="success">{activeCatalog?.title || editorVersion.catalog?.title || "Active"}</StatusPill>
                      </div>
                      <h3>{selectedCatalogRegionMeta.label}</h3>
                      <p>
                        Click any text or image area on the catalog preview to edit directly on the canvas, or use the AI chat panel to create a new draft version.
                      </p>
                      <div className="editor-inspector-metrics">
                        <InspectorMetric label="Working version" value={editorVersion.versionLabel || "v1"} />
                        <InspectorMetric label="Selected block" value={getSelectedRegionPrimaryMetric()} />
                        <InspectorMetric label="Template" value={editorTemplate.name || "Catalog template"} />
                      </div>
                    </div>

                    <div className="catalog-editor-body">
                      <div className="catalog-editor-canvas-column">
                        <div className="editor-canvas-stage">
                          <div className="editor-canvas-stage__header">
                            <div>
                              <strong>On-canvas catalog preview</strong>
                              <p>The active template stays visible while clicked text or image areas switch into direct editing.</p>
                            </div>
                            <div className="editor-canvas-stage__actions">
                              <button
                                className="ghost-button"
                                type="button"
                                onClick={() => queueCatalogPromptSuggestion(`Update ${selectedCatalogRegionMeta.label} and keep the layout print-ready.`)}
                              >
                                Use AI On This Block
                              </button>
                              {canManuallySaveCatalogRegion(selectedCatalogRegionKey) ? (
                                <button className="primary-button" type="button" onClick={saveCatalogManualEdit} disabled={savingCatalogManualEdit}>
                                  {savingCatalogManualEdit ? "Saving..." : "Save Draft"}
                                </button>
                              ) : null}
                            </div>
                          </div>

                          <CatalogPreview
                            label={`Editing ${activeCatalog?.title || editorVersion.catalog?.title || "Catalog"}`}
                            version={editorVersion}
                            template={editorTemplate}
                            focusRegionKey={selectedCatalogRegionKey}
                            onSelectRegion={setSelectedCatalogRegionKey}
                            editorState={catalogCanvasEditorState}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <form className="setup-panel catalog-ai-panel" id="catalog-ai-panel" onSubmit={applyCatalogPrompt}>
                    <div className="panel-header">
                      <strong>AI Change Request</strong>
                      <span>draft generator</span>
                    </div>
                    <div className="assistant-context-chip">
                      Focused block: <strong>{selectedCatalogRegionMeta.label}</strong>
                    </div>
                    <label className="prompt-panel__label" htmlFor="catalog-ai-prompt">
                      Prompt
                    </label>
                    <textarea
                      id="catalog-ai-prompt"
                      value={catalogPromptState.prompt}
                      onChange={(event) => setCatalogPromptState((current) => ({ ...current, prompt: event.target.value }))}
                      placeholder="Example: Under Optional Accessories add hydraulic power operated chuck (O200 mm) and keep the layout print-ready."
                    />
                    <div className="assistant-suggestions">
                      {catalogAssistantSuggestions.map((samplePrompt) => (
                        <button
                          key={samplePrompt}
                          className="assistant-suggestion"
                          type="button"
                          onClick={() => queueCatalogPromptSuggestion(samplePrompt)}
                        >
                          {samplePrompt}
                        </button>
                      ))}
                    </div>
                    <label className="prompt-panel__label" htmlFor="catalog-ai-attachment">
                      Optional attachment
                    </label>
                    <input
                      id="catalog-ai-attachment"
                      type="file"
                      accept=".txt,.md,.json,.csv,.xlsx,.xls,image/*"
                      onChange={(event) =>
                        setCatalogPromptState((current) => ({
                          ...current,
                          attachment: event.target.files?.[0] || null
                        }))
                      }
                    />
                    <div className="attachment-note">
                      {catalogPromptState.attachment ? `Attached: ${catalogPromptState.attachment.name}` : "No file chosen."}
                    </div>
                    <div className="editor-property-hint">
                      Every AI request creates a new draft version. Use the save button on the canvas side for direct block edits, and use chat for specs, translation, fitting, or broader content changes.
                    </div>
                    <button className="primary-button" type="submit" disabled={loading || resetting || creatingCatalog || creatingTemplate || publishingTemplate}>
                      {loading ? "Working..." : "Generate Draft"}
                    </button>
                  </form>
                </div>
              ) : null}

              <div className="setup-panel catalog-library-section">
                <div className="panel-header">
                  <strong>Catalog Cards</strong>
                  <span>{catalogLibrary.items?.length || 0} items</span>
                </div>
                <div className="catalog-tile-grid">
                  {(catalogLibrary.items || []).map((item) => (
                    <CatalogLibraryCard
                      key={item.id}
                      item={item}
                      isActive={catalogLibrary.activeCatalogId === item.id}
                      onSelect={selectCatalogLibraryItem}
                    />
                  ))}
                </div>
              </div>
            </section>
          </section>
        ) : null}

        {snapshot && activePage === "template-create" ? (
          <section className="main-page">
            <section className="studio-shell">
              <div className="studio-header">
                <div>
                  <h2>Create New Template</h2>
                  <p>Define a template by prompt, attach the original source file when available, then refine editable regions before publishing.</p>
                </div>
                <div className="studio-header__actions">
                  <button className="ghost-button" type="button" onClick={openTemplateLibrary}>
                    Back To Templates
                  </button>
                  <button className="ghost-button" type="button" onClick={() => navigateToPage("dashboard")}>
                    Open Dashboard
                  </button>
                </div>
              </div>

              <div className="template-creator-grid">
                <form className="setup-panel template-prompt-panel" onSubmit={(event) => event.preventDefault()}>
                  <div className="panel-header">
                    <strong>Create By Prompt</strong>
                    <span>source led</span>
                  </div>

                  <label className="prompt-panel__label" htmlFor="template-base-select">
                    Optional base template
                  </label>
                  <select
                    id="template-base-select"
                    value={templatePromptSourceId}
                    onChange={(event) => setTemplatePromptSourceId(event.target.value)}
                  >
                    <option value={BLANK_TEMPLATE_ID}>Start from scratch</option>
                    {snapshot.templates?.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  <div className="helper-note">
                    {templatePromptSourceId === BLANK_TEMPLATE_ID
                      ? "No base template will be forced. The system will start from a neutral blank brochure layout."
                      : `Starting structure: ${templatePromptSourceTemplate?.name || "selected template"}.`}
                  </div>

                  <textarea
                    className="template-prompt-panel__textarea"
                    value={templatePromptState.prompt}
                    onChange={(event) => setTemplatePromptState((current) => ({ ...current, prompt: event.target.value }))}
                    placeholder="Example: Rebuild the uploaded original catalog as an exact-match editable template and preserve the overall structure."
                  />

                  <div className="prompt-chips">
                    {sampleTemplatePrompts.map((samplePrompt) => (
                      <button
                        key={samplePrompt}
                        className="prompt-chip"
                        type="button"
                        onClick={() => setTemplatePromptState((current) => ({ ...current, prompt: samplePrompt }))}
                      >
                        {samplePrompt}
                      </button>
                    ))}
                  </div>

                  <label className="prompt-panel__label" htmlFor="template-source-design">
                    Original source file
                  </label>
                  <input
                    id="template-source-design"
                    type="file"
                    accept=".pdf,.ai,.eps,.cdr,.svg,.zip"
                    onChange={(event) =>
                      setTemplatePromptState((current) => ({
                        ...current,
                        sourceDesign: event.target.files?.[0] || null
                      }))
                    }
                  />
                  {templatePromptState.sourceDesign ? (
                    <div className="attachment-note">Source design: {templatePromptState.sourceDesign.name}</div>
                  ) : (
                    <div className="helper-note">
                      Upload the original PDF, CorelDRAW, Illustrator, SVG, or exported Canva package/PDF. Image-only reference input has been removed from this flow.
                    </div>
                  )}

                  <label className="toggle-row" htmlFor="apply-brand-assets">
                    <input
                      id="apply-brand-assets"
                      type="checkbox"
                      checked={templatePromptState.applyBrandAssets}
                      onChange={(event) =>
                        setTemplatePromptState((current) => ({
                          ...current,
                          applyBrandAssets: event.target.checked
                        }))
                      }
                    />
                    <span>Apply standard Ace Micromatic logo and footer assets</span>
                  </label>

                  <div className="helper-note">
                    For this POC, uploaded source files are stored with the template for exact-match reconstruction workflows. Standard logo and footer assets still come from the J 300 LM template when applied.
                  </div>

                  <div className="template-prompt-panel__actions">
                    <button className="primary-button" type="button" onClick={() => runTemplatePrompt("create")} disabled={creatingTemplate}>
                      {creatingTemplate ? "Working..." : "Generate New Template"}
                    </button>
                  </div>
                </form>

                <div className="template-creator-preview">
                  {templateCreatorDraft ? (
                    <div className="template-workbench">
                      <div className="template-workbench__canvas">
                        <TemplateEditorCanvas
                          template={templateCreatorDraft}
                          selectedRegionKey={selectedRegionKey}
                          imageAdjustRegionKey={imageAdjustRegionKey}
                          inlineEditorRegionKey={inlineEditorRegionKey}
                          inlineEditorValue={inlineEditorValue}
                          onSelectRegion={setSelectedRegionKey}
                          onStartDrag={startRegionDrag}
                          onDeleteRegion={deleteSelectedTemplateRegion}
                          onRestoreRegion={restoreSelectedTemplateRegion}
                          onRegionImageSelected={replaceSelectedTemplateRegionImage}
                          onRequestEditRegion={requestTemplateRegionEdit}
                          onToggleImageAdjust={toggleTemplateImageAdjust}
                          onImagePanStart={startTemplateImagePan}
                          onImageZoom={zoomTemplateImage}
                          onResetImageCrop={resetTemplateImageCrop}
                          onInlineEditStart={startInlineRegionEdit}
                          onInlineEditChange={updateInlineRegionText}
                          onInlineEditDone={finishInlineRegionEdit}
                          sampleTitle={catalogSetupState.title || snapshot.approvedVersion?.catalog?.title || "J 300 LM"}
                        />
                      </div>

                      <TemplateInspector
                        template={templateCreatorDraft}
                        selectedRegionKey={selectedRegionKey}
                        onSelectRegion={setSelectedRegionKey}
                        onTemplateMetaChange={(patch) => setTemplateDraft((current) => ({ ...current, ...patch }))}
                        onRegionImageSelected={replaceSelectedTemplateRegionImage}
                        onRegionChange={(patch) => setTemplateDraft((current) => updateTemplateRegion(current, selectedRegionKey, patch))}
                        onDeleteRegion={deleteSelectedTemplateRegion}
                        onRestoreRegion={restoreSelectedTemplateRegion}
                        assetState={templateAssetState}
                        onAssetChange={(key, file) => setTemplateAssetState((current) => ({ ...current, [key]: file }))}
                        onPublish={publishTemplate}
                        publishing={publishingTemplate}
                      />
                    </div>
                  ) : (
                    <div className="setup-panel template-creator-empty">
                      <div className="panel-header">
                        <strong>Template Workspace</strong>
                        <span>waiting for prompt</span>
                      </div>
                      <p>
                        After generation, you can reposition blocks, replace assets, edit labels, and then publish the finished template.
                      </p>
                      {templatePromptSourceTemplate ? <TemplateThumbnail template={templatePromptSourceTemplate} /> : null}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </section>
        ) : null}

        {snapshot && activePage !== "dashboard" && activePage !== "templates" && activePage !== "catalogs" && activePage !== "template-create" ? (
          <section className="main-page">
            <section className="preview-section preview-section--legacy">
                <div className="studio-header">
                  <div>
                    <h2>Dashboard</h2>
                    <p>Preview the approved version and current working draft side by side.</p>
                  </div>
                </div>
                <div className="preview-grid preview-grid--dashboard">
                  <CatalogPreview label="Current approved" version={snapshot.approvedVersion} template={approvedTemplate} />
                  <CatalogPreview label="Selected working version" version={workingPreviewVersion} template={workingPreviewTemplate} />
                </div>
            </section>
          </section>
        ) : null}
      </main>
    </div>
  );
}
