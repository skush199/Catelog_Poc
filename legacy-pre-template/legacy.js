const promptSuggestions = [
  "Update maximum spindle speed to 4500 rpm and change standard chuck size to 200 mm.",
  "Add coolant auto-monitor under optional accessories and add machine health dashboard under machine features.",
  "Create a Kannada version of this catalog and fit the content within the template."
];

const state = {
  snapshot: null,
  selectedVersionId: null,
  lastParsed: null,
  busy: false,
  busyLabel: ""
};

const els = {
  messageBanner: document.getElementById("messageBanner"),
  selectedTemplateLabel: document.getElementById("selectedTemplateLabel"),
  restoreOriginalButton: document.getElementById("restoreOriginalButton"),
  promptForm: document.getElementById("promptForm"),
  promptInput: document.getElementById("promptInput"),
  promptSuggestions: document.getElementById("promptSuggestions"),
  attachmentInput: document.getElementById("attachmentInput"),
  attachmentNote: document.getElementById("attachmentNote"),
  applyPromptButton: document.getElementById("applyPromptButton"),
  parsedPanel: document.getElementById("parsedPanel"),
  detectedChangesCount: document.getElementById("detectedChangesCount"),
  detectedChangesList: document.getElementById("detectedChangesList"),
  versionCountLabel: document.getElementById("versionCountLabel"),
  versionsList: document.getElementById("versionsList"),
  approvedMeta: document.getElementById("approvedMeta"),
  approvedStatus: document.getElementById("approvedStatus"),
  approvedLayoutWarning: document.getElementById("approvedLayoutWarning"),
  approvedPreviewFrame: document.getElementById("approvedPreviewFrame"),
  selectedPreviewHeading: document.getElementById("selectedPreviewHeading"),
  selectedMeta: document.getElementById("selectedMeta"),
  selectedStatus: document.getElementById("selectedStatus"),
  selectedLayoutWarning: document.getElementById("selectedLayoutWarning"),
  selectedPreviewFrame: document.getElementById("selectedPreviewFrame")
};

const PRINT_PAGE_WIDTH = 595.276;

