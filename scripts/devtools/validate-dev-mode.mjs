import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const indexHtml = readFileSync(path.join(root, "index.html"), "utf8");
const css = readdirSync(path.join(root, "styles"))
  .filter((file) => file.endsWith(".css"))
  .map((file) => readFileSync(path.join(root, "styles", file), "utf8"))
  .join("\n");
const storageJs = readFileSync(path.join(root, "scripts", "storage.js"), "utf8");
const walkthroughJs = readFileSync(path.join(root, "scripts", "walkthrough.js"), "utf8");
const errors = [];

const requiredDevOnlyIds = [
  "assetDiagToggle",
  "assetPreflightPanel",
  "debugBadge",
  "roomDebugBadge",
  "roomRuntimeActions",
  "roomRuntimeDiag",
  "verifyOv",
];

for (const id of requiredDevOnlyIds) {
  const match = indexHtml.match(new RegExp(`<[^>]+\\bid=["']${id}["'][^>]*>`, "i"));
  if (!match) {
    errors.push(`Missing expected dev-only surface: #${id}`);
    continue;
  }
  if (!/\bdev-only\b/.test(match[0])) {
    errors.push(`#${id} must include the dev-only class.`);
  }
}

for (const fnName of ["openAssetVerification", "togglePreflightPanel"]) {
  const match = indexHtml.match(new RegExp(`<button[^>]+data-fn=["']${fnName}["'][^>]*>`, "i"));
  if (!match) {
    errors.push(`Missing expected dev-only menu action: ${fnName}`);
    continue;
  }
  if (!/\bdev-only\b/.test(match[0])) {
    errors.push(`Dev menu action ${fnName} must include the dev-only class.`);
  }
}

if (
  !/body:not\(\.dev-mode\)\s+\.dev-only\s*\{\s*display:\s*none\s*!important\s*;?\s*\}/.test(css)
) {
  errors.push("CSS must hide .dev-only surfaces unless body.dev-mode is present.");
}

if (!/const\s+DEV_MODE\s*=/.test(storageJs) || !/dev=1/.test(storageJs)) {
  errors.push("DEV_MODE must be explicitly derived from #dev or ?dev=1.");
}

if (!/document\.body\.classList\.toggle\(['"]dev-mode['"],\s*DEV_MODE\)/.test(walkthroughJs)) {
  errors.push("Runtime must toggle body.dev-mode from DEV_MODE.");
}

if (errors.length) {
  console.error("Dev-mode validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Dev-mode validation passed.");
