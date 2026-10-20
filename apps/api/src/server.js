import fs from "node:fs";
import path from "node:path";
import express from "express";
import cors from "cors";
import multer from "multer";
import {
  apiRoot,
  projectRoot,
  assetsRoot,
  catalogLibraryFilesRoot,
  templateAssetsRoot,
  uploadsRoot
} from "./config.js";
import {
  applyLayoutOperationsToCatalog,
  approveVersion,
  createCatalogFromTemplate,
  createDraftFromCatalog,
  createDraftFromOperations,
  discardDraftVersion,
  getCatalogSnapshot,
  getVersionById,
  initializeStore,
  resetWorkspaceWithCatalogSeed,
  resetStore,
  replaceCatalogContent,
  saveUploadedFile
} from "./catalogStore.js";
import { exportCatalogVersion, getPrintLayoutIssues } from "./pdfExporter.js";
import { isImageAttachment, parseAttachmentOperations, parseAttachmentText } from "./attachmentParser.js";
import {
  generateTemplateFromPrompt,
  hasBuiltInCatalogTranslation,
  isAiConfigured,
  parsePromptToOperations,
  translateCatalog
} from "./openaiService.js";
import {
  BLANK_TEMPLATE_ID,
  createTemplate,
  deleteTemplate,
  getScratchTemplateSeed,
  getTemplateById,
  resolveTemplateBackgroundPath,
  updateTemplate
} from "./templateStore.js";
import { prepareSourceDesignImport } from "./sourceDesignImporter.js";
import { extractEditableRegionsFromPdf } from "./pdfRegionExtractor.js";
import {
  addCreatedCatalog,
  addUploadedCatalogPdf,
  getCatalogLibraryItem,
  getCatalogLibrarySnapshot,
  initializeCatalogLibraryStore,
  setActiveCatalog
} from "./catalogLibraryStore.js";

initializeStore();
initializeCatalogLibraryStore();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const port = Number(process.env.PORT || 3001);
const legacyPreTemplateDir = path.join(projectRoot, "legacy-pre-template");

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/api/assets/j300", express.static(assetsRoot));
app.get(/^\/api\/template-assets\/.+$/, (req, res, next) => {
  const resolvedFilePath = resolveTemplateBackgroundPath(req.path);

  if (resolvedFilePath && fs.existsSync(resolvedFilePath)) {
    res.sendFile(resolvedFilePath);
    return;
  }

  res.status(404).json({ error: "Template asset not found" });
});
app.use("/api/template-assets", express.static(templateAssetsRoot));
app.use("/api/uploads", express.static(uploadsRoot));
app.use("/api/catalog-library-files", express.static(catalogLibraryFilesRoot));

function createCatalogResponse() {
  const snapshot = getCatalogSnapshot();
  const decorateVersion = (version) => {
    if (!version) {
      return version;
    }

    return {
      ...version,
      layoutIssues: getPrintLayoutIssues(version)
    };
  };

  return {
    ...snapshot,
    catalogLibrary: getCatalogLibrarySnapshot(),
    approvedVersion: decorateVersion(snapshot.approvedVersion),
    workingVersion: decorateVersion(snapshot.workingVersion),
    versions: snapshot.versions.map(decorateVersion),
    aiConfigured: isAiConfigured()
  };
}

function getMimeTypeFromFilePath(filePath) {
  const ext = path.extname(String(filePath || "")).toLowerCase();

  switch (ext) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    default:
      return "image/jpeg";
  }
}

function createPromptImageFromTemplateAsset(filePath, fallbackName) {
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }

  return {
    originalname: fallbackName,
    mimetype: getMimeTypeFromFilePath(filePath),
    buffer: fs.readFileSync(filePath)
  };
}

