import fs from "node:fs";
import path from "node:path";
import { v4 as uuid } from "uuid";
import {
  ensureDirectory,
  versionsRoot,
  uploadsRoot,
  exportsRoot
} from "./config.js";
import { getPrintLayoutIssues } from "./pdfExporter.js";
import { catalogTemplate, initialCatalog } from "./sampleCatalog.js";
import {
  getTemplateById,
  initializeTemplateStore,
  listTemplates
} from "./templateStore.js";

const statePath = path.join(versionsRoot, "state.json");

function versionFilePath(versionId) {
  return path.join(versionsRoot, `${versionId}.json`);
}

function nowIso() {
  return new Date().toISOString();
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeLookup(text) {
  return slugify(text).replace(/\bo\b/g, "");
}

function normalizeListValue(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function ensureLayoutSettings(catalog) {
  if (!catalog.layoutSettings || typeof catalog.layoutSettings !== "object") {
    catalog.layoutSettings = { fitLevel: 0 };
  }

  if (!Number.isFinite(catalog.layoutSettings.fitLevel)) {
    catalog.layoutSettings.fitLevel = 0;
  }

  catalog.layoutSettings.fitLevel = Math.max(0, Math.min(4, Math.trunc(catalog.layoutSettings.fitLevel)));
  return catalog.layoutSettings;
}

function autoFitCatalogToTemplate(catalog) {
  const layoutSettings = ensureLayoutSettings(catalog);

  if (getPrintLayoutIssues({ catalog }).length > 0) {
    tightenLayoutUntilFit(catalog, layoutSettings);
  }

  return catalog;
}

function buildCatalogSeed(templateId, overrides = {}) {
  const catalog = deepClone(initialCatalog);

  catalog.catalogId = overrides.catalogId || uuid();
  catalog.templateId = templateId;
  catalog.title = String(overrides.title || catalog.title).trim() || catalog.title;
  catalog.machineCategory = String(overrides.machineCategory || catalog.machineCategory).trim() || catalog.machineCategory;
  catalog.language = String(overrides.language || catalog.language || "English").trim() || "English";
  catalog.heroOverlayImage = null;
  catalog.editableRegionOverrides = overrides.editableRegionOverrides && typeof overrides.editableRegionOverrides === "object" && !Array.isArray(overrides.editableRegionOverrides)
    ? deepClone(overrides.editableRegionOverrides)
    : {};
  catalog.layoutSettings = { fitLevel: 0 };

  return autoFitCatalogToTemplate(catalog);
}

function seedWorkspace({
  catalog,
  summary = "Initial seeded sample catalog from J 300 LM brochure"
}) {
  const seedVersion = buildVersionRecord({
    versionNumber: 1,
    status: "approved",
    summary,
    language: catalog.language || "English",
    catalog,
    operations: []
  });

  writeVersion(seedVersion);
  writeState({
    catalogId: catalog.catalogId,
    currentApprovedVersionId: seedVersion.id,
    latestVersionNumber: 1,
    versionIds: [seedVersion.id]
  });

  return seedVersion;
}

function listContainsValue(list, value) {
  const wanted = slugify(normalizeListValue(value));
  return list.some((item) => slugify(normalizeListValue(item)) === wanted);
}

function removeListValue(list, value) {
  const wanted = slugify(normalizeListValue(value));
  const index = list.findIndex((item) => slugify(normalizeListValue(item)) === wanted);
  if (index >= 0) {
    list.splice(index, 1);
  }
}

function replaceListValue(list, oldValue, newValue) {
  const wanted = slugify(normalizeListValue(oldValue));
  const index = list.findIndex((item) => slugify(normalizeListValue(item)) === wanted);
  if (index >= 0) {
    list[index] = normalizeListValue(newValue);
    return true;
  }

  return false;
}

function resolveTargetList(catalog, sectionKey) {
  if (sectionKey && Array.isArray(catalog[sectionKey])) {
    return catalog[sectionKey];
  }

  const overflowIssue = getPrintLayoutIssues({ catalog }).find((issue) => issue.type === "column_overflow");
  if (overflowIssue) {
    const template = getTemplateById(catalog.templateId) || catalogTemplate;
    const matchingColumn = template.page1.columns.find((column) => column.label === overflowIssue.section);
    if (matchingColumn && Array.isArray(catalog[matchingColumn.key])) {
      return catalog[matchingColumn.key];
    }
  }

  const candidateKeys = ["optionalAccessories", "standardAccessories", "features"];
  const nonEmptyKey = candidateKeys.find((key) => Array.isArray(catalog[key]) && catalog[key].length > 0);
  return nonEmptyKey ? catalog[nonEmptyKey] : null;
}

function removeListLines(catalog, sectionKey, count = 1) {
  const targetList = resolveTargetList(catalog, sectionKey);
  if (!targetList?.length) {
    return false;
  }

  for (let index = 0; index < count && targetList.length > 0; index += 1) {
    targetList.pop();
  }

  return true;
}

function tightenLayoutUntilFit(catalog, layoutSettings) {
  layoutSettings.fitLevel = Math.min(4, layoutSettings.fitLevel + 1);

  while (layoutSettings.fitLevel < 4 && getPrintLayoutIssues({ catalog }).length > 0) {
    layoutSettings.fitLevel += 1;
  }
}

export function applyLayoutOperationsToCatalog(catalog, operations = []) {
  const layoutSettings = ensureLayoutSettings(catalog);

  for (const operation of operations) {
    switch (operation.type) {
      case "tighten_layout":
        tightenLayoutUntilFit(catalog, layoutSettings);
        break;
      case "loosen_layout":
        layoutSettings.fitLevel = Math.max(0, layoutSettings.fitLevel - 1);
        break;
      default:
        break;
    }
  }

  return catalog;
}

function buildVersionRecord({
  versionNumber,
  status,
  summary,
  language,
  catalog,
  operations = [],
  parentVersionId = null
}) {
  return {
    id: uuid(),
    versionNumber,
    versionLabel: `v${versionNumber}`,
    status,
    summary,
    language,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    parentVersionId,
    operations,
    catalog
  };
}

function writeVersion(version) {
  fs.writeFileSync(versionFilePath(version.id), JSON.stringify(version, null, 2));
}

function readVersion(versionId) {
  const filePath = versionFilePath(versionId);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readState() {
  return JSON.parse(fs.readFileSync(statePath, "utf8"));
}

function writeState(state) {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function clearDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  for (const entry of fs.readdirSync(dirPath)) {
    const entryPath = path.join(dirPath, entry);
    const stat = fs.statSync(entryPath);
    if (stat.isDirectory()) {
      fs.rmSync(entryPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(entryPath);
    }
  }
}

function listAllVersions() {
  const state = readState();
  return state.versionIds
    .map((versionId) => readVersion(versionId))
    .filter(Boolean)
    .sort((a, b) => b.versionNumber - a.versionNumber);
}

function updateSpecByLabel(catalog, label, value) {
  const wanted = normalizeLookup(label);

  for (const section of catalog.specSections) {
    for (const item of section.items) {
      if (normalizeLookup(item.label) === wanted) {
        item.value = value;
        return true;
      }
    }
  }

  for (const section of catalog.specSections) {
    for (const item of section.items) {
      if (normalizeLookup(item.label).includes(wanted) || wanted.includes(normalizeLookup(item.label))) {
        item.value = value;
        return true;
      }
    }
  }

  return false;
}

function setListValue(list, index, value) {
  const normalizedValue = normalizeListValue(value);
  if (index >= 0 && index < list.length) {
    list[index] = normalizedValue;
  } else {
    list.push(normalizedValue);
  }
}

export function initializeStore(force = false, options = {}) {
  initializeTemplateStore();
  ensureDirectory(versionsRoot);
  ensureDirectory(uploadsRoot);
  ensureDirectory(exportsRoot);

  if (!force && fs.existsSync(statePath)) {
    return;
  }

  const seedCatalog = options.catalog
    ? deepClone(options.catalog)
    : buildCatalogSeed(initialCatalog.templateId, initialCatalog);

  seedWorkspace({
    catalog: seedCatalog,
    summary: options.summary || "Initial seeded sample catalog from J 300 LM brochure"
  });
}

export function resetStore() {
  clearDirectory(versionsRoot);
  clearDirectory(uploadsRoot);
  clearDirectory(exportsRoot);
  initializeStore(true);
  return getCatalogSnapshot();
}

export function replaceVersionHistoryWithApprovedCatalog({
  catalog,
  summary = "Approved catalog retained as v1; previous version history removed"
}) {
  if (!catalog || typeof catalog !== "object") {
    throw new Error("A catalog is required to replace the version history");
  }

  clearDirectory(versionsRoot);
  seedWorkspace({
    catalog: deepClone(catalog),
    summary
  });

  return getCatalogSnapshot();
}

export function getCatalogSnapshot() {
  const state = readState();
  const versions = listAllVersions();
  const approvedVersion = readVersion(state.currentApprovedVersionId);
  const latestDraft = versions.find((version) => version.status === "draft") ?? approvedVersion;
  const activeTemplateId = latestDraft?.catalog?.templateId || approvedVersion?.catalog?.templateId || catalogTemplate.id;
  const activeTemplate = getTemplateById(activeTemplateId) || catalogTemplate;

  return {
    template: activeTemplate,
    templates: listTemplates(),
    approvedVersion,
    workingVersion: latestDraft,
    versions
  };
}

export function getVersionById(versionId) {
  return readVersion(versionId);
}

export function discardDraftVersion(versionId) {
  const state = readState();
  const version = readVersion(versionId);
  if (!version || version.status !== "draft") {
    return false;
  }

  const versionPath = versionFilePath(versionId);
  if (fs.existsSync(versionPath)) {
    fs.unlinkSync(versionPath);
  }

  const remainingVersionIds = state.versionIds.filter((id) => id !== versionId);
  const latestVersionNumber = remainingVersionIds.reduce((latest, id) => {
    const remainingVersion = readVersion(id);
    return Math.max(latest, Number(remainingVersion?.versionNumber || 0));
  }, 0);

  writeState({
    ...state,
    latestVersionNumber,
    versionIds: remainingVersionIds
  });
  return true;
}

export function saveUploadedFile(file) {
  if (!file) {
    return null;
  }

  const ext = path.extname(file.originalname || "") || ".bin";
  const storedName = `${Date.now()}-${uuid()}${ext}`;
  const storedPath = path.join(uploadsRoot, storedName);
  fs.writeFileSync(storedPath, file.buffer);

  return {
    originalName: file.originalname,
    mimeType: file.mimetype,
    storedName,
    storedPath,
    publicPath: `/api/uploads/${storedName}`
  };
}

export function createDraftFromOperations({
  operations,
  summary,
  parentVersionId,
  attachmentMeta = null,
  deferLayoutAdjustments = false
}) {
  const state = readState();
  const parent = readVersion(parentVersionId || state.currentApprovedVersionId);
  const catalog = deepClone(parent.catalog);
  const layoutSettings = ensureLayoutSettings(catalog);
  let language = catalog.language || "English";

  for (const operation of operations) {
    switch (operation.type) {
      case "set_title":
        catalog.title = operation.value;
        break;
      case "set_machine_category":
        catalog.machineCategory = operation.value;
        break;
      case "update_spec":
        updateSpecByLabel(catalog, operation.label, operation.value);
        break;
      case "add_feature":
        if (!listContainsValue(catalog.features, operation.value)) {
          catalog.features.push(normalizeListValue(operation.value));
        }
        break;
      case "replace_feature":
        setListValue(catalog.features, operation.index ?? -1, operation.value);
        break;
      case "remove_feature":
        removeListValue(catalog.features, operation.value);
        break;
      case "add_standard_accessory":
        if (!listContainsValue(catalog.standardAccessories, operation.value)) {
          catalog.standardAccessories.push(normalizeListValue(operation.value));
        }
        break;
      case "replace_standard_accessory":
        setListValue(catalog.standardAccessories, operation.index ?? -1, operation.value);
        break;
      case "remove_standard_accessory":
        removeListValue(catalog.standardAccessories, operation.value);
        break;
      case "add_optional_accessory":
        if (!listContainsValue(catalog.optionalAccessories, operation.value)) {
          catalog.optionalAccessories.push(normalizeListValue(operation.value));
        }
        break;
      case "replace_optional_accessory":
        setListValue(catalog.optionalAccessories, operation.index ?? -1, operation.value);
        break;
      case "remove_optional_accessory":
        removeListValue(catalog.optionalAccessories, operation.value);
        break;
      case "replace_list_item":
        if (operation.sectionKey && Array.isArray(catalog[operation.sectionKey])) {
          replaceListValue(catalog[operation.sectionKey], operation.oldValue, operation.value);
        }
        break;
      case "remove_list_line":
        removeListLines(catalog, operation.sectionKey, operation.count ?? 1);
        break;
      case "tighten_layout":
        if (!deferLayoutAdjustments) {
          tightenLayoutUntilFit(catalog, layoutSettings);
        }
        break;
      case "loosen_layout":
        if (!deferLayoutAdjustments) {
          layoutSettings.fitLevel = Math.max(0, layoutSettings.fitLevel - 1);
        }
        break;
      case "set_badge":
        catalog.badge = operation.value;
        break;
      case "set_hero_overlay_image":
        if (attachmentMeta) {
          catalog.heroOverlayImage = attachmentMeta.publicPath;
        }
        break;
      case "translate_catalog":
        language = operation.language || language;
        catalog.language = language;
        break;
      default:
        break;
    }
  }

  const version = buildVersionRecord({
    versionNumber: state.latestVersionNumber + 1,
    status: "draft",
    summary,
    language,
    catalog,
    operations,
    parentVersionId: parent.id
  });

  writeVersion(version);
  writeState({
    ...state,
    latestVersionNumber: version.versionNumber,
    versionIds: [...state.versionIds, version.id]
  });

  return version;
}

export function createDraftFromCatalog({
  catalog,
  summary,
  parentVersionId,
  operations = []
}) {
  const state = readState();
  const parent = readVersion(parentVersionId || state.currentApprovedVersionId);

  if (!parent || !catalog) {
    return null;
  }

  const version = buildVersionRecord({
    versionNumber: state.latestVersionNumber + 1,
    status: "draft",
    summary,
    language: catalog.language || parent.language || "English",
    catalog,
    operations,
    parentVersionId: parent.id
  });

  writeVersion(version);
  writeState({
    ...state,
    latestVersionNumber: version.versionNumber,
    versionIds: [...state.versionIds, version.id]
  });

  return version;
}

export function replaceCatalogContent(versionId, catalog, summarySuffix = "Content translated") {
  const version = readVersion(versionId);
  if (!version) {
    return null;
  }

  version.catalog = catalog;
  version.language = catalog.language || version.language;
  version.summary = `${version.summary} | ${summarySuffix}`;
  version.updatedAt = nowIso();
  writeVersion(version);
  return version;
}

export function approveVersion(versionId) {
  const state = readState();
  const versions = listAllVersions();
  const target = readVersion(versionId);
  if (!target) {
    return null;
  }

  for (const version of versions) {
    if (version.status === "approved") {
      version.status = version.id === target.id ? "approved" : "superseded";
      version.updatedAt = nowIso();
      writeVersion(version);
    }
  }

  target.status = "approved";
  target.updatedAt = nowIso();
  writeVersion(target);

  writeState({
    ...state,
    currentApprovedVersionId: target.id
  });

  return target;
}

export function createCatalogFromTemplate({
  templateId,
  title,
  machineCategory,
  language
}) {
  const template = getTemplateById(templateId);
  if (!template) {
    return null;
  }

  clearDirectory(versionsRoot);
  clearDirectory(uploadsRoot);
  clearDirectory(exportsRoot);

  initializeStore(true, {
    catalog: buildCatalogSeed(template.id, {
      title,
      machineCategory,
      language
    }),
    summary: `Catalog seeded from template ${template.name}`
  });

  return getCatalogSnapshot();
}

export function resetWorkspaceWithCatalogSeed({
  templateId = initialCatalog.templateId,
  title,
  machineCategory,
  language = "English",
  catalogId,
  summary
}) {
  clearDirectory(versionsRoot);
  clearDirectory(uploadsRoot);
  clearDirectory(exportsRoot);

  initializeStore(true, {
    catalog: buildCatalogSeed(templateId, {
      catalogId,
      title,
      machineCategory,
      language
    }),
    summary: summary || `Catalog seeded from ${title || "selected catalog"}`
  });

  return getCatalogSnapshot();
}
