import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const indexSource = readFileSync(path.join(root, "index.html"), "utf8");
const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const scriptSources = [...indexSource.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*>/g)].map(
  (match) => match[1],
);
const cdnSources = scriptSources.filter((src) => /^https?:\/\//.test(src));
const errors = [];
const threeVersions = new Set();
const npmDependencies = {
  ...(packageJson.dependencies || {}),
  ...(packageJson.devDependencies || {}),
};

for (const src of cdnSources) {
  const npmMatch = src.match(/\/npm\/([^/@]+)@([^/]+)\//);
  const cdnjsMatch = src.match(/\/ajax\/libs\/([^/]+)\/([^/]+)\//);
  if (!npmMatch && !cdnjsMatch) {
    errors.push(`CDN script is not pinned with an obvious version: ${src}`);
  }
  if (npmMatch?.[1] === "three") {
    threeVersions.add(npmMatch[2]);
  }
}

if (threeVersions.size > 1) {
  errors.push(`Mixed Three.js CDN versions found: ${[...threeVersions].join(", ")}`);
}

if (!threeVersions.has("0.147.0")) {
  errors.push("Expected pinned Three.js runtime version 0.147.0 in index.html.");
}

for (const required of ["jspdf", "pdf.js"]) {
  if (!cdnSources.some((src) => src.includes(`/ajax/libs/${required}/`))) {
    errors.push(`Missing documented CDN dependency: ${required}`);
  }
}

if (npmDependencies["dxf-writer"]) {
  errors.push("dxf-writer must stay removed while CAD/DXF export is not part of the app.");
}

if (errors.length) {
  console.error("Dependency validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Dependency validation passed for ${cdnSources.length} pinned CDN scripts.`);
