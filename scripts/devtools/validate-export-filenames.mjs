import { existsSync, readFileSync } from "node:fs";

globalThis.window = globalThis;

await import("../export/filenames.js");
await import("../export/downloads.js");
await import("../export/project-json.js");
await import("../export/pdf.js");
await import("../export/png.js");
await import("../export/print.js");
await import("../export/svg.js");

const names = window.ExportFilenames;
const downloads = window.ExportDownloads;
const pdfExports = window.RosePdfExports;
const pngExports = window.RosePngExports;
const printExports = window.RosePrintExports;
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
if (
  typeof pngExports.exportPNG !== "function" ||
  typeof pngExports.renderRoomModeToDataURL !== "function"
) {
  throw new Error("PNG export functions were not registered.");
}
if (typeof printExports.printFloorPlan !== "function") {
  throw new Error("Print export function was not registered.");
}
if (
  typeof pdfExports.exportPDF !== "function" ||
  typeof pdfExports.exportPresentationPDF !== "function"
) {
  throw new Error("PDF export functions were not registered.");
}

if (existsSync("scripts/export.js")) {
  throw new Error(
    "Legacy scripts/export.js must not return; export behavior lives under scripts/export/.",
  );
}

for (const file of [
  "scripts/export/pdf.js",
  "scripts/export/png.js",
  "scripts/export/project-json.js",
  "scripts/export/svg.js",
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
