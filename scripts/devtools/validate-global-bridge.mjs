import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const scriptsRoot = path.join(root, "scripts");
const errors = [];

const allowedAssignments = new Set(
  [
    ["APP_CONFIG", "scripts/core/app-config.js"],
    ["APP_VERSION", "scripts/core/app-config.js"],
    ["CatalogPlacementRules", "scripts/catalog/placement-rules.js"],
    ["ExportDownloads", "scripts/export/downloads.js"],
    ["ExportFilenames", "scripts/export/filenames.js"],
    ["PROFILE_LOCAL_KEY", "scripts/core/storage-keys.js"],
    ["Planner2DGeometry", "scripts/planner2d/geometry.js"],
    ["Planner2DFurnitureStyle", "scripts/planner2d/furniture-style.js"],
    ["Planner2DReferenceOverlay", "scripts/planner2d/reference-overlay.js"],
    ["Planner2DSnapping", "scripts/planner2d/snapping.js"],
    ["Planner3DLifecycle", "scripts/planner3d/lifecycle.js"],
    ["Planner3DLighting", "scripts/planner3d/lighting.js"],
    ["Planner3DCamera", "scripts/planner3d/camera.js"],
    ["Planner3DMaterials", "scripts/planner3d/materials.js"],
    ["Planner3DModelLoader", "scripts/planner3d/model-loader.js"],
    ["Planner3DRoomShell", "scripts/planner3d/room-shell.js"],
    ["RoseCatalogManifest", "scripts/catalog/manifest.js"],
    ["RoseHTML", "scripts/core/html.js"],
    ["RosePdfExports", "scripts/export/pdf.js"],
    ["RosePngExports", "scripts/export/png.js"],
    ["RosePrintExports", "scripts/export/print.js"],
    ["RoseProjectJsonExports", "scripts/export/project-json.js"],
    ["RoseProjectSchema", "scripts/core/project-schema.js"],
    ["RoseSvgExports", "scripts/export/svg.js"],
    ["RoseStorageService", "scripts/core/storage-service.js"],
    ["__lastSelfTest", "scripts/walkthrough.js"],
    ["__roseEditorKeysBound", "scripts/ui/shortcuts.js"],
    ["__roseWalkKeysBound", "scripts/state.js"],
    ["_snapPulses", "scripts/planner2d.js"],
    ["_snapPulses", "scripts/state.js"],
    ["appState", "scripts/core/app-state.js"],
    ["applyTimeOfDay", "scripts/planner3d.js"],
    ["assetManifest", "scripts/catalog.js"],
    ["bindEditorKeys", "scripts/ui/shortcuts.js"],
    ["closeShortcutSheet", "scripts/ui/shortcuts.js"],
    ["cloudSync", "scripts/cloud/supabase.js"],
    ["doRedo", "scripts/core/history.js"],
    ["doUndo", "scripts/core/history.js"],
    ["exportProjectJSON", "scripts/export/project-json.js"],
    ["findRoomsFromSegments", "scripts/state.js"],
    ["getActiveProfileId", "scripts/core/storage-keys.js"],
    ["getLocal", "scripts/core/storage-keys.js"],
    ["getRecord", "scripts/storage.js"],
    ["handleProjectJSONSelected", "scripts/export/project-json.js"],
    ["historyKey", "scripts/core/history.js"],
    ["importProjectJSON", "scripts/export/project-json.js"],
    ["jumpUndoStep", "scripts/ui.js"],
    ["onTimeOfDayChange", "scripts/ui.js"],
    ["openAssetVerification", "scripts/walkthrough.js"],
    ["openCloudSyncSettings", "scripts/cloud/supabase.js"],
    ["openDatabase", "scripts/storage.js"],
    ["patchGLBMaterials", "scripts/material-audit.js"],
    ["persistRoomHistory", "scripts/core/history.js"],
    ["profileSeenKey", "scripts/core/storage-keys.js"],
    ["pushUBase", "scripts/core/history.js"],
    ["reportRoseError", "scripts/core/error-reporting.js"],
    ["reportRoseRecoverableError", "scripts/core/error-reporting.js"],
    ["restoreRoomHistory", "scripts/core/history.js"],
    ["roomSnapshot", "scripts/core/history.js"],
    ["runRoomModelAudit", "scripts/walkthrough.js"],
    ["runRoseSelfTest", "scripts/walkthrough.js"],
    ["scopedDbKey", "scripts/core/storage-keys.js"],
    ["setActiveProfileId", "scripts/core/storage-keys.js"],
    ["setLocal", "scripts/core/storage-keys.js"],
    ["setRecord", "scripts/storage.js"],
    ["setTimeOfDay", "scripts/ui.js"],
    ["showRoseFatalLoadScreen", "scripts/core/error-reporting.js"],
    ["splitRoomByInteriorWalls", "scripts/state.js"],
    ["storageKey", "scripts/core/storage-keys.js"],
    ["syncCurrentRoomRecord", "scripts/core/history.js"],
    ["toggleShortcutSheet", "scripts/ui/shortcuts.js"],
    ["updateUndoStrip", "scripts/ui.js"],
  ].map(([name, file]) => `${name}\t${file}`),
);

function listSourceFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const absolute = path.join(dir, entry);
    const stat = statSync(absolute);
    if (stat.isDirectory()) {
      files.push(...listSourceFiles(absolute));
    } else if (/\.(?:js|mjs)$/.test(entry)) {
      files.push(absolute);
    }
  }
  return files;
}

const observedAssignments = new Set();
for (const absolute of listSourceFiles(scriptsRoot)) {
  const relative = path.relative(root, absolute).replace(/\\/g, "/");
  const source = readFileSync(absolute, "utf8");
  for (const match of source.matchAll(/window\.([A-Za-z0-9_$]+)\s*=(?!=)/g)) {
    observedAssignments.add(`${match[1]}\t${relative}`);
  }
}

for (const observed of observedAssignments) {
  if (!allowedAssignments.has(observed)) {
    const [name, file] = observed.split("\t");
    errors.push(`Unexpected window global assignment: window.${name} in ${file}`);
  }
}

for (const allowed of allowedAssignments) {
  if (!observedAssignments.has(allowed)) {
    const [name, file] = allowed.split("\t");
    errors.push(`Expected bridge global is missing: window.${name} in ${file}`);
  }
}

if (errors.length) {
  console.error("Global bridge validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Global bridge validation passed for ${observedAssignments.size} assignments.`);
