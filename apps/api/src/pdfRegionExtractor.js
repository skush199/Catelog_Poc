import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile, spawnSync } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bundledPythonPath = path.join(
  os.homedir(),
  ".cache",
  "codex-runtimes",
  "codex-primary-runtime",
  "dependencies",
  "python",
  "python.exe"
);
const projectVenvPythonCandidates = [
  path.join(process.cwd(), ".venv", "bin", "python3"),
  path.join(process.cwd(), ".venv", "bin", "python"),
  path.join(process.cwd(), ".venv", "Scripts", "python.exe")
];
const extractorScriptPath = path.join(__dirname, "extract_pdf_regions.py");

function resolvePythonExecutable() {
  if (process.env.PYTHON_EXECUTABLE && fs.existsSync(process.env.PYTHON_EXECUTABLE)) {
    return process.env.PYTHON_EXECUTABLE;
  }

  if (fs.existsSync(bundledPythonPath)) {
    return bundledPythonPath;
  }

  for (const candidate of projectVenvPythonCandidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  const locator = process.platform === "win32" ? "where.exe" : "which";
  const candidates = process.platform === "win32" ? ["python", "py"] : ["python3", "python"];

  for (const candidate of candidates) {
    const result = spawnSync(locator, [candidate], {
      encoding: "utf8",
      windowsHide: true
    });

    if (result.status === 0) {
      const discoveredPath = String(result.stdout || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find(Boolean);

      if (discoveredPath) {
        return discoveredPath;
      }
    }
  }

  return process.platform === "win32" ? "python" : "python3";
}

export async function extractEditableRegionsFromPdf(pdfPath, { maxPages = 2 } = {}) {
  if (!pdfPath || !fs.existsSync(pdfPath)) {
    return null;
  }

  const pythonExecutable = resolvePythonExecutable();
  const { stdout } = await execFileAsync(
    pythonExecutable,
    [extractorScriptPath, pdfPath, String(maxPages)],
    {
      windowsHide: true,
      maxBuffer: 20 * 1024 * 1024
    }
  );

  const parsed = JSON.parse(String(stdout || "{}").trim() || "{}");
  const editableRegions = Array.isArray(parsed.editableRegions) ? parsed.editableRegions : [];

  if (!editableRegions.length) {
    return null;
  }

  return {
    pageSize: parsed.pageSize || null,
    editableRegions
  };
}