function applyExactSourcePagePatch(baseTemplate, patch = {}) {
  const page1Patch = patch.page1 || {};
  const page2Patch = patch.page2 || {};
  const incomingColumns = Array.isArray(page1Patch.columns) ? page1Patch.columns : [];
  const incomingColumnsByKey = new Map(
    incomingColumns
      .filter((column) => column?.key)
      .map((column) => [column.key, column])
  );

  return {
    ...patch,
    page1: {
      ...page1Patch,
      titleRegion: {
        ...(page1Patch.titleRegion || {}),
        hidden: true
      },
      heroOverlay: {
        ...(page1Patch.heroOverlay || {}),
        hidden: true,
        placeholderImage: null
      },
      columns: (baseTemplate?.page1?.columns || []).map((column) => ({
        key: column.key,
        ...(incomingColumnsByKey.get(column.key) || {}),
        hidden: true
      }))
    },
    page2: {
      ...page2Patch,
      specsPanel: {
        ...(page2Patch.specsPanel || {}),
        hidden: true
      }
    }
  };
}

function normalizeOperationValue(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function mergeOperations(baseOperations = [], overrideOperations = []) {
  const merged = new Map();

  for (const operation of [...baseOperations, ...overrideOperations]) {
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
      case "set_title":
      case "set_machine_category":
      case "set_badge":
      case "set_hero_overlay_image":
      default:
        key = operation.type;
        break;
    }

    merged.set(key, operation);
  }

  return [...merged.values()];
}

function normalizeLineItems(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    aiConfigured: isAiConfigured()
  });
});

app.get("/api/catalog", (_req, res) => {
  res.json(createCatalogResponse());
});

app.post("/api/catalog/reset", (_req, res) => {
  resetStore();
  res.json({
    snapshot: createCatalogResponse()
  });
});

app.post("/api/catalog-library/upload", upload.single("pdf"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "PDF file is required" });
    return;
  }

  const uploaded = addUploadedCatalogPdf(req.file);
  res.json({
    uploaded,
    catalogLibrary: getCatalogLibrarySnapshot(),
    snapshot: createCatalogResponse()
  });
});

app.post("/api/catalog-library/select", (req, res) => {
  const catalogId = String(req.body?.catalogId || "").trim();

  if (!catalogId) {
    res.status(400).json({ error: "Catalog is required" });
    return;
  }

  const item = getCatalogLibraryItem(catalogId);
  if (!item) {
    res.status(404).json({ error: "Catalog not found" });
    return;
  }

  setActiveCatalog(catalogId);
  const snapshot = resetWorkspaceWithCatalogSeed({
    catalogId: item.id,
    templateId: item.templateId,
    title: item.title,
    machineCategory: item.machineCategory,
    language: item.language,
    summary: item.kind === "uploaded_pdf"
      ? `Catalog staged from uploaded PDF ${item.title}`
      : `Catalog seeded from ${item.title}`
  });

  res.json({
    selectedCatalog: item,
    catalogLibrary: getCatalogLibrarySnapshot(),
    snapshot: createCatalogResponse()
  });
});

app.post("/api/catalog/new", (req, res) => {
  const templateId = String(req.body?.templateId || "").trim();

  if (!templateId) {
    res.status(400).json({ error: "Template is required" });
    return;
  }

  const snapshot = createCatalogFromTemplate({
    templateId,
    title: req.body?.title,
    machineCategory: req.body?.machineCategory,
    language: req.body?.language
  });

  if (!snapshot) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  res.json({
    snapshot: createCatalogResponse()
  });
});

app.post("/api/catalog-library/create", (req, res) => {
  const templateId = String(req.body?.templateId || "").trim();
  const title = String(req.body?.title || "").trim();
  const machineCategory = String(req.body?.machineCategory || "").trim();
  const language = String(req.body?.language || "English").trim() || "English";

  if (!templateId) {
    res.status(400).json({ error: "Template is required" });
    return;
  }

  if (!title) {
    res.status(400).json({ error: "Catalog name is required" });
    return;
  }

  const createdCatalog = addCreatedCatalog({
    templateId,
    title,
    machineCategory,
    language
  });

  if (!createdCatalog) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  resetWorkspaceWithCatalogSeed({
    catalogId: createdCatalog.id,
    templateId: createdCatalog.templateId,
    title: createdCatalog.title,
    machineCategory: createdCatalog.machineCategory,
    language: createdCatalog.language,
    summary: `Catalog created from template ${getTemplateById(createdCatalog.templateId)?.name || createdCatalog.templateId}`
  });

  res.json({
    createdCatalog,
    catalogLibrary: getCatalogLibrarySnapshot(),
    snapshot: createCatalogResponse()
  });
});

