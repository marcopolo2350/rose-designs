import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "data", "asset-manifest.json");
const overridesPath = path.join(root, "data", "asset-validation-overrides.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const validationOverrides = fs.existsSync(overridesPath)
  ? JSON.parse(fs.readFileSync(overridesPath, "utf8"))
  : {};
const items = Array.isArray(manifest) ? manifest : manifest.assets || [];
const allowedDuplicateModelPaths = validationOverrides.allowedDuplicateModelPaths || {};

const errors = [];
const warnings = [];
const ids = new Set();
const files = new Map();
const placementMountTypes = new Set(["wall", "surface", "ceiling"]);
const placementTargets = new Set(["floor", "wall", "surface", "ceiling", "opening"]);
const forwardAxes = new Set(["+x", "-x", "+y", "-y", "+z", "-z"]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateElevationRule(assetId, rule) {
  if (Number.isFinite(rule)) return;
  if (!isPlainObject(rule)) {
    errors.push(`Asset ${assetId} has invalid placement.defaultElevation.`);
    return;
  }
  if (rule.relativeTo !== "ceiling") {
    errors.push(`Asset ${assetId} has unsupported placement.defaultElevation.relativeTo.`);
  }
  if (!Number.isFinite(rule.offset) || rule.offset < 0) {
    errors.push(`Asset ${assetId} has invalid ceiling offset in placement.defaultElevation.`);
  }
  if (!Number.isFinite(rule.min) || rule.min < 0) {
    errors.push(`Asset ${assetId} has invalid minimum in placement.defaultElevation.`);
  }
}

function validatePlacement(item, id) {
  if (!isPlainObject(item.placement)) {
    if (placementMountTypes.has(item.mountType)) {
      errors.push(`Asset ${id} is ${item.mountType}-mounted but lacks placement metadata.`);
    }
    return;
  }
  if (!placementTargets.has(item.placement.snapTo)) {
    errors.push(`Asset ${id} has invalid placement.snapTo: ${item.placement.snapTo}`);
  }
  if (!forwardAxes.has(item.placement.forwardAxis)) {
    errors.push(`Asset ${id} has invalid placement.forwardAxis: ${item.placement.forwardAxis}`);
  }
  validateElevationRule(id, item.placement.defaultElevation);
  if (item.mountType === "wall" && !["wall", "opening"].includes(item.placement.snapTo)) {
    errors.push(`Wall-mounted asset ${id} must snap to a wall or opening.`);
  }
  if (item.mountType === "ceiling" && item.placement.snapTo !== "ceiling") {
    errors.push(`Ceiling-mounted asset ${id} must snap to the ceiling.`);
  }
  if (item.mountType === "surface" && item.placement.snapTo !== "surface") {
    errors.push(`Surface-mounted asset ${id} must snap to a surface.`);
  }
}

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
    const previousIds = files.get(modelPath) || [];
    if (previousIds.length) {
      const expectedIds = allowedDuplicateModelPaths[modelPath]?.assetIds || [];
      const observedIds = [...previousIds, id].filter(Boolean).sort();
      const allowedIds = [...expectedIds].sort();
      const isAllowed =
        allowedIds.length === observedIds.length &&
        allowedIds.every((allowedId, index) => allowedId === observedIds[index]);
      if (!isAllowed) {
        warnings.push(`Duplicate model file reference: ${modelPath} (${observedIds.join(", ")})`);
      }
    }
    previousIds.push(id);
    files.set(modelPath, previousIds);
    const absoluteModelPath = path.join(root, modelPath.replace(/^\.\//, ""));
    if (!fs.existsSync(absoluteModelPath))
      errors.push(`Missing model file for ${id}: ${modelPath}`);
  }
  if (thumbnailPath) {
    const absoluteThumbPath = path.join(root, thumbnailPath.replace(/^\.\//, ""));
    if (!fs.existsSync(absoluteThumbPath))
      errors.push(`Missing thumbnail for ${id}: ${thumbnailPath}`);
  }
  if (!item.mountType) {
    errors.push(`Asset ${id || "<missing id>"} is missing mountType.`);
  } else if (!["floor", "wall", "surface", "ceiling"].includes(item.mountType)) {
    errors.push(`Invalid mountType for ${id || "<missing id>"}: ${item.mountType}`);
  }
  if (id) validatePlacement(item, id);
}

for (const [modelPath, meta] of Object.entries(allowedDuplicateModelPaths)) {
  const observedIds = [...(files.get(modelPath) || [])].filter(Boolean).sort();
  const expectedIds = [...(meta.assetIds || [])].sort();
  const matches =
    observedIds.length === expectedIds.length &&
    expectedIds.every((expectedId, index) => expectedId === observedIds[index]);
  if (!matches) {
    errors.push(
      `Allowed duplicate model override is stale for ${modelPath}: expected ${expectedIds.join(", ") || "<none>"}; observed ${observedIds.join(", ") || "<none>"}.`,
    );
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
