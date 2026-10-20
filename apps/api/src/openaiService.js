import fs from "node:fs";
import OpenAI from "openai";
import { readEnvValue, sourceByteEnvCandidates } from "./config.js";
import { translateJ300CatalogWithBuiltInDictionary } from "./catalogTranslations.js";

let cachedApiKey = null;
const sectionDefinitions = [
  {
    key: "optional_accessories",
    catalogKey: "optionalAccessories",
    matcher: "option(?:al)?\\s+ac?cessor(?:y|ies)",
    addType: "add_optional_accessory",
    removeType: "remove_optional_accessory"
  },
  {
    key: "standard_accessories",
    catalogKey: "standardAccessories",
    matcher: "standard\\s+ac?cessor(?:y|ies)",
    addType: "add_standard_accessory",
    removeType: "remove_standard_accessory"
  },
  {
    key: "machine_features",
    catalogKey: "features",
    matcher: "(?:machine\\s+)?features?",
    addType: "add_feature",
    removeType: "remove_feature"
  }
];
const sectionAlternatives = sectionDefinitions.map((section) => `(?:${section.matcher})`).join("|");
const translationLanguages = [
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
const templatePalettes = {
  red: {
    name: "Red",
    titleBackground: "#fff4f4",
    columnColors: ["#8d2a2f", "#a12e34", "#b43a3f"],
    specsBackground: "#fffdfd",
    specsBorder: "#b52e33"
  },
  slate: {
    name: "Slate",
    titleBackground: "#f3f6f8",
    columnColors: ["#43515d", "#3b4854", "#32404b"],
    specsBackground: "#fbfcfd",
    specsBorder: "#4d6275"
  },
  green: {
    name: "Green",
    titleBackground: "#f7fbf8",
    columnColors: ["#31544b", "#3b6257", "#456f63"],
    specsBackground: "#fcfffd",
    specsBorder: "#2e6a56"
  },
  blue: {
    name: "Blue",
    titleBackground: "#f2f7ff",
    columnColors: ["#24446c", "#2e5a89", "#3e70a5"],
    specsBackground: "#fcfdff",
    specsBorder: "#2e5f99"
  }
};

function normalizeListItem(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/^[,;:\-•*]+/, "")
    .replace(/[,;:\-•*]+$/, "")
    .trim();
}

function getSectionDefinition(sectionText) {
  const normalized = normalizeListItem(sectionText).toLowerCase();
  return sectionDefinitions.find((section) => new RegExp(`^${section.matcher}$`, "i").test(normalized)) || null;
}

function normalizeOperationValue(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizeSpecRequestLabel(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\bmax\b/g, "maximum")
    .replace(/\baxes\b/g, "axis")
    .replace(/\s+/g, " ")
    .trim();
}

function trimTrailingPunctuation(value) {
  return String(value || "").replace(/[.,;:!?]+$/, "").trim();
}

function splitCommandClauses(value) {
  return String(value || "")
    .replace(/\r/g, "\n")
    .split(/\n+|(?<=[.!?])\s+(?=(?:\d+\.\s*)?[A-Z])/)
    .map((clause) => clause
      .trim()
      .replace(/^(?:\d+[.)]|[-*•])\s*/, "")
      .replace(/^`+|`+$/g, "")
      .trim())
    .filter(Boolean);
}

function findRequestedLanguage(text) {
  const lowered = String(text || "").toLowerCase();
  return translationLanguages.find((language) => lowered.includes(language.toLowerCase())) || null;
}

function inferSectionFromCatalog(currentCatalog, value) {
  const wanted = normalizeOperationValue(value);
  if (!wanted || !currentCatalog) {
    return null;
  }

  return (
    sectionDefinitions.find((section) =>
      (currentCatalog[section.catalogKey] || []).some((item) => normalizeOperationValue(item) === wanted)
    ) || null
  );
}

function splitRequestedItems(rawValue) {
  const normalized = String(rawValue || "")
    .replace(/\r/g, "\n")
    .replace(/(?:^|\n)\s*[-*•]\s+/g, ", ")
    .replace(/\s+(?:and|&)\s+/gi, ", ")
    .replace(/\n+/g, ", ");

  return normalized
    .split(/[,;]+/)
    .map(normalizeListItem)
    .filter(Boolean);
}

function normalizeOperationShape(operation) {
  if (!operation || typeof operation !== "object") {
    return null;
  }

  const normalized = { ...operation };
  normalized.type = normalized.type || normalized.operation || null;
  delete normalized.operation;

  return normalized.type ? normalized : null;
}

function extractListOperations(prompt) {
  const operations = [];
  const actionFirstRegex = new RegExp(
    `\\b(add|remove|delete)\\s+([\\s\\S]+?)\\s+(?:under|to|in|from)\\s+(that(?:\\s+section)?|${sectionAlternatives})\\b`,
    "gi"
  );
  const sectionFirstRegex = new RegExp(
    `\\b(?:under|in)\\s+(that(?:\\s+section)?|${sectionAlternatives})\\s+(add|remove|delete)\\s+([\\s\\S]+?)(?=$|[.?!])`,
    "gi"
  );
  let lastSection = null;

  for (const match of String(prompt || "").matchAll(actionFirstRegex)) {
    const action = match[1].toLowerCase();
    const items = splitRequestedItems(match[2]);
    const targetText = match[3];
    const section = /^that/i.test(targetText) ? lastSection : getSectionDefinition(targetText);

    if (!section) {
      continue;
    }

    lastSection = section;
    const operationType = action === "add" ? section.addType : section.removeType;

    for (const item of items) {
      operations.push({
        type: operationType,
        value: item
      });
    }
  }

  for (const match of String(prompt || "").matchAll(sectionFirstRegex)) {
    const targetText = match[1];
    const action = match[2].toLowerCase();
    const items = splitRequestedItems(match[3]);
    const section = /^that/i.test(targetText) ? lastSection : getSectionDefinition(targetText);

    if (!section) {
      continue;
    }

    lastSection = section;
    const operationType = action === "add" ? section.addType : section.removeType;

    for (const item of items) {
      operations.push({
        type: operationType,
        value: item
      });
    }
  }

  return operations;
}