app.post("/api/templates", upload.fields([
  { name: "page1Background", maxCount: 1 },
  { name: "page2Background", maxCount: 1 },
  { name: "heroPlaceholder", maxCount: 1 }
]), (req, res) => {
  const templateName = String(req.body?.name || "").trim();

  if (!templateName) {
    res.status(400).json({ error: "Template name is required" });
    return;
  }

  const files = req.files || {};
  const page1File = Array.isArray(files.page1Background) ? files.page1Background[0] : null;
  const page2File = Array.isArray(files.page2Background) ? files.page2Background[0] : null;
  const heroPlaceholderFile = Array.isArray(files.heroPlaceholder) ? files.heroPlaceholder[0] : null;

  const template = createTemplate({
    name: templateName,
    description: req.body?.description,
    sourceTemplateId: req.body?.sourceTemplateId,
    page1File,
    page2File,
    heroPlaceholderFile
  });

  res.json({
    template,
    snapshot: createCatalogResponse()
  });
});

app.post("/api/templates/prompt", upload.single("sourceDesign"), async (req, res) => {
  const prompt = String(req.body?.prompt || "").trim();
  const sourceTemplateId = String(req.body?.sourceTemplateId || "").trim() || undefined;
  const targetTemplateId = String(req.body?.templateId || "").trim() || undefined;
  const mode = String(req.body?.mode || (targetTemplateId ? "update" : "create")).trim().toLowerCase();
  const applyBrandAssets = String(req.body?.applyBrandAssets || "true").trim().toLowerCase() !== "false";

  if (!prompt) {
    res.status(400).json({ error: "Prompt is required" });
    return;
  }

  const useScratchBase = mode !== "update" && (!sourceTemplateId || sourceTemplateId === BLANK_TEMPLATE_ID);
  const baseTemplate = useScratchBase
    ? getScratchTemplateSeed()
    : getTemplateById(targetTemplateId || sourceTemplateId || "j300-lm-template");
  if (!baseTemplate) {
    res.status(404).json({ error: "Base template not found" });
    return;
  }

  const sourceDesignFile = req.file
    ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        buffer: req.file.buffer
      }
    : null;
  const sourceDesignImport = sourceDesignFile
    ? await prepareSourceDesignImport(sourceDesignFile)
    : null;
  const preserveSourceBranding = Boolean(sourceDesignImport?.pageFiles?.length) &&
    /\bexact(?:-|\s)?match\b|\bpreserve\b|\boriginal\b|\bsame\b|\bmatching\b/i.test(prompt);
  const brandFramePatch = preserveSourceBranding
    ? { brandFrame: "native" }
    : (applyBrandAssets ? { brandFrame: "shared" } : {});
  const aiBaseTemplate = sourceDesignImport?.pageSize
    ? {
        ...baseTemplate,
        pageSize: sourceDesignImport.pageSize
      }
    : baseTemplate;

  const promptResult = await generateTemplateFromPrompt({
    prompt,
    baseTemplate: aiBaseTemplate,
    sourceDesign: sourceDesignFile
      ? {
          originalName: sourceDesignFile.originalname,
          mimeType: sourceDesignFile.mimetype,
          buffer: sourceDesignFile.buffer
        }
      : null,
    sourceDesignPages: sourceDesignImport?.promptImages || []
  });
  const templatePatch = preserveSourceBranding
    ? applyExactSourcePagePatch(aiBaseTemplate, promptResult.patch || {})
    : promptResult.patch;

  const template = mode === "update" && targetTemplateId
    ? updateTemplate(targetTemplateId, {
        updates: {
          name: promptResult.name,
          description: promptResult.description,
          editableRegions: promptResult.editableRegions,
          ...templatePatch,
          ...brandFramePatch
        },
        backgroundDesign: promptResult.backgroundDesign,
        pageSizeOverride: sourceDesignImport?.pageSize || null,
        page1File: sourceDesignImport?.pageFiles?.[0] || null,
        page2File: sourceDesignImport?.pageFiles?.[1] || null,
        sourceDesignFile: req.file || null
      })
    : createTemplate({
        name: promptResult.name,
        description: promptResult.description,
        sourceTemplateId: useScratchBase ? BLANK_TEMPLATE_ID : baseTemplate.id,
        patch: {
          editableRegions: promptResult.editableRegions,
          ...templatePatch,
          ...brandFramePatch
        },
        backgroundDesign: promptResult.backgroundDesign,
        pageSizeOverride: sourceDesignImport?.pageSize || null,
        page1File: sourceDesignImport?.pageFiles?.[0] || null,
        page2File: sourceDesignImport?.pageFiles?.[1] || null,
        sourceDesignFile: req.file || null
      });

  if (!template) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  res.json({
    template,
    snapshot: createCatalogResponse()
  });
});

