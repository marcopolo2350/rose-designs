import { readFileSync } from "node:fs";

globalThis.window = globalThis;

await import("../export/filenames.js");
await import("../export/downloads.js");
await import("../export/project-json.js");
await import("../export/svg.js");

const names = window.ExportFilenames;
const downloads = window.ExportDownloads;
const projectJson = window.RoseProjectJsonExports;
const svgExports = window.RoseSvgExports;

if (names.sanitizeBaseName(' Bad <Room>: "One" ') !== "Bad_Room_One") {
  throw new Error("sanitizeBaseName did not remove unsafe filename characters");
}
if (names.sanitizeBaseName("\u0000<>", "room") !== "room") {
  throw new Error("sanitizeBaseName did not fall back for empty unsafe names");
}
if (names.roomBaseName({ name: "Rose's Room" }, "presentation") !== "Rose_s_Room_presentation") {
  throw new Error("roomBaseName did not combine room and suffix safely");
}
if (
  names.fileName({ name: "Kitchen/Plan" }, "design summary", ".pdf") !==
  "Kitchen_Plan_design_summary.pdf"
) {
  throw new Error("fileName did not produce expected filename");
}

if (downloads.safeDownloadName(' Bad <Room>: "One".svg ') !== "Bad_Room_One.svg") {
  throw new Error("safeDownloadName did not sanitize unsafe download names");
}

if (
  typeof projectJson.exportProjectJSON !== "function" ||
  typeof projectJson.importProjectJSON !== "function" ||
  typeof projectJson.handleProjectJSONSelected !== "function"
) {
  throw new Error("Project JSON export/import functions were not registered.");
}
if (typeof svgExports.exportSVG !== "function") {
  throw new Error("SVG export function was not registered.");
}

const legacyExportSource = readFileSync("scripts/export.js", "utf8");
if (
  /function\s+(?:exportProjectJSON|importProjectJSON|handleProjectJSONSelected)\b/.test(
    legacyExportSource,
  )
) {
  throw new Error(
    "Project JSON import/export functions must live in scripts/export/project-json.js.",
  );
}
if (/function\s+exportSVG\b/.test(legacyExportSource)) {
  throw new Error("SVG export must live in scripts/export/svg.js.");
}

for (const file of [
  "scripts/export.js",
  "scripts/export/project-json.js",
  "scripts/planner3d.js",
]) {
  const source = readFileSync(file, "utf8");
  if (/document\.createElement\(["']a["']\)/.test(source)) {
    throw new Error(
      `${file} should use window.ExportDownloads instead of creating download anchors directly`,
    );
  }
  if (/URL\.createObjectURL/.test(source)) {
    throw new Error(`${file} should use window.ExportDownloads for object URL downloads`);
  }
}

console.log("Export filename and download validation passed.");
