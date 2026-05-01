import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => readFileSync(path.join(root, file), "utf8");
const errors = [];

const main = read("scripts/main.js");
const storage = read("scripts/storage.js");
const ui = read("scripts/ui.js");
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