function extractLayoutOperations(prompt) {
  const promptText = String(prompt || "");
  const operations = [];

  if (
    /\b(adjust|fit|reflow|tighten|compact|compress|fix|shrink|reduce|decrease)\b[\s\S]{0,48}\b(height|font|size|spacing|layout|overflow|boundary|template|fit)\b/i.test(promptText) ||
    /\bmake (?:it |the )?(?:fit|smaller|compact)\b/i.test(promptText)
  ) {
    operations.push({ type: "tighten_layout" });
  }

  if (/\b(increase|enlarge|restore|reset)\b[\s\S]{0,24}\bfont(?:\s+size)?\b/i.test(promptText)) {
    operations.push({ type: "loosen_layout" });
  }

  const removeLineMatch = promptText.match(
    new RegExp(`\\b(?:remove|delete|trim)\\s+(?:one|1)\\s+(?:line|item)\\b(?:\\s+(?:from|under|in)\\s+(that(?:\\s+section)?|${sectionAlternatives}))?`, "i")
  );

  if (removeLineMatch) {
    const targetText = removeLineMatch[1];
    const section = targetText && !/^that/i.test(targetText) ? getSectionDefinition(targetText) : null;
    operations.push({
      type: "remove_list_line",
      sectionKey: section?.catalogKey || null,
      count: 1
    });
  }

  return operations;
}

function extractReplaceOperations(prompt, currentCatalog) {
  const operations = [];
  const promptText = String(prompt || "");
  const replaceWithSection = new RegExp(
    `\\b(?:replace|change|modify|shorten)\\s+(.+?)\\s+(?:to|with)\\s+(.+?)\\s+(?:under|in|within|for)\\s+(that(?:\\s+section)?|${sectionAlternatives})\\b`,
    "i"
  );
  const replaceWithoutSection = /\b(?:replace|change|modify|shorten)\s+(.+?)\s+(?:to|with)\s+(.+?)(?:[.?!]|$)/i;

  const scopedMatch = promptText.match(replaceWithSection);
  if (scopedMatch) {
    const targetText = scopedMatch[3];
    const section = /^that/i.test(targetText)
      ? inferSectionFromCatalog(currentCatalog, scopedMatch[1])
      : getSectionDefinition(targetText);

    if (section) {
      operations.push({
        type: "replace_list_item",
        sectionKey: section.catalogKey,
        oldValue: trimTrailingPunctuation(scopedMatch[1]),
        value: trimTrailingPunctuation(scopedMatch[2])
      });
      return operations;
    }
  }

  const genericMatch = promptText.match(replaceWithoutSection);
  if (genericMatch) {
    const section = inferSectionFromCatalog(currentCatalog, genericMatch[1]);
    if (section) {
      operations.push({
        type: "replace_list_item",
        sectionKey: section.catalogKey,
        oldValue: trimTrailingPunctuation(genericMatch[1]),
        value: trimTrailingPunctuation(genericMatch[2])
      });
    }
  }

  return operations;
}

function extractSpecOperations(prompt, currentCatalog) {
  const specItems = (currentCatalog?.specSections || []).flatMap((section) => section.items || []);
  if (!specItems.length) {
    return [];
  }

  const operations = [];
  for (const rawLine of splitCommandClauses(prompt)) {
    const line = rawLine.trim().replace(/^\d+\.\s*/, "");
    const match = line.match(/^(?:change|update|set)\s+(.+?)\s+from\s+(.+?)\s+to\s+(.+?)\.?$/i);
    if (!match) {
      continue;
    }

    const requestedLabel = normalizeSpecRequestLabel(match[1]);
    const item = specItems.find((candidate) => normalizeSpecRequestLabel(candidate.label) === requestedLabel)
      || specItems.find((candidate) => {
        const candidateLabel = normalizeSpecRequestLabel(candidate.label);
        return candidateLabel.includes(requestedLabel) || requestedLabel.includes(candidateLabel);
      });

    if (!item) {
      continue;
    }

    operations.push({
      type: "update_spec",
      label: item.label,
      value: trimTrailingPunctuation(match[3])
    });
  }

  return operations;
}

function extractHeuristicOperations(prompt, attachmentText = "", currentCatalog = null, hasImage = false) {
  const operations = [];
  const promptText = String(prompt || "");
  const workingText = `${promptText}\n${attachmentText}`;
  const specOperations = extractSpecOperations(promptText, currentCatalog);

  const titleMatch = workingText.match(/(?:hero\s+)?title to (.+?)(?=\s+and\s+(?:change|set|update|add|remove|translate)\b|[.\n]|$)/i);
  if (titleMatch) {
    operations.push({ type: "set_title", value: titleMatch[1].trim() });
  }

  const machineCategoryMatch = workingText.match(/machine category to (.+?)(?=\s+and\s+(?:change|set|update|add|remove|translate)\b|[.\n]|$)/i);
  if (machineCategoryMatch) {
    operations.push({ type: "set_machine_category", value: machineCategoryMatch[1].trim() });
  }

  const spindleSpeedMatch = workingText.match(/spindle speed(?: from [^ ]+)? to ([0-9 ,./A-Za-z-]+)/i);
  if (spindleSpeedMatch && !specOperations.some((operation) => /spindle speed/i.test(operation.label))) {
    operations.push({
      type: "update_spec",
      label: "Maximum Spindle speed",
      value: spindleSpeedMatch[1].trim()
    });
  }

  const chuckMatch = workingText.match(/chuck size(?: from [^ ]+)? to ([0-9 ,./A-Za-z-]+)/i);
  if (chuckMatch && !specOperations.some((operation) => /chuck size/i.test(operation.label))) {
    operations.push({
      type: "update_spec",
      label: "Standard Chuck Size",
      value: chuckMatch[1].trim()
    });
  }

  operations.push(...specOperations);

  operations.push(...extractListOperations(promptText));
  operations.push(...extractReplaceOperations(promptText, currentCatalog));
  operations.push(...extractLayoutOperations(promptText));

  const requestedLanguage = findRequestedLanguage(workingText);
  if (requestedLanguage) {
    operations.push({ type: "translate_catalog", language: requestedLanguage });
  }

  if (hasImage && /image|photo|visual/i.test(workingText)) {
    operations.push({ type: "set_hero_overlay_image" });
  }

  return operations;
}

function mergeOperationLists(...groups) {
  const merged = new Map();

  for (const group of groups) {
    for (const rawOperation of group || []) {
      const operation = normalizeOperationShape(rawOperation);
      if (!operation) {
        continue;
      }

      let key = operation.type;

      switch (operation.type) {
        case "update_spec":
          key = `${operation.type}|${operation.label || ""}`;
          break;
        case "replace_feature":
        case "replace_standard_accessory":
        case "replace_optional_accessory":
          key = `${operation.type}|${operation.index ?? ""}`;
          break;
        case "add_feature":
        case "remove_feature":
        case "add_standard_accessory":
        case "remove_standard_accessory":
        case "add_optional_accessory":
        case "remove_optional_accessory":
          key = `${operation.type}|${normalizeOperationValue(operation.value)}`;
          break;
        case "replace_list_item":
          key = `${operation.type}|${operation.sectionKey || ""}|${normalizeOperationValue(operation.oldValue)}`;
          break;
        case "remove_list_line":
          key = `${operation.type}|${operation.sectionKey || ""}|${operation.count || 1}`;
          break;
        case "translate_catalog":
          key = `${operation.type}|${operation.language || ""}`;
          break;
        default:
          key = operation.type;
          break;
      }

      merged.set(key, operation);
    }
  }

  return [...merged.values()];
}