function setMessage(text = "", tone = "info") {
  if (!text) {
    els.messageBanner.textContent = "";
    els.messageBanner.className = "message-banner is-hidden";
    return;
  }

  els.messageBanner.textContent = text;
  els.messageBanner.className = "message-banner";

  if (tone === "warning") {
    els.messageBanner.style.borderColor = "rgba(175, 116, 0, 0.22)";
    els.messageBanner.style.background = "rgba(175, 116, 0, 0.08)";
    els.messageBanner.style.color = "#8a5a00";
  } else if (tone === "success") {
    els.messageBanner.style.borderColor = "rgba(15, 143, 88, 0.2)";
    els.messageBanner.style.background = "rgba(15, 143, 88, 0.08)";
    els.messageBanner.style.color = "#0f8f58";
  } else {
    els.messageBanner.style.borderColor = "rgba(181, 46, 51, 0.18)";
    els.messageBanner.style.background = "rgba(181, 46, 51, 0.08)";
    els.messageBanner.style.color = "#882028";
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleString("en-US");
}

function humanizeOperation(operation) {
  const label = operation.label ? ` ${operation.label}` : "";
  const value = operation.value || operation.language || operation.templateId || "";

  if (value) {
    return `-> ${value}${label ? ` (${label.trim()})` : ""}`;
  }

  return operation.type.replace(/_/g, " ");
}

function getApprovedVersion() {
  return state.snapshot?.approvedVersion || null;
}

function getSelectedVersion() {
  if (!state.snapshot) {
    return null;
  }

  return (
    state.snapshot.versions.find((version) => version.id === state.selectedVersionId) ||
    state.snapshot.workingVersion ||
    state.snapshot.approvedVersion ||
    state.snapshot.versions[0] ||
    null
  );
}

function getTemplateNameForVersion(version) {
  if (!state.snapshot) {
    return "J 300 LM 2-Page Catalog";
  }

  return (
    state.snapshot.templates?.find((template) => template.id === version?.catalog?.templateId)?.name ||
    state.snapshot.template?.name ||
    "J 300 LM 2-Page Catalog"
  );
}

function setBusy(nextBusy) {
  state.busy = nextBusy;
  els.restoreOriginalButton.disabled = nextBusy;
  els.applyPromptButton.disabled = nextBusy;
  els.promptInput.disabled = nextBusy;
  els.attachmentInput.disabled = nextBusy;
  els.applyPromptButton.textContent = nextBusy && state.busyLabel ? state.busyLabel : "Generate Draft";
}

function setBusyWithLabel(nextBusy, label = "") {
  state.busyLabel = nextBusy ? label : "";
  setBusy(nextBusy);
}

async function readResponseError(response) {
  try {
    const payload = await response.json();
    return payload.error || response.statusText;
  } catch (_error) {
    return response.statusText || "Request failed";
  }
}

async function loadSnapshot({ preserveSelection = true } = {}) {
  const response = await fetch("/api/catalog", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(await readResponseError(response));
  }

  const snapshot = await response.json();
  state.snapshot = snapshot;

  const hasCurrentSelection =
    preserveSelection && snapshot.versions.some((version) => version.id === state.selectedVersionId);

  state.selectedVersionId = hasCurrentSelection
    ? state.selectedVersionId
    : snapshot.workingVersion?.id || snapshot.approvedVersion?.id || snapshot.versions[0]?.id || null;

  render();
}

function renderPromptSuggestions() {
  els.promptSuggestions.innerHTML = promptSuggestions
    .map(
      (prompt) =>
        `<button class="prompt-chip" type="button" data-prompt="${escapeHtml(prompt)}">${escapeHtml(prompt)}</button>`
    )
    .join("");

  for (const button of els.promptSuggestions.querySelectorAll("[data-prompt]")) {
    button.addEventListener("click", () => {
      els.promptInput.value = button.getAttribute("data-prompt") || "";
    });
  }
}

function renderDetectedChanges() {
  const operations = state.lastParsed?.operations || [];

  if (!operations.length) {
    els.parsedPanel.className = "sidebar-card parsed-card is-hidden";
    els.detectedChangesList.innerHTML = "";
    return;
  }

  els.parsedPanel.className = "sidebar-card parsed-card";
  els.detectedChangesCount.textContent = `${operations.length} ops`;
  els.detectedChangesList.innerHTML = operations
    .map((operation) => `<li>${escapeHtml(humanizeOperation(operation))}</li>`)
    .join("");
}

function setStatusPill(element, status) {
  const normalized = String(status || "waiting").toLowerCase();
  element.textContent = normalized.toUpperCase();
  element.className = "status-pill";

  if (normalized === "approved") {
    element.classList.add("status-pill--success");
    return;
  }

  if (normalized === "draft" || normalized === "working") {
    element.classList.add("status-pill--warning");
    return;
  }

  element.classList.add("status-pill--neutral");
}

function setLayoutWarning(element, version) {
  const issue = version?.layoutIssues?.[0];

  if (!issue?.message) {
    element.textContent = "";
    element.className = "warning-banner is-hidden";
    return;
  }

  element.textContent = issue.message;
  element.className = "warning-banner";
}

function setPreviewFrame(frame, version) {
  if (!version?.id) {
    frame.removeAttribute("src");
    frame.setAttribute("srcdoc", "<body style='margin:0;font-family:Segoe UI,sans-serif;color:#6a7580;display:grid;place-items:center;height:100vh;'>Preview not available yet.</body>");
    return;
  }

  frame.removeAttribute("srcdoc");
  frame.src = `/?print=1&versionId=${encodeURIComponent(version.id)}&t=${encodeURIComponent(version.updatedAt || version.createdAt || Date.now())}`;
}

function syncPreviewScale() {
  for (const card of document.querySelectorAll(".preview-card")) {
    const availableWidth = Math.max(280, card.clientWidth - 24);
    const scale = Math.min(1, availableWidth / PRINT_PAGE_WIDTH);
    card.style.setProperty("--preview-scale", String(scale));
  }
}

function renderPreviewColumn({ version, metaElement, statusElement, warningElement, frameElement, headingElement, fallbackHeading }) {
  if (headingElement) {
    headingElement.textContent = fallbackHeading;
  }

  if (!version) {
    metaElement.textContent = "Not available yet";
    setStatusPill(statusElement, "waiting");
    setLayoutWarning(warningElement, null);
    setPreviewFrame(frameElement, null);
    return;
  }

  if (headingElement) {
    headingElement.textContent = version.status === "draft" ? "Selected working version" : "Selected version";
  }

  metaElement.textContent = `${version.versionLabel || "v1"} | ${version.catalog?.language || "English"}`;
  setStatusPill(statusElement, version.status);
  setLayoutWarning(warningElement, version);
  setPreviewFrame(frameElement, version);
}

function renderVersions(selectedVersion) {
  const versions = state.snapshot?.versions || [];
  els.versionCountLabel.textContent = String(versions.length);

  els.versionsList.innerHTML = versions
    .map((version) => {
      const warningMarkup = version.layoutIssues?.[0]?.message
        ? `<div class="version-card__warning">${escapeHtml(version.layoutIssues[0].message)}</div>`
        : "";

      const actionsMarkup = `
        <div class="version-card__actions">
          ${version.status === "approved"
            ? ""
            : `<button class="version-action" type="button" data-approve-version="${escapeHtml(version.id)}">Approve</button>`}
          <button class="version-action" type="button" data-export-version="${escapeHtml(version.id)}">Export PDF</button>
        </div>
      `;

      return `
        <article class="version-card ${version.id === selectedVersion?.id ? "is-selected" : ""}" data-select-version="${escapeHtml(version.id)}">
          <div class="version-card__topline">
            <strong>${escapeHtml(version.versionLabel || "Draft")}</strong>
            <span class="status-pill ${version.status === "approved" ? "status-pill--success" : "status-pill--warning"}">${escapeHtml(String(version.status || "draft").toUpperCase())}</span>
          </div>
          <div class="version-card__meta">
            <span>${escapeHtml(version.catalog?.language || "English")}</span>
            <span>${escapeHtml(formatDate(version.createdAt))}</span>
          </div>
          <div class="version-card__summary">${escapeHtml(version.summary || "Catalog revision")}</div>
          ${warningMarkup}
          ${actionsMarkup}
        </article>
      `;
    })
    .join("");

  for (const card of els.versionsList.querySelectorAll("[data-select-version]")) {
    card.addEventListener("click", (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("[data-approve-version], [data-export-version]")) {
        return;
      }

      state.selectedVersionId = card.getAttribute("data-select-version");
      render();
    });
  }

  for (const button of els.versionsList.querySelectorAll("[data-approve-version]")) {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      approveVersion(button.getAttribute("data-approve-version"));
    });
  }

  for (const button of els.versionsList.querySelectorAll("[data-export-version]")) {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      exportVersion(button.getAttribute("data-export-version"));
    });
  }
}

