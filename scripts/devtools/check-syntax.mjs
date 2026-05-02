import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const errors = [];

const explicitFiles = ["eslint.config.js", "playwright.config.mjs"];
const roots = ["scripts", "tests"];

function listJavaScriptFiles(dir) {
  const entries = readdirSync(path.join(root, dir), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listJavaScriptFiles(relative));
      continue;
    }
    if (/\.(?:js|mjs)$/i.test(entry.name)) {
      files.push(relative);
    }
  }
  return files;
}

const files = [...explicitFiles, ...roots.flatMap((dir) => listJavaScriptFiles(dir))].sort((a, b) =>
  a.localeCompare(b),
);

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    cwd: root,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    errors.push(`${file}\n${result.stderr || result.stdout || "node --check failed"}`);
  }
}

if (errors.length) {
  console.error("Syntax validation failed:");
  for (const error of errors) console.error(`\n${error}`);
  process.exit(1);
}

console.log(`Syntax validation passed for ${files.length} files.`);