function fallbackParse(prompt, attachmentText = "", currentCatalog = null, hasImage = false) {
  return {
    summary: prompt,
    operations: extractHeuristicOperations(prompt, attachmentText, currentCatalog, hasImage)
  };
}

function normalizeTemplatePromptPatch(patch) {
  if (!patch || typeof patch !== "object") {
    return {};
  }

  return {
    ...patch,
    page1: patch.page1
      ? {
          ...patch.page1,
          titleRegion: patch.page1.titleRegion || undefined,
          heroOverlay: patch.page1.heroOverlay || undefined,
          columns: Array.isArray(patch.page1.columns) ? patch.page1.columns : undefined
        }
      : undefined,
    page2: patch.page2
      ? {
          ...patch.page2,
          specsPanel: patch.page2.specsPanel || undefined
        }
      : undefined
  };
}

function mergeTemplatePromptPatches(basePatch = {}, overridePatch = {}) {
  const normalizedBase = normalizeTemplatePromptPatch(basePatch);
  const normalizedOverride = normalizeTemplatePromptPatch(overridePatch);
  const baseColumns = normalizedBase.page1?.columns || [];
  const overrideColumns = normalizedOverride.page1?.columns || [];
  const overrideByKey = new Map(overrideColumns.filter((column) => column?.key).map((column) => [column.key, column]));
  const mergedColumns = [
    ...baseColumns.map((column) => ({
      ...column,
      ...(overrideByKey.get(column.key) || {})
    })),
    ...overrideColumns.filter((column) => column?.key && !baseColumns.some((baseColumn) => baseColumn.key === column.key))
  ];

  return {
    ...normalizedBase,
    ...normalizedOverride,
    page1: normalizedBase.page1 || normalizedOverride.page1
      ? {
          ...(normalizedBase.page1 || {}),
          ...(normalizedOverride.page1 || {}),
          titleRegion: {
            ...(normalizedBase.page1?.titleRegion || {}),
            ...(normalizedOverride.page1?.titleRegion || {})
          },
          heroOverlay: {
            ...(normalizedBase.page1?.heroOverlay || {}),
            ...(normalizedOverride.page1?.heroOverlay || {})
          },
          columns: mergedColumns.length ? mergedColumns : undefined
        }
      : undefined,
    page2: normalizedBase.page2 || normalizedOverride.page2
      ? {
          ...(normalizedBase.page2 || {}),
          ...(normalizedOverride.page2 || {}),
          specsPanel: {
            ...(normalizedBase.page2?.specsPanel || {}),
            ...(normalizedOverride.page2?.specsPanel || {})
          }
        }
      : undefined
  };
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, parsed));
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

