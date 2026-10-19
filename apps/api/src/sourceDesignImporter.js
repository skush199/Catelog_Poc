import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile, spawnSync } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const popplerBinDir = path.join(
  os.homedir(),
  ".cache",
  "codex-runtimes",
  "codex-primary-runtime",
  "dependencies",
  "native",
  "poppler",
  "Library",
  "bin"
);
const bundledDependencyBinDir = path.join(
  os.homedir(),
  ".cache",
  "codex-runtimes",
  "codex-primary-runtime",
  "dependencies",
  "bin"
);

function isPdfFile(file) {
  const ext = path.extname(String(file?.originalname || "")).toLowerCase();
  return ext === ".pdf" || String(file?.mimetype || "").toLowerCase().includes("pdf");
}

function isImageFile(file) {
  return String(file?.mimetype || "").toLowerCase().startsWith("image/");
}

function resolvePopplerExecutable(name) {
  const candidates = process.platform === "win32"
    ? [
        path.join(popplerBinDir, `${name}.exe`),
        path.join(bundledDependencyBinDir, `${name}.exe`)
      ]
    : [
        path.join(bundledDependencyBinDir, name),
        `/usr/bin/${name}`,
        `/usr/local/bin/${name}`
      ];

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  const locator = process.platform === "win32" ? "where.exe" : "which";
  const result = spawnSync(locator, [name], {
    encoding: "utf8",
    windowsHide: true
  });

  if (result.status === 0) {
    const foundPath = String(result.stdout || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean);

    if (foundPath) {
      return foundPath;
    }
  }

  return null;
}

function parsePdfPageSize(pdfInfoText) {
  const match = String(pdfInfoText || "").match(/Page size:\s+([\d.]+)\s+x\s+([\d.]+)\s+pts/i);
  if (!match) {
    return null;
  }

  const width = Number.parseFloat(match[1]);
  const height = Number.parseFloat(match[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return null;
  }

  return { width, height };
}

function createImageFileFromBuffer(buffer, fileName) {
  return {
    originalname: fileName,
    mimetype: "image/png",
    buffer
  };
}

async function rasterizePdfSource(file, maxPages) {
  const pdfinfoExecutable = resolvePopplerExecutable("pdfinfo");
  const pdftoppmExecutable = resolvePopplerExecutable("pdftoppm");
  if (!pdfinfoExecutable || !pdftoppmExecutable) {
    return null;
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "catalog-template-import-"));
  const pdfPath = path.join(tempDir, "source.pdf");
  const outputPrefix = path.join(tempDir, "page");
  fs.writeFileSync(pdfPath, file.buffer);

  try {
    const [{ stdout: pdfInfoText }] = await Promise.all([
      execFileAsync(pdfinfoExecutable, [pdfPath], {
        windowsHide: true,
        maxBuffer: 10 * 1024 * 1024
      }),
      execFileAsync(
        pdftoppmExecutable,
        ["-png", "-r", "96", "-f", "1", "-l", String(maxPages), pdfPath, outputPrefix],
        {
          windowsHide: true,
          maxBuffer: 10 * 1024 * 1024
        }
      )
    ]);

    const pageFiles = fs.readdirSync(tempDir)
      .filter((entry) => /^page-\d+\.png$/i.test(entry))
      .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
      .slice(0, maxPages)
      .map((entry, index) => createImageFileFromBuffer(
        fs.readFileSync(path.join(tempDir, entry)),
        `source-page-${index + 1}.png`
      ));

    return {
      kind: "pdf",
      pageSize: parsePdfPageSize(pdfInfoText),
      pageFiles,
      promptImages: pageFiles
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

export async function prepareSourceDesignImport(file, { maxPages = 2 } = {}) {
  if (!file?.buffer) {
    return null;
  }

  if (isPdfFile(file)) {
    return rasterizePdfSource(file, maxPages);
  }

  if (isImageFile(file)) {
    return {
      kind: "image",
      pageSize: null,
      pageFiles: [file],
      promptImages: [file]
    };
  }

  return {
    kind: "source",
    pageSize: null,
    pageFiles: [],
    promptImages: []
  };
}