function render() {
  const approvedVersion = getApprovedVersion();
  const selectedVersion = getSelectedVersion();
  const templateVersion = selectedVersion || approvedVersion;

  els.selectedTemplateLabel.textContent = getTemplateNameForVersion(templateVersion);
  els.attachmentNote.textContent = els.attachmentInput.files?.[0]
    ? els.attachmentInput.files[0].name
    : "No file chosen.";

  renderDetectedChanges();
  renderVersions(selectedVersion);

  renderPreviewColumn({
    version: approvedVersion,
    metaElement: els.approvedMeta,
    statusElement: els.approvedStatus,
    warningElement: els.approvedLayoutWarning,
    frameElement: els.approvedPreviewFrame,
    fallbackHeading: "Current approved"
  });

  renderPreviewColumn({
    version: selectedVersion,
    metaElement: els.selectedMeta,
    statusElement: els.selectedStatus,
    warningElement: els.selectedLayoutWarning,
    frameElement: els.selectedPreviewFrame,
    headingElement: els.selectedPreviewHeading,
    fallbackHeading: "Selected working version"
  });

  syncPreviewScale();
  setBusy(state.busy);
}

async function restoreOriginalCatalog() {
  setBusyWithLabel(true, "Working...");
  setMessage("Restoring the original catalog...", "info");

  try {
    const response = await fetch("/api/catalog/reset", { method: "POST" });
    if (!response.ok) {
      throw new Error(await readResponseError(response));
    }

    state.lastParsed = null;
    els.promptInput.value = "";
    els.attachmentInput.value = "";
    await loadSnapshot({ preserveSelection: false });
    setMessage("The original J 300 LM catalog has been restored.", "success");
  } catch (error) {
    setMessage(`Unable to restore the original catalog: ${error.message}`);
  } finally {
    setBusyWithLabel(false);
  }
}

