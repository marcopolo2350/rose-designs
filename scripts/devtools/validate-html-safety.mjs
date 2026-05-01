import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => readFileSync(path.join(root, file), "utf8");
const errors = [];

const main = read("scripts/main.js");
const storage = read("scripts/storage.js");
const ui = read("scripts/ui.js");
const catalog = read("scripts/catalog.js");
const planner3d = read("scripts/planner3d.js");
const shortcuts = read("scripts/ui/shortcuts.js");
const cloud = read("scripts/cloud/supabase.js");
const walkthrough = read("scripts/walkthrough.js");
const errorReporting = read("scripts/core/error-reporting.js");
const htmlPath = path.join(root, "scripts/core/html.js");

if (!existsSync(htmlPath)) {
  errors.push("scripts/core/html.js is missing.");
}

const modulesBlock = main.match(/const\s+RUNTIME_MODULES\s*=\s*\[([\s\S]*?)\];/);
const modules = modulesBlock
  ? [...modulesBlock[1].matchAll(/["']([^"']+)["']/g)].map((match) => match[1])
  : [];
const htmlIndex = modules.indexOf("./scripts/core/html.js");
const storageIndex = modules.indexOf("./scripts/storage.js");
const errorIndex = modules.indexOf("./scripts/core/error-reporting.js");

if (htmlIndex < 0) errors.push("Runtime bridge must load ./scripts/core/html.js.");
if (htmlIndex > storageIndex && storageIndex >= 0) {
  errors.push("HTML safety helpers must load before storage.js defines legacy esc().");
}
if (htmlIndex > errorIndex && errorIndex >= 0) {
  errors.push("HTML safety helpers must load before error-reporting.js builds fatal screens.");
}

