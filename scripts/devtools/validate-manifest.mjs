import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "data", "asset-manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const items = Array.isArray(manifest) ? manifest : manifest.assets || [];

const errors = [];
const warnings = [];
const ids = new Set();
const files = new Set();

for (const item of items) {
  if (!item || typeof item !== "object") {
    errors.push("Manifest contains a non-object entry.");
    continue;
  }
  const id = item.assetKey || item.id;
  const label = item.label || item.name;
  const category = item.group || item.category;
  const modelPath = item.file ? `./assets/models/${item.file}` : item.modelPath;
  const thumbnailPath = item.thumb ? `./assets/thumbnails/${item.thumb}` : item.thumbnailPath;
  const fields = [
    ["id", id],
    ["label", label],
    ["category", category],
    ["modelPath", modelPath],
    ["thumbnailPath", thumbnailPath],
  ];
  for (const [field, value] of fields) {
    if (!value || typeof value !== "string") {
      errors.push(`Asset ${id || "<missing id>"} is missing required string field ${field}.`);
    }
  }
  if (id) {
    if (ids.has(id)) errors.push(`Duplicate asset id: ${id}`);
    ids.add(id);
  }
  if (modelPath) {
    if (files.has(modelPath)) warnings.push(`Duplicate model file reference: ${modelPath}`);
    files.add(modelPath);
    const absoluteModelPath = path.join(root, modelPath.replace(/^\.\//, ""));
    if (!fs.existsSync(absoluteModelPath))
      errors.push(`Missing model file for ${id}: ${modelPath}`);
  }
  if (thumbnailPath) {
    const absoluteThumbPath = path.join(root, thumbnailPath.replace(/^\.\//, ""));
    if (!fs.existsSync(absoluteThumbPath))
      errors.push(`Missing thumbnail for ${id}: ${thumbnailPath}`);
  }
  if (item.mountType && !["floor", "wall", "surface", "ceiling"].includes(item.mountType)) {
    errors.push(`Invalid mountType for ${item.assetKey}: ${item.mountType}`);
  }
}

if (warnings.length) {
  console.warn(warnings.join("\n"));
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Manifest validation passed for ${items.length} assets.`);