function slugifyEditableRegionId(value, fallback) {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

function normalizeEditableRegionPage(page) {
  const normalized = String(page || "").trim().toLowerCase();

  if (normalized === "2" || normalized === "page2" || normalized === "page-2") {
    return "page2";
  }

  return "page1";
}

function normalizeEditableRegionType(type) {
  const normalized = String(type || "").trim().toLowerCase();

  if (["image", "photo", "logo", "illustration"].includes(normalized)) {
    return "image";
  }

  return "text";
}

function buildHeuristicEditableRegions(pageSize, pageCount = 2) {
  const { width, height } = resolveTemplatePageSize(pageSize);
  const isLandscape = width > height;

  const baseTextBackground = "rgba(255,255,255,0.92)";
  const mutedTextColor = "#1f2933";
  const page1Regions = isLandscape
    ? [
        {
          id: "page1-logo",
          page: "page1",
          type: "image",
          label: "Logo",
          x: width * 0.06,
          y: height * 0.05,
          width: width * 0.18,
          height: height * 0.12,
          radius: 10
        },
        {
          id: "page1-headline",
          page: "page1",
          type: "text",
          label: "Main Heading",
          content: "Headline",
          x: width * 0.30,
          y: height * 0.08,
          width: width * 0.32,
          height: height * 0.14,
          background: baseTextBackground,
          textColor: mutedTextColor,
          fontSize: Math.round(height * 0.055),
          fontWeight: 800
        },
        {
          id: "page1-body",
          page: "page1",
          type: "text",
          label: "Lead Copy",
          content: "Introductory copy",
          x: width * 0.08,
          y: height * 0.24,
          width: width * 0.38,
          height: height * 0.26,
          background: baseTextBackground,
          textColor: mutedTextColor,
          fontSize: Math.round(height * 0.025),
          fontWeight: 500
        },
        {
          id: "page1-hero-image",
          page: "page1",
          type: "image",
          label: "Primary Image",
          x: width * 0.58,
          y: height * 0.14,
          width: width * 0.28,
          height: height * 0.46,
          radius: 18
        }
      ]
    : [
        {
          id: "page1-title",
          page: "page1",
          type: "text",
          label: "Cover Title",
          content: "Main heading",
          x: width * 0.08,
          y: height * 0.06,
          width: width * 0.44,
          height: height * 0.12,
          background: baseTextBackground,
          textColor: mutedTextColor,
          fontSize: Math.round(height * 0.05),
          fontWeight: 800
        },
        {
          id: "page1-subcopy",
          page: "page1",
          type: "text",
          label: "Cover Copy",
          content: "Supporting copy",
          x: width * 0.08,
          y: height * 0.20,
          width: width * 0.36,
          height: height * 0.18,
          background: baseTextBackground,
          textColor: mutedTextColor,
          fontSize: Math.round(height * 0.024),
          fontWeight: 500
        },
        {
          id: "page1-hero-image",
          page: "page1",
          type: "image",
          label: "Cover Image",
          x: width * 0.52,
          y: height * 0.12,
          width: width * 0.34,
          height: height * 0.34,
          radius: 18
        },
        {
          id: "page1-feature-copy",
          page: "page1",
          type: "text",
          label: "Lower Text Block",
          content: "Feature copy",
          x: width * 0.08,
          y: height * 0.58,
          width: width * 0.78,
          height: height * 0.18,
          background: baseTextBackground,
          textColor: mutedTextColor,
          fontSize: Math.round(height * 0.024),
          fontWeight: 500
        }
      ];

  if (pageCount < 2) {
    return page1Regions;
  }

  const page2Regions = isLandscape
    ? [
        {
          id: "page2-heading",
          page: "page2",
          type: "text",
          label: "Page Heading",
          content: "Secondary heading",
          x: width * 0.08,
          y: height * 0.08,
          width: width * 0.34,
          height: height * 0.12,
          background: baseTextBackground,
          textColor: mutedTextColor,
          fontSize: Math.round(height * 0.045),
          fontWeight: 800
        },
        {
          id: "page2-copy-left",
          page: "page2",
          type: "text",
          label: "Left Copy",
          content: "Detailed copy",
          x: width * 0.08,
          y: height * 0.22,
          width: width * 0.30,
          height: height * 0.44,
          background: baseTextBackground,
          textColor: mutedTextColor,
          fontSize: Math.round(height * 0.024),
          fontWeight: 500
        },
        {
          id: "page2-copy-right",
          page: "page2",
          type: "text",
          label: "Right Copy",
          content: "Supporting copy",
          x: width * 0.44,
          y: height * 0.22,
          width: width * 0.22,
          height: height * 0.40,
          background: baseTextBackground,
          textColor: mutedTextColor,
          fontSize: Math.round(height * 0.023),
          fontWeight: 500
        },
        {
          id: "page2-image",
          page: "page2",
          type: "image",
          label: "Secondary Image",
          x: width * 0.72,
          y: height * 0.18,
          width: width * 0.18,
          height: height * 0.42,
          radius: 18
        }
      ]
    : [
        {
          id: "page2-heading",
          page: "page2",
          type: "text",
          label: "Page Heading",
          content: "Secondary heading",
          x: width * 0.10,
          y: height * 0.08,
          width: width * 0.56,
          height: height * 0.10,
          background: baseTextBackground,
          textColor: mutedTextColor,
          fontSize: Math.round(height * 0.042),
          fontWeight: 800
        },
        {
          id: "page2-body-top",
          page: "page2",
          type: "text",
          label: "Upper Copy",
          content: "Body copy",
          x: width * 0.10,
          y: height * 0.22,
          width: width * 0.34,
          height: height * 0.24,
          background: baseTextBackground,
          textColor: mutedTextColor,
          fontSize: Math.round(height * 0.024),
          fontWeight: 500
        },
        {
          id: "page2-body-bottom",
          page: "page2",
          type: "text",
          label: "Lower Copy",
          content: "Additional copy",
          x: width * 0.10,
          y: height * 0.52,
          width: width * 0.34,
          height: height * 0.18,
          background: baseTextBackground,
          textColor: mutedTextColor,
          fontSize: Math.round(height * 0.022),
          fontWeight: 500
        },
        {
          id: "page2-image",
          page: "page2",
          type: "image",
          label: "Feature Image",
          x: width * 0.56,
          y: height * 0.24,
          width: width * 0.28,
          height: height * 0.34,
          radius: 18
        }
      ];

  return [...page1Regions, ...page2Regions];
}

function normalizeEditableTemplateRegions(regions, pageSize, fallbackRegions = []) {
  const resolvedPageSize = resolveTemplatePageSize(pageSize);
  const sourceRegions = Array.isArray(regions) && regions.length ? regions : fallbackRegions;

  return sourceRegions
    .filter((region) => region && typeof region === "object")
    .map((region, index) => {
      const type = normalizeEditableRegionType(region.type);
      const page = normalizeEditableRegionPage(region.page || region.pageId || region.pageNumber);
      const defaultWidth = type === "image" ? resolvedPageSize.width * 0.24 : resolvedPageSize.width * 0.34;
      const defaultHeight = type === "image" ? resolvedPageSize.height * 0.22 : resolvedPageSize.height * 0.14;
      const width = clampNumber(region.width, 24, resolvedPageSize.width, defaultWidth);
      const height = clampNumber(region.height, 24, resolvedPageSize.height, defaultHeight);
      const x = clampNumber(region.x, 0, Math.max(0, resolvedPageSize.width - width), resolvedPageSize.width * 0.08);
      const y = clampNumber(region.y, 0, Math.max(0, resolvedPageSize.height - height), resolvedPageSize.height * 0.08);

      return {
        id: slugifyEditableRegionId(region.id || region.key || region.label, `region-${index + 1}`),
        page,
        type,
        label: String(region.label || region.title || (type === "image" ? `Image ${index + 1}` : `Text ${index + 1}`)).trim(),
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
        hidden: Boolean(region.hidden),
        background: typeof region.background === "string" && region.background.trim()
          ? region.background.trim()
          : (type === "text" ? "rgba(255,255,255,0.92)" : "transparent"),
        textColor: typeof region.textColor === "string" && region.textColor.trim()
          ? region.textColor.trim()
          : (typeof region.color === "string" && region.color.trim() ? region.color.trim() : "#1f2933"),
        content: typeof region.content === "string" && region.content.trim()
          ? region.content.trim()
          : (typeof region.text === "string" && region.text.trim()
            ? region.text.trim()
            : (type === "text" ? String(region.value || region.sampleText || region.label || "").trim() : "")),
        originalContent: typeof region.originalContent === "string"
          ? region.originalContent
          : (typeof region.content === "string" && region.content.trim()
            ? region.content.trim()
            : (typeof region.text === "string" && region.text.trim()
              ? region.text.trim()
              : (type === "text" ? String(region.value || region.sampleText || region.label || "").trim() : ""))),
        fontSize: clampNumber(region.fontSize, 10, 72, type === "text" ? 24 : 16),
        fontWeight: clampNumber(region.fontWeight, 300, 900, type === "text" ? 700 : 600),
        radius: clampNumber(region.radius, 0, 120, type === "image" ? 16 : 12),
        objectFit: typeof region.objectFit === "string" && region.objectFit.trim()
          ? region.objectFit.trim()
          : "cover",
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
    })
    .filter((region) => region.width > 0 && region.height > 0);
}

function pickTemplatePalette(prompt) {
  const text = String(prompt || "").toLowerCase();

  if (/\bred\b|\bmaroon\b|\bcrimson\b/.test(text)) {
    return templatePalettes.red;
  }

  if (/\bgreen\b|\bolive\b|\bemerald\b/.test(text)) {
    return templatePalettes.green;
  }

  if (/\bblue\b|\bnavy\b|\broyal\b/.test(text)) {
    return templatePalettes.blue;
  }

  if (/\bslate\b|\bgray\b|\bgrey\b|\bindustrial\b|\bsteel\b/.test(text)) {
    return templatePalettes.slate;
  }

  return templatePalettes.red;
}

function extractTemplateName(prompt, paletteName) {
  const explicitMatch = String(prompt || "").match(/\b(?:call|name)(?:\s+it)?\s+([A-Za-z0-9 &-]{4,60})/i);
  if (explicitMatch) {
    return explicitMatch[1].trim();
  }

  const baseWords = String(prompt || "")
    .replace(/[^A-Za-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase());

  return baseWords.length ? `${baseWords.join(" ")} Template` : `${paletteName} Catalog Template`;
}

function mergeBackgroundDesign(baseDesign = {}, overrideDesign = {}) {
  return {
    page1: {
      ...(baseDesign.page1 || {}),
      ...(overrideDesign.page1 || {})
    },
    page2: {
      ...(baseDesign.page2 || {}),
      ...(overrideDesign.page2 || {})
    }
  };
}

function buildHeuristicBackgroundDesign(prompt, palette, hasReferenceImage = false) {
  const text = String(prompt || "").toLowerCase();
  let page1Style = hasReferenceImage ? "wave-corporate" : "technical-cover";
  let page2Style = hasReferenceImage ? "header-band" : "clean-spec";

  if (/\byellow\b|\bgold\b|\bblack\b|\bpanel\b|\bfold\b/.test(text)) {
    page1Style = "diagonal-bands";
    page2Style = "split-spec";
  } else if (/\bwave\b|\bswoosh\b|\bcorporate\b|\bbusiness\b|\bblue\b/.test(text)) {
    page1Style = "wave-corporate";
    page2Style = "header-band";
  } else if (/\bminimal\b|\bclean\b|\bwhite\b|\bairy\b/.test(text)) {
    page1Style = "panel-stack";
    page2Style = "clean-spec";
  } else if (/\bindustrial\b|\bmachine\b|\btechnical\b|\bengineering\b/.test(text)) {
    page1Style = "technical-cover";
    page2Style = "clean-spec";
  }

  return {
    page1: {
      style: page1Style,
      primary: palette.columnColors[0],
      secondary: palette.columnColors[1],
      accent: palette.columnColors[2],
      surface: palette.titleBackground,
      neutral: palette.specsBackground
    },
    page2: {
      style: page2Style,
      primary: palette.specsBorder,
      secondary: palette.columnColors[1],
      accent: palette.columnColors[2],
      surface: palette.specsBackground,
      neutral: palette.titleBackground
    }
  };
}

function buildLayoutPresetPatch(page1Style, page2Style, baseTemplate) {
  const baseColumns = baseTemplate?.page1?.columns || [];
  const getColumn = (key, fallbackIndex) =>
    baseColumns.find((column) => column.key === key) || baseColumns[fallbackIndex] || { key };

  let page1Patch = {};
  if (page1Style === "diagonal-bands") {
    page1Patch = {
      titleRegion: { x: 34, y: 46, width: 228, height: 72 },
      heroOverlay: {
        x: 44,
        y: 150,
        width: 238,
        height: 338,
        radius: 22,
        frameStyle: "card",
        placeholderImage: null
      },
      columns: [
        { ...getColumn("features", 0), x: 322, y: 168, width: 220, height: 118 },
        { ...getColumn("standardAccessories", 1), x: 322, y: 306, width: 220, height: 128 },
        { ...getColumn("optionalAccessories", 2), x: 322, y: 454, width: 220, height: 142 }
      ]
    };
  } else if (page1Style === "panel-stack") {
    page1Patch = {
      titleRegion: { x: 44, y: 52, width: 244, height: 70 },
      heroOverlay: {
        x: 304,
        y: 118,
        width: 222,
        height: 256,
        radius: 24,
        frameStyle: "card",
        placeholderImage: null
      },
      columns: [
        { ...getColumn("features", 0), x: 42, y: 406, width: 500, height: 96 },
        { ...getColumn("standardAccessories", 1), x: 42, y: 522, width: 236, height: 146 },
        { ...getColumn("optionalAccessories", 2), x: 306, y: 522, width: 236, height: 146 }
      ]
    };
  } else if (page1Style === "wave-corporate") {
    page1Patch = {
      titleRegion: { x: 40, y: 70, width: 222, height: 66 },
      heroOverlay: {
        x: 316,
        y: 132,
        width: 214,
        height: 258,
        radius: 26,
        frameStyle: "card",
        placeholderImage: null
      },
      columns: [
        { ...getColumn("features", 0), x: 32, y: 500, width: 160, height: 174 },
        { ...getColumn("standardAccessories", 1), x: 208, y: 500, width: 160, height: 174 },
        { ...getColumn("optionalAccessories", 2), x: 384, y: 500, width: 160, height: 174 }
      ]
    };
  } else {
    page1Patch = {
      titleRegion: { x: 38, y: 42, width: 206, height: 66 },
      heroOverlay: {
        x: 308,
        y: 114,
        width: 232,
        height: 268,
        radius: 26,
        frameStyle: "card",
        placeholderImage: Object.prototype.hasOwnProperty.call(baseTemplate?.page1?.heroOverlay || {}, "placeholderImage")
          ? baseTemplate.page1.heroOverlay.placeholderImage
          : null
      },
      columns: [
        { ...getColumn("features", 0), x: 30, y: 474, width: 168, height: 220 },
        { ...getColumn("standardAccessories", 1), x: 214, y: 474, width: 168, height: 220 },
        { ...getColumn("optionalAccessories", 2), x: 398, y: 474, width: 168, height: 220 }
      ]
    };
  }

  let page2Patch = {};
  if (page2Style === "split-spec") {
    page2Patch = {
      specsPanel: {
        x: 166,
        y: 118,
        width: 386,
        height: 640
      }
    };
  } else if (page2Style === "header-band") {
    page2Patch = {
      specsPanel: {
        x: 42,
        y: 148,
        width: 510,
        height: 610
      }
    };
  } else {
    page2Patch = {
      specsPanel: {
        x: 44,
        y: 152,
        width: 508,
        height: 604
      }
    };
  }

  return {
    page1: page1Patch,
    page2: page2Patch
  };
}

function buildHeuristicTemplateResult(prompt, baseTemplate, {
  hasReferenceImage = false,
  sourcePageCount = 0
} = {}) {
  const palette = pickTemplatePalette(prompt);
  const text = String(prompt || "").toLowerCase();
  const backgroundDesign = buildHeuristicBackgroundDesign(prompt, palette, hasReferenceImage);
  const patch = mergeTemplatePromptPatches(buildLayoutPresetPatch(backgroundDesign.page1.style, backgroundDesign.page2.style, baseTemplate), {
    page1: {
      titleRegion: {
        background: palette.titleBackground
      },
      heroOverlay: {
        ...(hasReferenceImage ? { placeholderImage: null } : {})
      },
      columns: (baseTemplate?.page1?.columns || []).map((column, index) => ({
        key: column.key,
        background: palette.columnColors[index] || palette.columnColors[palette.columnColors.length - 1]
      }))
    },
    page2: {
      specsPanel: {
        title: /performance/i.test(text)
          ? "Performance Specifications"
          : /technical/i.test(text)
            ? "Technical Specifications"
            : /machine/i.test(text)
              ? "Machine Specifications"
              : "Specifications",
        background: palette.specsBackground,
        borderColor: palette.specsBorder
      }
    }
  });

  if (/minimal|clean|simple/i.test(text)) {
    patch.page1.heroOverlay = {
      ...patch.page1.heroOverlay,
      x: 238,
      y: 110,
      width: 238,
      height: 246,
      radius: 18
    };
  }

  if (/premium|showcase|bold/i.test(text)) {
    patch.page1.heroOverlay = {
      ...patch.page1.heroOverlay,
      x: 222,
      y: 102,
      width: 262,
      height: 268,
      radius: 22
    };
  }

  if (/move .*image.*left/i.test(text) || /image.*left/i.test(text)) {
    patch.page1.heroOverlay = { ...patch.page1.heroOverlay, x: 170 };
  }

  if (/move .*image.*right/i.test(text) || /image.*right/i.test(text)) {
    patch.page1.heroOverlay = { ...patch.page1.heroOverlay, x: 250 };
  }

  if (/move .*image.*up/i.test(text) || /image.*top/i.test(text)) {
    patch.page1.heroOverlay = { ...patch.page1.heroOverlay, y: 86 };
  }

  if (/move .*image.*down/i.test(text) || /image.*bottom/i.test(text)) {
    patch.page1.heroOverlay = { ...patch.page1.heroOverlay, y: 144 };
  }

  if (/hide .*image|remove .*image|delete .*image/i.test(text)) {
    patch.page1.heroOverlay = { ...patch.page1.heroOverlay, hidden: true };
  }

  if (/show .*image|restore .*image/i.test(text)) {
    patch.page1.heroOverlay = { ...patch.page1.heroOverlay, hidden: false };
  }

  const titleColorMatch = String(prompt || "").match(/title(?:\s+box|\s+background)?\s+(?:to|as)\s+(#[0-9a-fA-F]{6})/i);
  if (titleColorMatch) {
    patch.page1.titleRegion.background = titleColorMatch[1];
  }

  const specTitleMatch = String(prompt || "").match(/spec(?:ification)?s?\s+title\s+(?:to|as)\s+([A-Za-z0-9 &-]{4,50})/i);
  if (specTitleMatch) {
    patch.page2.specsPanel.title = specTitleMatch[1].trim();
  }

  const labelPatterns = [
    { key: "features", labelMatcher: /machine\s+features?/i },
    { key: "standardAccessories", labelMatcher: /standard\s+accessor(?:y|ies)/i },
    { key: "optionalAccessories", labelMatcher: /optional\s+accessor(?:y|ies)/i }
  ];

  for (const definition of labelPatterns) {
    const renameMatch = String(prompt || "").match(
      new RegExp(`(?:rename|change)\\s+${definition.labelMatcher.source}\\s+(?:to|as)\\s+([A-Za-z0-9 &-]{3,50})`, "i")
    );

    if (renameMatch) {
      patch.page1.columns = patch.page1.columns.map((column) =>
        column.key === definition.key
          ? {
              ...column,
              label: renameMatch[1].trim()
            }
          : column
      );
    }
  }

  for (const definition of labelPatterns) {
    const hideMatch = String(prompt || "").match(new RegExp(`(?:hide|delete|remove)\\s+${definition.labelMatcher.source}`, "i"));
    const showMatch = String(prompt || "").match(new RegExp(`(?:show|restore)\\s+${definition.labelMatcher.source}`, "i"));

    if (hideMatch || showMatch) {
      patch.page1.columns = patch.page1.columns.map((column) =>
        column.key === definition.key
          ? {
              ...column,
              hidden: Boolean(hideMatch)
            }
          : column
      );
    }
  }

  return {
    name: extractTemplateName(prompt, palette.name),
    description: hasReferenceImage
      ? `Reference-inspired ${palette.name.toLowerCase()} brochure template for machine catalog layouts.`
      : `Prompt-created ${palette.name.toLowerCase()} brochure template for machine catalog layouts.`,
    patch,
    editableRegions: hasReferenceImage
      ? normalizeEditableTemplateRegions([], baseTemplate?.pageSize, buildHeuristicEditableRegions(baseTemplate?.pageSize, sourcePageCount || 2))
      : [],
    backgroundDesign
  };
}

function toDataUrl(sourceDesign) {
  const mimeType = sourceDesign?.mimeType || sourceDesign?.mimetype || "";
  if (!sourceDesign?.buffer || !mimeType || !String(mimeType).startsWith("image/")) {
    return null;
  }

  return `data:${mimeType};base64,${sourceDesign.buffer.toString("base64")}`;
}

function getApiKey() {
  if (cachedApiKey) {
    return cachedApiKey;
  }

  if (process.env.OPENAI_API_KEY) {
    cachedApiKey = process.env.OPENAI_API_KEY;
    return cachedApiKey;
  }

  for (const candidate of sourceByteEnvCandidates) {
    const value = readEnvValue(candidate, "OPENAI_API_KEY");
    if (value) {
      cachedApiKey = value;
      return cachedApiKey;
    }
  }

  return null;
}

export function isAiConfigured() {
  const apiKey = getApiKey();
  return Boolean(apiKey) && !/your[_-]?openai[_-]?api[_-]?key|replace[_-]?me|placeholder/i.test(apiKey);
}

export function hasBuiltInCatalogTranslation(targetLanguage) {
  return Boolean(translateJ300CatalogWithBuiltInDictionary({
    language: "English",
    features: [],
    standardAccessories: [],
    optionalAccessories: [],
    specSections: [],
    sectionLabels: {},
    pageTextBlocks: []
  }, targetLanguage));
}

function getClient() {
  const apiKey = getApiKey();
  if (!apiKey || /your[_-]?openai[_-]?api[_-]?key|replace[_-]?me|placeholder/i.test(apiKey)) {
    return null;
  }

  return new OpenAI({ apiKey });
}

export async function parsePromptToOperations({ prompt, attachmentText, currentCatalog, hasImage }) {
  const client = getClient();
  if (!client) {
    return fallbackParse(prompt, attachmentText, currentCatalog, hasImage);
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You convert catalog editing requests into JSON. Return strict JSON with keys summary and operations. " +
            "Each operation object must use the key type, not operation. " +
            "Allowed operation types: set_title, set_machine_category, update_spec, add_feature, remove_feature, replace_feature, " +
            "add_standard_accessory, remove_standard_accessory, replace_standard_accessory, add_optional_accessory, remove_optional_accessory, replace_optional_accessory, " +
            "replace_list_item, remove_list_line, tighten_layout, loosen_layout, set_badge, set_hero_overlay_image, translate_catalog. " +
            "If the user lists multiple items for a section, return one add_* or remove_* operation per item instead of combining them. " +
            "If the user says 'from that', infer the most recently referenced list section in the same prompt. " +
            "For replace_list_item include sectionKey, oldValue and value. " +
            "For remove_list_line include sectionKey when known and count. " +
            "For update_spec include label and value. For translate_catalog include language. " +
            "Use tighten_layout when the user asks to make translated content fit, reduce font size, adjust height, fix overflow or reflow the template. " +
            "Use loosen_layout when the user asks to increase or restore the font size. " +
            "If an uploaded image should be used, include set_hero_overlay_image. " +
            "Do not include explanations outside JSON."
        },
        {
          role: "user",
          content: JSON.stringify({
            prompt,
            attachmentText,
            hasImage,
            currentCatalog
          })
        }
      ]
    });

    const raw = completion.choices?.[0]?.message?.content;
    if (!raw) {
      return fallbackParse(prompt, attachmentText, currentCatalog, hasImage);
    }

    const parsed = JSON.parse(raw);
    const heuristicOperations = extractHeuristicOperations(prompt, attachmentText, currentCatalog, hasImage);
    const parsedOperations = Array.isArray(parsed.operations)
      ? parsed.operations
      : parsed.operations && typeof parsed.operations === "object"
        ? [parsed.operations]
        : [];

    const heuristicTypes = new Set(heuristicOperations.map((operation) => operation.type));
    const supplementalParsedOperations = parsedOperations.filter(
      (operation) => !heuristicTypes.has(normalizeOperationShape(operation)?.type)
    );

    return {
      summary: parsed.summary || prompt,
      operations: mergeOperationLists(
        supplementalParsedOperations,
        heuristicOperations
      )
    };
  } catch (error) {
    return {
      summary: prompt,
      operations: extractHeuristicOperations(prompt, attachmentText, currentCatalog, hasImage)
    };
  }
}

function extractTranslationPayload(catalog) {
  return {
    language: catalog.language,
    title: catalog.title,
    machineCategory: catalog.machineCategory,
    specificationsTitle: catalog.specificationsTitle,
    sectionLabels: catalog.sectionLabels,
    badge: catalog.badge,
    features: catalog.features,
    standardAccessories: catalog.standardAccessories,
    optionalAccessories: catalog.optionalAccessories,
    specSections: catalog.specSections,
    legalNote: catalog.legalNote,
    pageTextBlocks: catalog.pageTextBlocks
  };
}

function translateListWithoutChangingStructure(sourceItems, translatedItems) {
  const translated = Array.isArray(translatedItems) ? translatedItems : [];
  return (sourceItems || []).map((sourceItem, index) => (
    typeof translated[index] === "string" && translated[index].trim()
      ? translated[index]
      : sourceItem
  ));
}

function mergeTranslatedPageTextBlocks(sourceBlocks, translatedBlocks) {
  const translated = Array.isArray(translatedBlocks) ? translatedBlocks : [];
  const translatedById = new Map(
    translated
      .filter((block) => block && block.id)
      .map((block) => [String(block.id), block])
  );

  return (sourceBlocks || []).map((sourceBlock, index) => {
    const candidate = translatedById.get(String(sourceBlock.id || "")) || translated[index] || {};
    const result = { ...sourceBlock };

    if (typeof candidate.text === "string" && candidate.text.trim()) {
      result.text = candidate.text;
    }

    if (Array.isArray(sourceBlock.rows)) {
      result.rows = sourceBlock.rows.map((row, rowIndex) => (
        typeof candidate.rows?.[rowIndex] === "string" && candidate.rows[rowIndex].trim()
          ? candidate.rows[rowIndex]
          : row
      ));
    }

    return result;
  });
}

function mergeTranslatedSpecSections(sourceSections, translatedSections) {
  const translated = Array.isArray(translatedSections) ? translatedSections : [];
  return (sourceSections || []).map((sourceSection, sectionIndex) => {
    const candidateSection = translated[sectionIndex] || {};
    return {
      ...sourceSection,
      title: typeof candidateSection.title === "string" && candidateSection.title.trim()
        ? candidateSection.title
        : sourceSection.title,
      items: (sourceSection.items || []).map((sourceItem, itemIndex) => {
        const candidateItem = candidateSection.items?.[itemIndex] || {};
        return {
          ...sourceItem,
          label: typeof candidateItem.label === "string" && candidateItem.label.trim()
            ? candidateItem.label
            : sourceItem.label
        };
      })
    };
  });
}

function preserveCatalogLayout(catalog, translatedCatalog, targetLanguage) {
  const translated = translatedCatalog && typeof translatedCatalog === "object" ? translatedCatalog : {};
  const translatedSectionLabels = translated.sectionLabels && typeof translated.sectionLabels === "object"
    ? translated.sectionLabels
    : {};

  return {
    ...catalog,
    title: typeof translated.title === "string" && translated.title.trim() ? translated.title : catalog.title,
    machineCategory: typeof translated.machineCategory === "string" && translated.machineCategory.trim()
      ? translated.machineCategory
      : catalog.machineCategory,
    specificationsTitle: typeof translated.specificationsTitle === "string" && translated.specificationsTitle.trim()
      ? translated.specificationsTitle
      : catalog.specificationsTitle,
    sectionLabels: {
      ...catalog.sectionLabels,
      ...translatedSectionLabels
    },
    badge: translated.badge ?? catalog.badge,
    features: translateListWithoutChangingStructure(catalog.features, translated.features),
    standardAccessories: translateListWithoutChangingStructure(catalog.standardAccessories, translated.standardAccessories),
    optionalAccessories: translateListWithoutChangingStructure(catalog.optionalAccessories, translated.optionalAccessories),
    specSections: mergeTranslatedSpecSections(catalog.specSections, translated.specSections),
    legalNote: typeof translated.legalNote === "string" && translated.legalNote.trim()
      ? translated.legalNote
      : catalog.legalNote,
    pageTextBlocks: mergeTranslatedPageTextBlocks(catalog.pageTextBlocks, translated.pageTextBlocks),
    language: targetLanguage
  };
}

export async function translateCatalog(catalog, targetLanguage) {
  const builtInTranslation = translateJ300CatalogWithBuiltInDictionary(catalog, targetLanguage);
  const client = getClient();
  if (!client) {
    if (builtInTranslation) {
      return builtInTranslation;
    }
    throw new Error("The translation service is not configured");
  }

  const payload = extractTranslationPayload(catalog);

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Translate the provided catalog JSON into the requested language while preserving the same JSON keys, arrays, IDs, and structure. " +
            "Translate text only. Keep all numbers, units, machine codes, coordinates, dimensions, font sizes, line heights, colors, and alignment values unchanged. " +
            "Return only valid JSON."
        },
        {
          role: "user",
          content: JSON.stringify({
            targetLanguage,
            catalog: payload
          })
        }
      ]
    });

    const raw = completion.choices?.[0]?.message?.content;
    if (!raw) {
      throw new Error("The translation service returned no translated content");
    }

    const translated = JSON.parse(raw);
    const translatedCatalog = translated.catalog && typeof translated.catalog === "object"
      ? translated.catalog
      : translated;

    return preserveCatalogLayout(catalog, translatedCatalog, targetLanguage);
  } catch (error) {
    if (builtInTranslation) {
      console.warn(`Catalog translation service failed; using the built-in J300 ${targetLanguage} translation`, error?.message || error);
      return builtInTranslation;
    }
    console.warn("Catalog translation failed; keeping the source content", error?.message || error);
    throw new Error(`Catalog translation failed: ${error?.message || "unknown error"}`);
  }
}