if (!/function\s+esc\s*\([^)]*\)\s*\{\s*return\s+window\.RoseHTML\.escape\(/.test(storage)) {
  errors.push("Legacy esc() must delegate to window.RoseHTML.escape().");
}

for (const pattern of [
  /innerHTML\s*=\s*`[\s\S]*?\$\{window\.location\.href\}/,
  /innerHTML\s*=\s*`[\s\S]*?\$\{getAssetBase\(\)\}/,
  /innerHTML\s*=\s*`[\s\S]*?\$\{row\.(?:key|status|error|url)\}/,
  /innerHTML\s*=\s*`[\s\S]*?\$\{item\.(?:key|status|file|mountType|error)\}/,
]) {
  if (pattern.test(storage)) {
    errors.push(`storage.js contains an unescaped diagnostic HTML interpolation: ${pattern}`);
  }
}

const assetPreflightRenderer = storage.match(
  /function\s+renderAssetPreflightPanel[\s\S]*?async\s+function\s+ensureHttpRuntime/,
);
if (!assetPreflightRenderer) {
  errors.push("renderAssetPreflightPanel() was not found for asset-preflight safety validation.");
} else {
  const body = assetPreflightRenderer[0];
  if (/insertAdjacentHTML|innerHTML\s*=/.test(body)) {
    errors.push("Asset preflight panel must render with DOM nodes, not HTML strings.");
  }
  if (
    !/heading\.textContent\s*=\s*title/.test(body) ||
    !/item\.textContent\s*=\s*row\.text/.test(body)
  ) {
    errors.push("Asset preflight panel must render dynamic text with textContent.");
  }
}

const roomRuntimeRenderer = storage.match(
  /function\s+renderRoomRuntimeDiagPanel[\s\S]*?function\s+toggleRoomRuntimeDiag/,
);
if (!roomRuntimeRenderer) {
  errors.push(
    "renderRoomRuntimeDiagPanel() was not found for runtime diagnostic safety validation.",
  );
} else {
  const body = roomRuntimeRenderer[0];
  if (/insertAdjacentHTML|innerHTML\s*=/.test(body)) {
    errors.push("Room runtime diagnostics must render with DOM nodes, not HTML strings.");
  }
  if (!/key\.textContent\s*=\s*item\.key/.test(body) || !/meta\.textContent\s*=/.test(body)) {
    errors.push("Room runtime diagnostics must render dynamic data with textContent.");
  }
}

if (/out\.innerHTML\s*=/.test(walkthrough)) {
  errors.push("walkthrough.js must render self-test output with textContent/DOM nodes.");
}

if (/shortcutSheetMarkup|sheet\.innerHTML\s*=/.test(shortcuts)) {
  errors.push("Shortcut sheet must render with DOM nodes, not HTML strings.");
}

if (/wrap\.innerHTML\s*=|style\.cssText|result\.style\.color/.test(cloud)) {
  errors.push("Cloud sync settings must render with DOM nodes and CSS classes.");
}
if (!/aria-modal/.test(cloud) || !/event\.key\s*===\s*["']Escape["']/.test(cloud)) {
  errors.push("Cloud sync settings must keep dialog metadata and Escape close handling.");
}

const deleteConfirm = ui.match(/function\s+showDeleteConfirm[\s\S]*?function\s+closeDeleteConfirm/);
if (!deleteConfirm) {
  errors.push("showDeleteConfirm() was not found for HTML safety validation.");
} else {
  const body = deleteConfirm[0];
  if (/insertAdjacentHTML|innerHTML\s*=/.test(body)) {
    errors.push("showDeleteConfirm() must render with DOM nodes, not HTML strings.");
  }
  if (!/copy\.textContent\s*=\s*name/.test(body)) {
    errors.push("showDeleteConfirm() must render the project name with textContent.");
  }
  if (!/overlay\.addEventListener\(["']keydown["'],\s*handleDeleteConfirmKeydown\)/.test(body)) {
    errors.push("showDeleteConfirm() must bind modal keyboard handling.");
  }
}

const tutorialRenderer = ui.match(/function\s+showTut[\s\S]*?function\s+nextTut/);
if (!tutorialRenderer) {
  errors.push("showTut() was not found for HTML safety validation.");
} else {
  const body = tutorialRenderer[0];
  if (/insertAdjacentHTML|innerHTML\s*=/.test(body)) {
    errors.push("showTut() must render with DOM nodes, not HTML strings.");
  }
  if (!/title\.textContent\s*=\s*s\.t/.test(body) || !/copy\.textContent\s*=\s*s\.d/.test(body)) {
    errors.push("showTut() must render tutorial copy with textContent.");
  }
}

const renderHome = ui.match(/function\s+renderHome[\s\S]*?function\s+openPrj/);
if (!renderHome) {
  errors.push("renderHome() was not found for HTML safety validation.");
} else {
  const body = renderHome[0];
  if (/insertAdjacentHTML|innerHTML\s*=/.test(body)) {
    errors.push("renderHome() must render project cards with DOM nodes, not HTML strings.");
  }
}

const projectCard = ui.match(/function\s+createProjectCard[\s\S]*?function\s+renderHome/);
if (!projectCard) {
  errors.push("createProjectCard() was not found for project-card safety validation.");
} else {
  const body = projectCard[0];
  if (/insertAdjacentHTML|innerHTML\s*=/.test(body)) {
    errors.push("createProjectCard() must render with DOM nodes, not HTML strings.");
  }
  if (!/title\.textContent\s*=\s*project\.projectName/.test(body)) {
    errors.push("createProjectCard() must render project names with textContent.");
  }
}

const presetGrid = ui.match(/function\s+popPresets[\s\S]*?function\s+defaultPersonalRoomName/);
if (!presetGrid) {
  errors.push("popPresets() was not found for create-room preset validation.");
} else {
  const body = presetGrid[0];
  if (/insertAdjacentHTML|innerHTML\s*=/.test(body)) {
    errors.push("popPresets() must render starter cards with DOM nodes, not HTML strings.");
  }
}

const presetCard = ui.match(/function\s+createPresetCard[\s\S]*?function\s+popPresets/);
if (!presetCard) {
  errors.push("createPresetCard() was not found for starter-card safety validation.");
} else {
  const body = presetCard[0];
  if (/insertAdjacentHTML|innerHTML\s*=/.test(body)) {
    errors.push("createPresetCard() must render with DOM nodes, not HTML strings.");
  }
  if (
    !/tag\.textContent\s*=\s*preset\.tag/.test(body) ||
    !/name\.textContent\s*=\s*preset\.name/.test(body)
  ) {
    errors.push("createPresetCard() must render starter copy with textContent.");
  }
}

const undoStrip = ui.match(/function\s+updateUndoStrip[\s\S]*?function\s+jumpUndoStep/);
if (!undoStrip) {
  errors.push("updateUndoStrip() was not found for undo-strip safety validation.");
} else {
  const body = undoStrip[0];
  if (/strip\.innerHTML|insertAdjacentHTML|outerHTML\s*=/.test(body)) {
    errors.push("updateUndoStrip() must render undo nodes with DOM nodes, not HTML strings.");
  }
  if (!/node\.textContent\s*=\s*isCurrent/.test(body)) {
    errors.push("updateUndoStrip() must render current-node text with textContent.");
  }
}

const pendingFurnitureBar = catalog.match(
  /function\s+renderPendingFurnitureBar[\s\S]*?function\s+updateCatalogPendingUi/,
);
if (!pendingFurnitureBar) {
  errors.push("renderPendingFurnitureBar() was not found for catalog placement validation.");
} else {
  const body = pendingFurnitureBar[0];
  if (/insertAdjacentHTML|innerHTML\s*=/.test(body)) {
    errors.push("Catalog placement bar must render with DOM nodes, not HTML strings.");
  }
  if (!/title\.textContent\s*=\s*item\.label/.test(body) || !/copy\.textContent\s*=/.test(body)) {
    errors.push("Catalog placement bar must render dynamic placement copy with textContent.");
  }
}

const roomPanelRestyle = catalog.match(
  /function\s+restyleRoomPanelText[\s\S]*?function\s+projectRoomMetaLine/,
);
if (!roomPanelRestyle) {
  errors.push("restyleRoomPanelText() was not found for room-panel label validation.");
} else {
  const body = roomPanelRestyle[0];
  if (/innerHTML\s*=|insertAdjacentHTML/.test(body)) {
    errors.push("Room panel restyling must rebuild labels with DOM nodes, not innerHTML.");
  }
  if (!/title\.textContent\s*=\s*label/.test(body) || !/meta\.textContent\s*=/.test(body)) {
    errors.push("Room panel restyling must render floor button labels with textContent.");
  }
}

const verificationCards = planner3d.match(
  /function\s+updateVerificationCard[\s\S]*?function\s+disposeVerificationScene/,
);
if (!verificationCards) {
  errors.push("3D verification card renderer was not found for HTML safety validation.");
} else {
  const body = verificationCards[0];
  if (/innerHTML\s*=|insertAdjacentHTML/.test(body)) {
    errors.push("3D verification cards must render with DOM nodes, not HTML strings.");
  }
  if (!/title\.textContent\s*=\s*key/.test(body) || !/line\.textContent\s*=\s*row/.test(body)) {
    errors.push("3D verification cards must render dynamic model data with textContent.");
  }
}

const walkControlDock = planner3d.match(
  /function\s+createWalkControlButton[\s\S]*?function\s+addWSeg/,
);
if (!walkControlDock) {
  errors.push("createWalkControlDock()/updateWalkUI() was not found for HTML safety validation.");
} else {
  const body = walkControlDock[0];
  if (/innerHTML\s*=|insertAdjacentHTML|style\s*=/.test(body)) {
    errors.push("Mobile walk controls must render with DOM nodes and CSS classes.");
  }
  if (
    !/button\.setAttribute\(["']aria-label["'],label\)/.test(body) ||
    !/hint\.textContent\s*=/.test(body)
  ) {
    errors.push("Mobile walk controls must keep button labels and hint text accessible.");
  }
}

const presentationTray = planner3d.match(
  /function\s+createPresentationTrayNode[\s\S]*?function\s+togglePresentationMode/,
);
if (!presentationTray) {
  errors.push("Presentation tray renderer was not found for HTML safety validation.");
} else {
  const body = presentationTray[0];
  if (/innerHTML\s*=|insertAdjacentHTML|outerHTML\s*=/.test(body)) {
    errors.push("Presentation tray must render with DOM nodes, not HTML strings.");
  }
  if (
    !/copy\.textContent\s*=\s*roomStoryLine\(curRoom\)/.test(body) ||
    !/storyLabel\.textContent\s*=/.test(body)
  ) {
    errors.push("Presentation tray must render dynamic room story copy with textContent.");
  }
}

const deleteConfirmKeys = ui.match(
  /function\s+handleDeleteConfirmKeydown[\s\S]*?function\s+showDeleteConfirm/,
);
if (!deleteConfirmKeys) {
  errors.push("handleDeleteConfirmKeydown() was not found for modal keyboard validation.");
} else {
  const body = deleteConfirmKeys[0];
  if (!/event\.key\s*===\s*["']Escape["']/.test(body)) {
    errors.push("Delete confirmation must close on Escape.");
  }
  if (!/event\.key\s*!==\s*["']Tab["']/.test(body)) {
    errors.push("Delete confirmation must trap Tab focus.");
  }
}

if (!read("scripts/core/error-reporting.js").includes("RoseHTML.clear")) {
  errors.push("Fatal-load screen should clear the document through RoseHTML.clear().");
}

if (/style\.cssText|\.style\./.test(errorReporting)) {
  errors.push("Fatal-load screen must use CSS classes instead of inline style mutation.");
}

if (errors.length) {
  console.error("HTML safety validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("HTML safety validation passed.");
