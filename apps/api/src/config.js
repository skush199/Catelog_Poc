import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const apiRoot = path.resolve(__dirname, "..");
export const projectRoot = path.resolve(apiRoot, "..", "..");
export const dataRoot = path.join(apiRoot, "data");
export const versionsRoot = path.join(dataRoot, "versions");
export const uploadsRoot = path.join(dataRoot, "uploads");
export const templatesRoot = path.join(dataRoot, "templates");
export const templateAssetsRoot = path.join(dataRoot, "template-assets");
export const catalogLibraryFilesRoot = path.join(dataRoot, "catalog-library-files");
export const exportsRoot = path.join(projectRoot, "output", "exports");
export const assetsRoot = path.join(apiRoot, "assets", "templates", "j300");
export const localEnvPath = path.join(projectRoot, ".env");

if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
}

const isWindows = process.platform === "win32";

export const samplePdfCandidates = [
  process.env.SAMPLE_CATALOG_PDF,
  ...(isWindows ? ["C:\\Users\\Dell\\Desktop\\J 300 LM (1).pdf"] : [])
].filter(Boolean);

export const sourceByteEnvCandidates = [
  process.env.OPENAI_ENV_FALLBACK_PATH,
  ...(isWindows ? ["C:\\Users\\Dell\\Downloads\\sourceByte_ai_backend 1 (1)\\sourceByte_ai_backend\\.env"] : [])
].filter(Boolean);

export const devanagariFontCandidates = [
  process.env.HINDI_FONT_PATH,
  path.join(apiRoot, "assets", "fonts", "NotoSansDevanagari-Regular.ttf"),
  ...(isWindows ? ["C:\\Windows\\Fonts\\Nirmala.ttc"] : [])
].filter(Boolean);

export const kannadaFontCandidates = [
  process.env.KANNADA_FONT_PATH,
  path.join(apiRoot, "assets", "fonts", "NotoSansKannada-Regular.ttf"),
  ...(isWindows ? ["C:\\Windows\\Fonts\\Nirmala.ttc"] : [])
].filter(Boolean);

export const arabicFontCandidates = [
  process.env.ARABIC_FONT_PATH,
  ...(isWindows ? [
    "C:\\Windows\\Fonts\\arial.ttf",
    "C:\\Windows\\Fonts\\segoeui.ttf"
  ] : [])
].filter(Boolean);

export const universalUnicodeFontCandidates = [
  process.env.UNICODE_FONT_PATH,
  ...(isWindows ? [
    "C:\\Windows\\Fonts\\Nirmala.ttc",
    "C:\\Windows\\Fonts\\arial.ttf",
    "C:\\Windows\\Fonts\\segoeui.ttf"
  ] : [])
].filter(Boolean);

export function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function readEnvValue(envPath, key) {
  if (!envPath || !fs.existsSync(envPath)) {
    return null;
  }

  const envLines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of envLines) {
    if (!line || line.trim().startsWith("#")) {
      continue;
    }

    const [rawKey, ...rest] = line.split("=");
    if (rawKey?.trim() === key) {
      return rest.join("=").trim();
    }
  }

  return null;
}
