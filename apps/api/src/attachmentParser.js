import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";

const textLikeExtensions = new Set([".txt", ".md", ".json", ".csv"]);
const catalogSectionTitles = new Set([
  "general",
  "capacity",
  "spindle",
  "axes",
  "tooling",
  "tailstock",
  "hydraulic system",
  "overall",
  "machine features",
  "standard accessories",
  "optional accessories"
]);

function normalizeCell(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function readWorkbookRows(filePath) {
  const workbook = XLSX.readFile(filePath);
  const textBlocks = [];
  const operations = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      defval: ""
    });

    const lines = [];
    let currentSection = "";

    for (const row of rows) {
      const cells = row.map(normalizeCell);
      const nonEmpty = cells.filter(Boolean);
      if (!nonEmpty.length) {
        continue;
      }

      lines.push(nonEmpty.join(" | "));

      if (nonEmpty.length === 1) {
        const candidate = nonEmpty[0].toLowerCase();
        if (catalogSectionTitles.has(candidate)) {
          currentSection = nonEmpty[0];
        }
        continue;
      }

      const value = nonEmpty[nonEmpty.length - 1];
      const label = nonEmpty[nonEmpty.length - 2];
      const labelKey = label.toLowerCase();
      const sectionKey = currentSection.toLowerCase();

      if (!value || !label) {
        continue;
      }

      if (sectionKey === "machine features") {
        operations.push({ type: "add_feature", value: label });
        continue;
      }

      if (sectionKey === "standard accessories") {
        operations.push({ type: "add_standard_accessory", value: label });
        continue;
      }

      if (sectionKey === "optional accessories") {
        operations.push({ type: "add_optional_accessory", value: label });
        continue;
      }

      if (labelKey === "title") {
        operations.push({ type: "set_title", value });
        continue;
      }

      if (labelKey === "machine category") {
        operations.push({ type: "set_machine_category", value });
        continue;
      }

      if (labelKey === "badge") {
        operations.push({ type: "set_badge", value });
        continue;
      }

      if (labelKey === "language") {
        operations.push({ type: "translate_catalog", language: value });
        continue;
      }

      operations.push({
        type: "update_spec",
        label,
        value
      });
    }

    textBlocks.push(`Sheet: ${sheetName}\n${lines.join("\n")}`);
  }

  return {
    text: textBlocks.join("\n\n"),
    operations
  };
}

export function parseAttachmentText(fileMeta) {
  if (!fileMeta) {
    return "";
  }

  const ext = path.extname(fileMeta.originalName || fileMeta.storedPath).toLowerCase();

  if (textLikeExtensions.has(ext)) {
    return fs.readFileSync(fileMeta.storedPath, "utf8");
  }

  if (ext === ".xlsx" || ext === ".xls") {
    return readWorkbookRows(fileMeta.storedPath).text;
  }

  return "";
}

export function parseAttachmentOperations(fileMeta) {
  if (!fileMeta) {
    return [];
  }

  const ext = path.extname(fileMeta.originalName || fileMeta.storedPath).toLowerCase();
  if (ext === ".xlsx" || ext === ".xls") {
    return readWorkbookRows(fileMeta.storedPath).operations;
  }

  return [];
}

export function isImageAttachment(fileMeta) {
  return Boolean(fileMeta?.mimeType?.startsWith("image/"));
}
