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
  "scripts/core/storage-service.js",
  "scripts/core/storage-keys.js",
  "scripts/ui/shortcuts.js",
  "scripts/catalog/placement-rules.js",
  "scripts/planner2d/geometry.js",
  "scripts/planner2d/furniture-style.js",
  "scripts/planner2d/reference-overlay.js",
  "scripts/planner2d/snapping.js",
  "scripts/planner3d/lifecycle.js",
  "scripts/planner3d/lighting.js",
  "scripts/planner3d/camera.js",
  "scripts/planner3d/materials.js",
  "scripts/planner3d/model-loader.js",
  "scripts/planner3d/room-shell.js",
  "scripts/planner3d/walls.js",
  "scripts/catalog/manifest.js",
  "scripts/export/filenames.js",
  "scripts/export/downloads.js",
  "scripts/export/project-json.js",
  "scripts/export/pdf.js",
  "scripts/export/png.js",
  "scripts/export/print.js",
  "scripts/export/svg.js",
  "scripts/cloud/supabase.js",
];

const removedCompatibilityFiles = ["scripts/cloud-sync.js", "scripts/export.js"];

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
assertModuleBefore("./scripts/core/storage-keys.js", "./scripts/core/storage-service.js");
assertModuleBefore("./scripts/core/storage-service.js", "./scripts/storage.js");
assertModuleBefore("./scripts/catalog/placement-rules.js", "./scripts/state.js");
assertModuleBefore("./scripts/planner2d/furniture-style.js", "./scripts/planner2d.js");
assertModuleBefore("./scripts/planner2d/reference-overlay.js", "./scripts/planner2d.js");
assertModuleBefore("./scripts/planner2d/snapping.js", "./scripts/planner2d.js");
assertModuleBefore("./scripts/catalog/manifest.js", "./scripts/catalog.js");
assertModuleBefore("./scripts/export/filenames.js", "./scripts/export/downloads.js");
assertModuleBefore("./scripts/export/filenames.js", "./scripts/export/project-json.js");
assertModuleBefore("./scripts/export/filenames.js", "./scripts/export/svg.js");
assertModuleBefore("./scripts/export/downloads.js", "./scripts/planner3d.js");
assertModuleBefore("./scripts/export/downloads.js", "./scripts/export/project-json.js");
assertModuleBefore("./scripts/export/downloads.js", "./scripts/export/svg.js");
assertModuleBefore("./scripts/export/png.js", "./scripts/export/pdf.js");
assertModuleBefore("./scripts/core/history.js", "./scripts/planner3d.js");
assertModuleBefore("./scripts/planner3d/lifecycle.js", "./scripts/planner3d.js");
assertModuleBefore("./scripts/planner3d/lighting.js", "./scripts/planner3d.js");
assertModuleBefore("./scripts/planner3d/camera.js", "./scripts/planner3d.js");
assertModuleBefore("./scripts/planner3d/materials.js", "./scripts/planner3d.js");
assertModuleBefore("./scripts/planner3d/model-loader.js", "./scripts/planner3d.js");
assertModuleBefore("./scripts/planner3d/room-shell.js", "./scripts/planner3d.js");
assertModuleBefore("./scripts/planner3d/walls.js", "./scripts/planner3d.js");

