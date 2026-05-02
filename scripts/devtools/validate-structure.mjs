import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];

function listSourceFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listSourceFiles(absolute));
      continue;
    }
    if (/\.(?:js|mjs)$/i.test(entry.name)) files.push(absolute);
  }
  return files;
}

const requiredDirs = [
  "scripts/core",
  "scripts/ui",
  "scripts/planner2d",
  "scripts/planner3d",
  "scripts/catalog",
  "scripts/export",
  "scripts/cloud",
  "scripts/devtools",
];

const requiredFiles = [
  "scripts/core/app-config.js",
  "scripts/core/app-state.js",
  "scripts/core/error-reporting.js",
  "scripts/core/history.js",
  "scripts/core/html.js",
  "scripts/core/project-schema.js",
  "scripts/core/storage-keys.js",
  "scripts/ui/shortcuts.js",
  "scripts/planner2d/geometry.js",
  "scripts/planner3d/lifecycle.js",
  "scripts/catalog/manifest.js",
  "scripts/export/filenames.js",
  "scripts/export/downloads.js",
  "scripts/export/project-json.js",
  "scripts/cloud/supabase.js",
];

const removedCompatibilityFiles = ["scripts/cloud-sync.js"];

for (const dir of requiredDirs) {
  const absolute = path.join(root, dir);
  if (!existsSync(absolute) || !statSync(absolute).isDirectory()) {
    errors.push(`Missing required source boundary directory: ${dir}`);
    continue;
  }
  if (!readdirSync(absolute).length) {
    errors.push(`Source boundary directory is empty: ${dir}`);
  }
}

for (const file of requiredFiles) {
  const absolute = path.join(root, file);
  if (!existsSync(absolute) || !statSync(absolute).isFile()) {
    errors.push(`Missing required boundary file: ${file}`);
  }
}

for (const file of removedCompatibilityFiles) {
  const absolute = path.join(root, file);
  if (existsSync(absolute)) {
    errors.push(`${file} is a removed compatibility wrapper and must not return.`);
  }
}

const main = readFileSync(path.join(root, "scripts/main.js"), "utf8");
const modulesBlock = main.match(/const\s+RUNTIME_MODULES\s*=\s*\[([\s\S]*?)\];/);
const modules = modulesBlock
  ? [...modulesBlock[1].matchAll(/["']([^"']+)["']/g)].map((match) => match[1])
  : [];

function assertModuleBefore(before, after) {
  const beforeIndex = modules.indexOf(before);
  const afterIndex = modules.indexOf(after);
  if (beforeIndex < 0) errors.push(`Runtime bridge is missing ${before}`);
  if (afterIndex < 0) errors.push(`Runtime bridge is missing ${after}`);
  if (beforeIndex >= 0 && afterIndex >= 0 && beforeIndex > afterIndex) {
    errors.push(`${before} must load before ${after}`);
  }
}

assertModuleBefore("./scripts/core/html.js", "./scripts/core/error-reporting.js");
assertModuleBefore("./scripts/catalog/manifest.js", "./scripts/catalog.js");
assertModuleBefore("./scripts/export/filenames.js", "./scripts/export.js");
assertModuleBefore("./scripts/export/filenames.js", "./scripts/export/downloads.js");
assertModuleBefore("./scripts/export/filenames.js", "./scripts/export/project-json.js");
assertModuleBefore("./scripts/export/downloads.js", "./scripts/export.js");
assertModuleBefore("./scripts/export/downloads.js", "./scripts/planner3d.js");
assertModuleBefore("./scripts/export/downloads.js", "./scripts/export/project-json.js");
assertModuleBefore("./scripts/export/project-json.js", "./scripts/export.js");
assertModuleBefore("./scripts/planner3d/lifecycle.js", "./scripts/planner3d.js");

for (const absolute of listSourceFiles(path.join(root, "scripts"))) {
  const modulePath = path.relative(root, absolute).replace(/\\/g, "/");
  const lines = readFileSync(absolute, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/^\s*(?:\/\/|\/\*|\*)\s*phase\b/i.test(line)) {
      errors.push(`${modulePath}:${index + 1} contains a phase-history comment.`);
    }
  });
}

if (errors.length) {
  console.error("Source structure validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Source structure validation passed.");
