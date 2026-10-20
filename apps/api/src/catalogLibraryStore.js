import fs from "node:fs";
import path from "node:path";
import { v4 as uuid } from "uuid";
import {
  catalogLibraryFilesRoot,
  dataRoot,
  ensureDirectory
} from "./config.js";
import { initialCatalog } from "./sampleCatalog.js";
import { getTemplateById } from "./templateStore.js";

const statePath = path.join(dataRoot, "catalog-library.json");

function nowIso() {
  return new Date().toISOString();
}

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function getSeedItems() {
  return [
    {
      id: "j300-lm",
      title: "J 300 LM",
      description: "Structured default machine catalog ready for prompt editing.",
      templateId: initialCatalog.templateId,
      language: "English",
      machineCategory: initialCatalog.machineCategory,
      kind: "structured",
      sourceType: "system",
      coverImage: "/api/assets/j300/page-1.png",
      sourcePdfUrl: null,
      createdAt: nowIso(),
      updatedAt: nowIso()
    }
  ];
}

function writeState(state) {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function readState() {
  return JSON.parse(fs.readFileSync(statePath, "utf8"));
}

function toPublicFilePath(fileName) {
  return `/api/catalog-library-files/${fileName}`;
}

function toSafeFileName(file) {
  const ext = path.extname(file?.originalname || "").toLowerCase() || ".pdf";
  return `${Date.now()}-${uuid()}${ext}`;
}

function ensureUniqueCatalogId(items, preferredId) {
  let candidateId = preferredId || uuid();
  let suffix = 2;

  while (items.some((item) => item.id === candidateId)) {
    candidateId = `${preferredId}-${suffix}`;
    suffix += 1;
  }

  return candidateId;
}

export function initializeCatalogLibraryStore(force = false) {
  ensureDirectory(catalogLibraryFilesRoot);

  if (!force && fs.existsSync(statePath)) {
    return;
  }

  writeState({
    activeCatalogId: "j300-lm",
    items: getSeedItems()
  });
}

export function getCatalogLibrarySnapshot() {
  initializeCatalogLibraryStore();
  return readState();
}

export function listCatalogLibraryItems() {
  return getCatalogLibrarySnapshot().items;
}

export function getCatalogLibraryItem(catalogId) {
  return listCatalogLibraryItems().find((item) => item.id === catalogId) || null;
}

export function setActiveCatalog(catalogId) {
  const state = readState();
  if (!state.items.some((item) => item.id === catalogId)) {
    return null;
  }

  state.activeCatalogId = catalogId;
  writeState(state);
  return getCatalogLibraryItem(catalogId);
}

export function addUploadedCatalogPdf(file) {
  initializeCatalogLibraryStore();

  const safeFileName = toSafeFileName(file);
  fs.writeFileSync(path.join(catalogLibraryFilesRoot, safeFileName), file.buffer);

  const title = String(file.originalname || "Imported Catalog")
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim() || "Imported Catalog";

  const nextItem = {
    id: slugify(title) || uuid(),
    title,
    description: "Uploaded PDF catalog staged for template selection and prompt-editing workflow.",
    templateId: initialCatalog.templateId,
    language: "English",
    machineCategory: initialCatalog.machineCategory,
    kind: "uploaded_pdf",
    sourceType: "pdf",
    coverImage: null,
    sourcePdfUrl: toPublicFilePath(safeFileName),
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  const state = readState();
  nextItem.id = ensureUniqueCatalogId(state.items, nextItem.id);
  state.items = [nextItem, ...state.items];
  writeState(state);
  return nextItem;
}

export function addCreatedCatalog({
  title,
  machineCategory,
  language = "English",
  templateId
}) {
  initializeCatalogLibraryStore();

  const template = getTemplateById(templateId);
  if (!template) {
    return null;
  }

  const trimmedTitle = String(title || "").trim() || "New Catalog";
  const nextItem = {
    id: slugify(trimmedTitle) || uuid(),
    title: trimmedTitle,
    description: `Catalog workspace created from template ${template.name}.`,
    templateId: template.id,
    language: String(language || "English").trim() || "English",
    machineCategory: String(machineCategory || initialCatalog.machineCategory).trim() || initialCatalog.machineCategory,
    kind: "template_catalog",
    sourceType: "template",
    coverImage: template.page1?.background || null,
    sourcePdfUrl: null,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  const state = readState();
  nextItem.id = ensureUniqueCatalogId(state.items, nextItem.id);
  state.activeCatalogId = nextItem.id;
  state.items = [nextItem, ...state.items];
  writeState(state);

  return nextItem;
}

export function resetCatalogLibraryStore() {
  ensureDirectory(catalogLibraryFilesRoot);

  if (fs.existsSync(catalogLibraryFilesRoot)) {
    for (const entry of fs.readdirSync(catalogLibraryFilesRoot)) {
      fs.unlinkSync(path.join(catalogLibraryFilesRoot, entry));
    }
  }

  initializeCatalogLibraryStore(true);
  return getCatalogLibrarySnapshot();
}