app.post("/api/templates/:templateId/detect-regions", async (req, res) => {
  const templateId = String(req.params.templateId || "").trim();
  const template = getTemplateById(templateId);

  if (!template) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  const prompt = String(
    req.body?.prompt ||
    "Detect editable text and image regions directly from these brochure pages. Keep the exact design and return only practical on-canvas editing hotspots. If a page contains visible photos, product renders, logos, worker scenes, or other artwork, include image hotspots for them."
  ).trim();
  const page1PromptImage = createPromptImageFromTemplateAsset(
    resolveTemplateBackgroundPath(template.page1?.background),
    "page-1.png"
  );
  const page2PromptImage = createPromptImageFromTemplateAsset(
    resolveTemplateBackgroundPath(template.page2?.background),
    "page-2.png"
  );
  const sourceDesignPages = [page1PromptImage, page2PromptImage].filter(Boolean);
  const sourceDesignPath = resolveTemplateBackgroundPath(template.sourceDesign?.assetUrl);
  const sourceDesignMimeType = String(template.sourceDesign?.mimeType || "").toLowerCase();
  const extractedPdfRegions = sourceDesignPath && sourceDesignMimeType.includes("pdf")
    ? await extractEditableRegionsFromPdf(sourceDesignPath, { maxPages: 2 }).catch((error) => {
        console.warn("PDF region extraction failed, falling back to AI detection", error);
        return null;
      })
    : null;

  if (!extractedPdfRegions && !sourceDesignPages.length) {
    res.status(400).json({ error: "No source design pages are available for this template" });
    return;
  }

  const promptResult = extractedPdfRegions
    ? {
        editableRegions: extractedPdfRegions.editableRegions,
        regionDetectionVersion: "pdf-v1"
      }
    : await generateTemplateFromPrompt({
        prompt,
        baseTemplate: template,
        sourceDesignPages
      });

  const updatedTemplate = updateTemplate(templateId, {
    updates: {
      editableRegions: promptResult.editableRegions,
      regionDetectionVersion: promptResult.regionDetectionVersion || "ai-v1"
    }
  });

  if (!updatedTemplate) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  res.json({
    template: updatedTemplate,
    snapshot: createCatalogResponse()
  });
});