async function applyPrompt(event) {
  event.preventDefault();

  const prompt = els.promptInput.value.trim() || (els.attachmentInput.files?.[0] ? "Apply changes from the attachment." : "");
  const selectedVersion = getSelectedVersion();

  if (!prompt) {
    setMessage("Enter a prompt before generating a draft.", "warning");
    return;
  }

  setBusyWithLabel(true, "Working...");
  setMessage("Working on your draft. This can take a few moments...", "info");

  try {
    const payload = new FormData();
    payload.append("prompt", prompt);
    if (selectedVersion?.id) {
      payload.append("parentVersionId", selectedVersion.id);
    }
    if (els.attachmentInput.files?.[0]) {
      payload.append("attachment", els.attachmentInput.files[0]);
    }

    const response = await fetch("/api/catalog/prompt", {
      method: "POST",
      body: payload
    });

    if (!response.ok) {
      throw new Error(await readResponseError(response));
    }

    const data = await response.json();
    state.lastParsed = data.parsed || null;
    state.snapshot = data.snapshot;
    state.selectedVersionId = data.draftVersion?.id || state.selectedVersionId;
    els.attachmentInput.value = "";
    render();
    setMessage("Draft created successfully. Review it in the right-side preview and version list.", "success");
  } catch (error) {
    setMessage(`Unable to generate a draft: ${error.message}`);
  } finally {
    setBusyWithLabel(false);
  }
}

async function approveVersion(versionId) {
  if (!versionId) {
    return;
  }

  setBusyWithLabel(true, "Working...");
  setMessage("Approving the selected version...", "info");

  try {
    const response = await fetch(`/api/catalog/version/${encodeURIComponent(versionId)}/approve`, {
      method: "POST"
    });

    if (!response.ok) {
      throw new Error(await readResponseError(response));
    }

    const data = await response.json();
    state.snapshot = data.snapshot;
    state.selectedVersionId = data.approvedVersion?.id || versionId;
    render();
    setMessage(`Version ${data.approvedVersion?.versionLabel || ""} approved successfully.`, "success");
  } catch (error) {
    setMessage(`Unable to approve version: ${error.message}`);
  } finally {
    setBusyWithLabel(false);
  }
}

async function exportVersion(versionId) {
  if (!versionId) {
    return;
  }

  setBusyWithLabel(true, "Working...");
  setMessage("Preparing the PDF export...", "info");

  try {
    const response = await fetch(`/api/catalog/version/${encodeURIComponent(versionId)}/export`);
    if (!response.ok) {
      throw new Error(await readResponseError(response));
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `catalog-${versionId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    setMessage("PDF export started for the selected version.", "success");
  } catch (error) {
    setMessage(`Unable to export PDF: ${error.message}`);
  } finally {
    setBusyWithLabel(false);
  }
}

function wireEvents() {
  els.restoreOriginalButton.addEventListener("click", restoreOriginalCatalog);
  els.promptForm.addEventListener("submit", applyPrompt);
  els.attachmentInput.addEventListener("change", render);
  window.addEventListener("resize", syncPreviewScale);
}

async function boot() {
  renderPromptSuggestions();
  wireEvents();
  setBusyWithLabel(true, "Working...");

  try {
    await loadSnapshot({ preserveSelection: false });
    setMessage("Legacy pre-template workspace loaded.", "success");
  } catch (error) {
    setMessage(`Unable to load the legacy workspace: ${error.message}`);
  } finally {
    setBusyWithLabel(false);
  }
}

boot();