export async function generateTemplateFromPrompt({
  prompt,
  baseTemplate,
  sourceDesign = null,
  sourceDesignPages = []
}) {
  const referenceImages = Array.isArray(sourceDesignPages) && sourceDesignPages.length
    ? sourceDesignPages
    : (sourceDesign && String(sourceDesign.mimeType || "").startsWith("image/") ? [sourceDesign] : []);
  const preserveSourcePageBackgrounds = Array.isArray(sourceDesignPages) && sourceDesignPages.length > 0;
  const heuristic = buildHeuristicTemplateResult(prompt, baseTemplate, {
    hasReferenceImage: referenceImages.length > 0,
    sourcePageCount: referenceImages.length
  });
  const client = getClient();

  if (!client) {
    return heuristic;
  }

  try {
    const promptPayload = [
      {
        type: "text",
        text:
          "Create or modify a 2-page machine catalog template. Return strict JSON with keys name, description, patch, optional editableRegions, and optional backgroundDesign. " +
          "Use patch only for fields that should change. Allowed patch fields are page1.titleRegion, page1.heroOverlay, page1.columns[], and page2.specsPanel. " +
          "For page1.columns[] always include key. Valid keys are features, standardAccessories, optionalAccessories. " +
          "You may set label, x, y, width, height, background, hidden, radius, borderColor, title, placeholderImage, frameStyle, objectFit, and title/background colors where applicable. " +
          "editableRegions should be an array of direct-on-canvas editable hotspots inferred from the uploaded design. " +
          "Each editable region must include id, page, type, label, x, y, width, and height. Valid page values are page1 and page2. Valid type values are text and image. " +
          "For text regions, also include content, background, textColor, fontSize, fontWeight, and textAlign when you can infer them. " +
          "For image regions, include radius and objectFit when useful. " +
          "Return 4 to 12 editable regions total, focusing on the real headings, body-copy blocks, logo slots, CTA blocks, and dominant image areas a designer would want to edit. " +
          "If the source page contains any photo, rendering, worker shot, product image, map, logo, or other obvious visual asset, include at least one image region for that page. " +
          "When a region needs to cover printed source text so the user can edit directly on top of the design, choose a practical background color that matches the panel under it. " +
          "backgroundDesign may contain page1.style and page2.style plus color tokens primary, secondary, accent, surface, neutral. " +
          "Allowed page1 styles are technical-cover, wave-corporate, diagonal-bands, panel-stack. " +
          "Allowed page2 styles are clean-spec, split-spec, header-band. " +
          "Keep the output practical for a professional industrial machine brochure. " +
          "If preview pages from the uploaded source file are attached, use them to infer the real layout, regions, proportions, and page balance. " +
          "When exact source pages are provided, assume those pages will be used as the final background artwork, so focus on returning editable overlay regions that align to the real design. " +
          "Do not invent generic placeholder boxes when the uploaded source already contains the real artwork. Hide duplicate overlays if the source page already bakes them in. " +
          "If the source does not imply a reusable editable hero image slot, set page1.heroOverlay.hidden to true or page1.heroOverlay.placeholderImage to null so the template stays clean."
      },
      {
        type: "text",
        text: JSON.stringify({
          prompt,
          baseTemplate,
          preserveSourcePageBackgrounds
        })
      }
    ];

    for (const referenceImage of referenceImages.slice(0, 2)) {
      const imageUrl = toDataUrl(referenceImage);
      if (!imageUrl) {
        continue;
      }

      promptPayload.push({
        type: "image_url",
        image_url: {
          url: imageUrl
        }
      });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a brochure template art director for industrial machine catalogs. " +
            "Return valid JSON only. Do not include markdown."
        },
        {
          role: "user",
          content: promptPayload
        }
      ]
    });

    const raw = completion.choices?.[0]?.message?.content;
    if (!raw) {
      return heuristic;
    }

    const parsed = JSON.parse(raw);
    return {
      name: parsed.name || heuristic.name,
      description: parsed.description || heuristic.description,
      patch: mergeTemplatePromptPatches(heuristic.patch, parsed.patch || {}),
      editableRegions: referenceImages.length
        ? normalizeEditableTemplateRegions(parsed.editableRegions, baseTemplate?.pageSize, heuristic.editableRegions)
        : [],
      backgroundDesign: preserveSourcePageBackgrounds
        ? null
        : mergeBackgroundDesign(heuristic.backgroundDesign, parsed.backgroundDesign || {})
    };
  } catch (error) {
    return heuristic;
  }
}