app.delete("/api/templates/:templateId", (req, res) => {
  const templateId = String(req.params.templateId || "").trim();
  const template = getTemplateById(templateId);

  if (!template) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  if (template.kind !== "custom") {
    res.status(400).json({ error: "Only custom templates can be deleted" });
    return;
  }

  const snapshot = getCatalogSnapshot();
  const versionUsage = (snapshot.versions || [])
    .filter((version) => version?.catalog?.templateId === templateId)
    .map((version) => version.versionLabel);
  const libraryUsage = (getCatalogLibrarySnapshot().items || [])
    .filter((item) => item.templateId === templateId)
    .map((item) => item.title);

  if (versionUsage.length || libraryUsage.length) {
    const versionText = versionUsage.length ? `versions ${versionUsage.join(", ")}` : "";
    const libraryText = libraryUsage.length ? `catalogs ${libraryUsage.join(", ")}` : "";
    const joiner = versionText && libraryText ? " and " : "";
    res.status(409).json({
      error: `Template is currently used by ${versionText}${joiner}${libraryText}. Switch those items to another template before deleting it.`
    });
    return;
  }

  const deleted = deleteTemplate(templateId);
  if (!deleted) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  res.json({
    deletedTemplateId: templateId,
    snapshot: createCatalogResponse()
  });
});

app.post("/api/templates/:templateId/publish", upload.fields([
  { name: "page1Background", maxCount: 1 },
  { name: "page2Background", maxCount: 1 },
  { name: "heroPlaceholder", maxCount: 1 }
]), (req, res) => {
  let updates = {};

  if (req.body?.updates) {
    try {
      updates = JSON.parse(req.body.updates);
    } catch (error) {
      res.status(400).json({ error: "Template updates must be valid JSON" });
      return;
    }
  }

  const files = req.files || {};
  const page1File = Array.isArray(files.page1Background) ? files.page1Background[0] : null;
  const page2File = Array.isArray(files.page2Background) ? files.page2Background[0] : null;
  const heroPlaceholderFile = Array.isArray(files.heroPlaceholder) ? files.heroPlaceholder[0] : null;

  const template = updateTemplate(req.params.templateId, {
    updates,
    page1File,
    page2File,
    heroPlaceholderFile
  });

  if (!template) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  res.json({
    template,
    snapshot: createCatalogResponse()
  });
});

app.get("/api/catalog/version/:versionId", (req, res) => {
  const version = getVersionById(req.params.versionId);
  if (!version) {
    res.status(404).json({ error: "Version not found" });
    return;
  }
  res.json({
    version: {
      ...version,
      layoutIssues: getPrintLayoutIssues(version)
    }
  });
});

app.post("/api/catalog/prompt", upload.single("attachment"), async (req, res) => {
  const rawPrompt = String(req.body.prompt || "").trim();
  const prompt = rawPrompt || (req.file ? "Apply changes from the uploaded attachment." : "");
  const parentVersionId = req.body.parentVersionId || undefined;

  if (!prompt) {
    res.status(400).json({ error: "Prompt is required" });
    return;
  }

  const snapshot = getCatalogSnapshot();
  const contextVersion = parentVersionId ? getVersionById(parentVersionId) : snapshot.workingVersion;
  const fileMeta = saveUploadedFile(req.file);
  const attachmentText = parseAttachmentText(fileMeta);
  const attachmentOperations = parseAttachmentOperations(fileMeta);
  const hasImage = isImageAttachment(fileMeta);

  const parsed = await parsePromptToOperations({
    prompt,
    attachmentText,
    currentCatalog: contextVersion?.catalog || snapshot.workingVersion.catalog,
    hasImage
  });

  parsed.operations = mergeOperations(attachmentOperations, parsed.operations);

  if (!parsed.operations.length) {
    res.status(422).json({
      error: "No supported changes were detected in this prompt. Try naming the section or the exact line to edit."
    });
    return;
  }

  const layoutOperations = parsed.operations.filter(
    (operation) => operation.type === "tighten_layout" || operation.type === "loosen_layout"
  );
  const translationOperation = parsed.operations.find((operation) => operation.type === "translate_catalog");
  if (translationOperation
    && !isAiConfigured()
    && !hasBuiltInCatalogTranslation(translationOperation.language)) {
    res.status(503).json({
      error: `Translation to ${translationOperation.language} requires a configured translation service. Add a valid OPENAI_API_KEY to the local .env file and restart the API.`
    });
    return;
  }

  let promptWarning = null;
  let draft = createDraftFromOperations({
    operations: parsed.operations,
    summary: parsed.summary || prompt,
    parentVersionId,
    attachmentMeta: fileMeta,
    deferLayoutAdjustments: Boolean(translationOperation && layoutOperations.length)
  });

  if (translationOperation) {
    try {
      const translatedCatalog = await translateCatalog(draft.catalog, translationOperation.language || "Hindi");
      if (layoutOperations.length) {
        applyLayoutOperationsToCatalog(translatedCatalog, layoutOperations);
      } else if (getPrintLayoutIssues({ catalog: translatedCatalog }).length > 0) {
        applyLayoutOperationsToCatalog(translatedCatalog, [{ type: "tighten_layout" }]);
      }
      draft = replaceCatalogContent(draft.id, translatedCatalog, `Translated to ${translatedCatalog.language}`) || draft;
    } catch (error) {
      discardDraftVersion(draft.id);
      res.status(502).json({
        error: error?.message || "Translation failed; no draft was created."
      });
      return;
    }
  }

  res.json({
    parsed,
    draftVersion: draft,
    warning: promptWarning,
    snapshot: createCatalogResponse()
  });
});

