import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => readFileSync(path.join(root, file), "utf8");
const errors = [];

const main = read("scripts/main.js");
const storage = read("scripts/storage.js");
const walkthrough = read("scripts/walkthrough.js");
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

if (!read("scripts/core/error-reporting.js").includes("RoseHTML.clear")) {
  errors.push("Fatal-load screen should clear the document through RoseHTML.clear().");
}

if (errors.length) {
  console.error("HTML safety validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("HTML safety validation passed.");
