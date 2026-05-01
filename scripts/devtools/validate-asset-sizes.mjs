import { readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const modelsDir = path.join(root, "assets", "models");
const maxModelBytes = 10 * 1024 * 1024;
const errors = [];
let totalBytes = 0;
let count = 0;

for (const entry of readdirSync(modelsDir, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".glb")) continue;
  const fullPath = path.join(modelsDir, entry.name);
  const size = statSync(fullPath).size;
  count += 1;
  totalBytes += size;
  if (size > maxModelBytes) {
    errors.push(`${entry.name} is ${(size / 1024 / 1024).toFixed(1)} MB; max is 10 MB.`);
  }
}

if (errors.length) {
  console.error("Asset size validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Asset size validation passed for ${count} GLB files (${(totalBytes / 1024 / 1024).toFixed(1)} MB total).`,
);