app.post("/api/catalog/version/:versionId/manual-update", upload.single("heroImage"), (req, res) => {
  const parentVersion = getVersionById(req.params.versionId);

  if (!parentVersion) {
    res.status(404).json({ error: "Version not found" });
    return;
  }

  let updates = {};
  if (req.body?.updates) {
    try {
      updates = JSON.parse(req.body.updates);
    } catch (_error) {
      res.status(400).json({ error: "Updates must be valid JSON" });
      return;
    }
  }

  const catalog = JSON.parse(JSON.stringify(parentVersion.catalog));
  const editableRegionKey = typeof updates.editableRegionKey === "string"
    ? updates.editableRegionKey.replace(/^editable:/, "").trim()
    : "";
  const hasEditableRegionUpdate = Boolean(editableRegionKey);
  let savedImage = null;

  if (typeof updates.title === "string") {
    catalog.title = updates.title.trim() || catalog.title;
  }

  if (typeof updates.machineCategory === "string") {
    catalog.machineCategory = updates.machineCategory.trim() || catalog.machineCategory;
  }

  if (typeof updates.badge === "string") {
    catalog.badge = updates.badge.trim() || catalog.badge;
  }

  if (typeof updates.featuresText === "string") {
    catalog.features = normalizeLineItems(updates.featuresText);
  }

  if (typeof updates.standardAccessoriesText === "string") {
    catalog.standardAccessories = normalizeLineItems(updates.standardAccessoriesText);
  }

  if (typeof updates.optionalAccessoriesText === "string") {
    catalog.optionalAccessories = normalizeLineItems(updates.optionalAccessoriesText);
  }

  if (req.file && isImageAttachment(req.file)) {
    savedImage = saveUploadedFile(req.file);
  }

  if (hasEditableRegionUpdate) {
    if (!catalog.editableRegionOverrides || typeof catalog.editableRegionOverrides !== "object" || Array.isArray(catalog.editableRegionOverrides)) {
      catalog.editableRegionOverrides = {};
    }

    const currentRegionOverride = catalog.editableRegionOverrides[editableRegionKey]
      && typeof catalog.editableRegionOverrides[editableRegionKey] === "object"
      && !Array.isArray(catalog.editableRegionOverrides[editableRegionKey])
      ? catalog.editableRegionOverrides[editableRegionKey]
      : {};
    const nextRegionOverride = {
      ...currentRegionOverride,
      deleted: false
    };

    if (typeof updates.editableRegionText === "string") {
      nextRegionOverride.content = updates.editableRegionText;
    }

    if (savedImage?.publicPath) {
      nextRegionOverride.imageSrc = savedImage.publicPath;
    }

    catalog.editableRegionOverrides[editableRegionKey] = nextRegionOverride;
  } else if (savedImage?.publicPath) {
    catalog.heroOverlayImage = savedImage.publicPath || catalog.heroOverlayImage;
  }

  if (updates.autoFit !== false) {
    applyLayoutOperationsToCatalog(catalog, [{ type: "tighten_layout" }]);
  }

  const draftVersion = createDraftFromCatalog({
    catalog,
    parentVersionId: parentVersion.id,
    summary: String(updates.summary || "Edited in visual editor").trim() || "Edited in visual editor",
    operations: [{ type: "manual_canvas_edit", section: updates.sectionKey || null }]
  });

  if (!draftVersion) {
    res.status(400).json({ error: "Unable to create updated draft" });
    return;
  }

  res.json({
    draftVersion,
    snapshot: createCatalogResponse()
  });
});