for (const absolute of listSourceFiles(path.join(root, "scripts"))) {
  const modulePath = path.relative(root, absolute).replace(/\\/g, "/");
  const source = readFileSync(absolute, "utf8");
  if (modulePath !== "scripts/core/storage-service.js" && /indexedDB\.open/.test(source)) {
    errors.push(`${modulePath} opens IndexedDB outside scripts/core/storage-service.js.`);
  }
  if (
    modulePath === "scripts/planner3d.js" &&
    /\bfunction\s+(?:pushUBase|doUndo|doRedo|roomSnapshot|persistRoomHistory)\s*\(/.test(source)
  ) {
    errors.push(`${modulePath} defines room history behavior outside scripts/core/history.js.`);
  }
  if (modulePath === "scripts/planner3d.js" && /\b(?:hdriForTOD|_lerpHex)\b/.test(source)) {
    errors.push(
      `${modulePath} defines time-of-day lighting helpers outside scripts/planner3d/lighting.js.`,
    );
  }
  if (
    modulePath === "scripts/planner2d.js" &&
    /\bfunction\s+(?:roomReference|roomReferenceVisible|roomReferenceWorldSize|roomReferenceBounds|referencePointToWorld|referenceWorldToLocal|referenceDisplayLabel)\s*\(/.test(
      source,
    )
  ) {
    errors.push(
      `${modulePath} defines reference overlay geometry/label helpers outside scripts/planner2d/reference-overlay.js.`,
    );
  }
  if (
    modulePath === "scripts/planner2d.js" &&
    /\bfunction\s+(?:isWallMountedFurnitureItem|wallSnapForFurniture|snapFurnitureForItem)\s*\(/.test(
      source,
    )
  ) {
    errors.push(
      `${modulePath} defines furniture snapping helpers outside scripts/planner2d/snapping.js.`,
    );
  }
  if (
    modulePath === "scripts/planner2d.js" &&
    /\b(?:const\s+FURN_GROUP_TINTS|function\s+(?:threeColorToRgba|furniture2DStroke|furniture2DLabelInk|furniture2DTint)\s*\()/.test(
      source,
    )
  ) {
    errors.push(
      `${modulePath} defines furniture 2D style helpers outside scripts/planner2d/furniture-style.js.`,
    );
  }
  if (
    modulePath === "scripts/planner3d.js" &&
    /score\s*=\s*dist\s*\+\s*\(Math\.abs\(dx\)\s*\+\s*Math\.abs\(dz\)\)\s*\*\s*\.?2/.test(source)
  ) {
    errors.push(
      `${modulePath} defines favorite-corner camera scoring outside scripts/planner3d/camera.js.`,
    );
  }
  if (
    modulePath === "scripts/planner3d.js" &&
    /\bfunction\s+(?:ensureGLTFLoader|warnAssetFallback|cloneAssetScene|loadModelAsset)\s*\(/.test(
      source,
    )
  ) {
    errors.push(
      `${modulePath} defines model loading behavior outside scripts/planner3d/model-loader.js.`,
    );
  }
  if (
    modulePath === "scripts/planner3d.js" &&
    /\bfunction\s+(?:furnitureMaterialProfile|furnitureBaseTint|premiumVariantMat|applyFurnitureFinishToModel|premiumMat)\s*\(/.test(
      source,
    )
  ) {
    errors.push(
      `${modulePath} defines material finish behavior outside scripts/planner3d/materials.js.`,
    );
  }
  if (
    modulePath === "scripts/planner3d.js" &&
    /new\s+THREE\.Shape\s*\(|setFromPoints\s*\(\s*room\.polygon|getMaxAnisotropy/.test(source)
  ) {
    errors.push(
      `${modulePath} defines room shell shape/bounds/anisotropy helpers outside scripts/planner3d/room-shell.js.`,
    );
  }
  if (modulePath === "scripts/planner3d.js") {
    const singleDefinition3DHandlers = [
      "exit3DView",
      "toggleWalkthroughTray",
      "updateWalkthroughTray",
      "togglePhotoMode",
      "updatePhotoTray",
      "setPhotoPreset",
      "favoriteCornerPose",
      "startWalkthroughPreset",
      "rebuild3D",
    ];
    for (const name of singleDefinition3DHandlers) {
      const declarations = [...source.matchAll(new RegExp(`\\bfunction\\s+${name}\\s*\\(`, "g"))];
      if (declarations.length !== 1) {
        errors.push(
          `${modulePath} must define ${name} exactly once, found ${declarations.length}.`,
        );
      }
      if (new RegExp(`^\\s*${name}\\s*=\\s*function\\b`, "m").test(source)) {
        errors.push(`${modulePath} must not override ${name} with a later function assignment.`);
      }
    }
  }
  if (modulePath === "scripts/state.js") {
    const defaultElevationBlock =
      source.match(/function\s+defaultElevation\s*\([\s\S]*?\n}\nfunction\s+axisYawOffset/)?.[0] ||
      "";
    if (!/CatalogPlacementRules\.defaultElevation/.test(defaultElevationBlock)) {
      errors.push(
        `${modulePath} must delegate defaultElevation to scripts/catalog/placement-rules.js.`,
      );
    }
    if (/assetKey\s*={0,3}\s*["']/.test(defaultElevationBlock)) {
      errors.push(`${modulePath} must not hard-code asset-specific default elevation rules.`);
    }
  }
  if (
    modulePath === "scripts/catalog.js" &&
    !/registerAssetPlacement\?\.\(assetManifest\)/.test(source)
  ) {
    errors.push(`${modulePath} must register manifest placement metadata with catalog rules.`);
  }
  const lines = source.split(/\r?\n/);
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
