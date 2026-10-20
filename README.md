# Catalog AI POC

Prompt-driven catalog editing POC for machine brochure updates. The app demonstrates how a business user can request changes in plain language, generate a draft version, review the updated catalog, approve it, and export a refreshed PDF.

## What is included

- React + Vite frontend
- Express API backend
- Sample 2-page catalog template based on the provided J 300 LM brochure
- Prompt-to-operations parsing using OpenAI with a local fallback parser
- Version history with draft, approved, and superseded states
- Approval workflow
- PDF export
- Optional attachment support for text, CSV, Excel, and images
- Hindi translation support for the seeded sample catalog
- Workspace reset action for repeat demos

## Project structure

- `apps/web`: user interface
- `apps/api`: API, version store, prompt parsing, export logic
- `apps/api/assets/templates/j300`: sample template backgrounds
- `apps/api/data`: runtime data store for versions and uploads
- `output/exports`: generated PDFs

## Setup

1. Install dependencies:

```powershell
pnpm install
```

2. Configure environment:

- Copy `.env.example` to `.env`
- Set `OPENAI_API_KEY` if you want direct OpenAI access
- Or set `OPENAI_ENV_FALLBACK_PATH` to an existing `.env` file that already contains `OPENAI_API_KEY`
- `HINDI_FONT_PATH` is optional because the API already includes a bundled Devanagari font fallback
- `PDF_BROWSER_EXECUTABLE_PATH` is optional. Set it only if your server should use a specific Chrome or Chromium binary instead of Puppeteer's bundled browser.

3. Start the app:

```powershell
pnpm dev
```

4. Open:

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001`

For a simple demo-only run after building the web app, the backend can also serve the compiled frontend:

```powershell
pnpm build
pnpm start
```

Then open `http://localhost:3001`.

## DigitalOcean notes

- Run `pnpm install` on the server so the API can install its dependencies, including Puppeteer's browser runtime used for PDF export.
- Run `pnpm build` before `pnpm start` so the backend can serve the compiled frontend from `apps/web/dist`.
- If your server already has Chrome or Chromium installed and you do not want Puppeteer's bundled browser, set `PDF_BROWSER_EXECUTABLE_PATH` to that binary path.
- If Chromium launch fails on a minimal Linux image, install the usual headless browser libraries for Ubuntu and retry. The app will log browser export failures and fall back to the legacy PDF renderer, but the browser path is strongly recommended for custom template fidelity.

## Suggested demo flow

1. Open the sample catalog workspace.
2. Enter a prompt such as:
   - `Update maximum spindle speed to 4500 rpm and change standard chuck size to 200 mm.`
   - `Add coolant auto-monitor under optional accessories.`
   - `Create a Hindi version of this catalog.`
3. Review the detected operations and preview.
4. Approve the draft.
5. Export the updated PDF.
6. Use `Reset workspace` to return to the seed state for the next run.

## Notes

- The current POC is intentionally template-driven. It is not a generic arbitrary PDF editor.
- The seeded template is limited to one catalog format.
- Attachment parsing is strongest for structured text and Excel-based change documents.
- The production roadmap from the scope document still applies for multi-template support, richer approvals, user identity, design-system sync, and stronger print automation.