app.post("/api/catalog/version/:versionId/apply-template", (req, res) => {
  const parentVersion = getVersionById(req.params.versionId);
  const templateId = String(req.body?.templateId || "").trim();

  if (!parentVersion) {
    res.status(404).json({ error: "Version not found" });
    return;
  }

  if (!templateId) {
    res.status(400).json({ error: "Template is required" });
    return;
  }

  const template = getTemplateById(templateId);
  if (!template) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  const catalog = JSON.parse(JSON.stringify(parentVersion.catalog));
  catalog.templateId = template.id;
  catalog.layoutSettings = {
    ...(catalog.layoutSettings || {}),
    fitLevel: 0
  };

  if (getPrintLayoutIssues({ catalog }).length > 0) {
    applyLayoutOperationsToCatalog(catalog, [{ type: "tighten_layout" }]);
  }

  const draftVersion = createDraftFromCatalog({
    catalog,
    parentVersionId: parentVersion.id,
    summary: `Applied template ${template.name}`,
    operations: [{ type: "apply_template", templateId: template.id }]
  });

  if (!draftVersion) {
    res.status(400).json({ error: "Unable to apply template" });
    return;
  }

  res.json({
    draftVersion,
    snapshot: createCatalogResponse()
  });
});

app.post("/api/catalog/version/:versionId/approve", (req, res) => {
  const approved = approveVersion(req.params.versionId);
  if (!approved) {
    res.status(404).json({ error: "Version not found" });
    return;
  }

  res.json({
    approvedVersion: approved,
    snapshot: createCatalogResponse()
  });
});

app.get("/api/catalog/version/:versionId/export", async (req, res) => {
  const version = getVersionById(req.params.versionId);
  if (!version) {
    res.status(404).json({ error: "Version not found" });
    return;
  }

  const layoutIssues = getPrintLayoutIssues(version);
  if (layoutIssues.length > 0) {
    res.status(409).json({
      error: "Catalog content exceeds the current print template",
      issues: layoutIssues
    });
    return;
  }

  try {
    const filePath = await exportCatalogVersion(version);
    res.download(filePath, `${version.catalog.title.replace(/\s+/g, "-").toLowerCase()}-${version.versionLabel}.pdf`);
  } catch (error) {
    console.error("PDF export failed", error);
    res.status(500).json({
      error: "Unable to export PDF right now"
    });
  }
});

if (fs.existsSync(legacyPreTemplateDir)) {
  app.use("/legacy-pre-template", express.static(legacyPreTemplateDir, {
    setHeaders(res, filePath) {
      if (path.basename(filePath) === "index.html") {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
      }
    }
  }));
}

const webDist = path.join(projectRoot, "apps", "web", "dist");
if (fs.existsSync(webDist)) {
  app.use((req, res, next) => {
    if (req.path === "/" || req.path === "/index.html") {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }
    next();
  });

  app.use(express.static(webDist, {
    setHeaders(res, filePath) {
      if (path.basename(filePath) === "index.html") {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
      }
    }
  }));
  app.get("*", (_req, res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.sendFile(path.join(webDist, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Catalog POC API listening on http://localhost:${port}`);
});
