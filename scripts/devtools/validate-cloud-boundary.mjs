import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];

function read(file) {
  return readFileSync(path.join(root, file), "utf8");
}

function requireFile(file) {
  const absolute = path.join(root, file);
  if (!existsSync(absolute)) {
    errors.push(`Missing required cloud boundary file: ${file}`);
    return "";
  }
  return readFileSync(absolute, "utf8");
}

function requireText(label, source, text) {
  if (!source.includes(text)) {
    errors.push(`${label} is missing required text: ${text}`);
  }
}

const cloudSource = requireFile("scripts/cloud/supabase.js");
const cloudDocs = requireFile("docs/cloud-sync.md");
const cloudSchema = requireFile("docs/cloud-schema.sql");
const appConfig = requireFile("scripts/core/app-config.js");
const readme = requireFile("README.md");

requireText("app config", appConfig, "cloud: Object.freeze({");
requireText("app config", appConfig, "experimental: true");
requireText("app config", appConfig, 'provider: "Supabase"');

requireText("cloud sync boundary", cloudSource, "Transitional cloud sync boundary");
requireText("cloud sync boundary", cloudSource, "function cloudValidateProjectPayload");
requireText("cloud sync boundary", cloudSource, "function cloudMerge");
requireText("cloud sync boundary", cloudSource, "function cloudPullProjects");
requireText("cloud sync boundary", cloudSource, "function cloudPushProjects");
requireText("cloud sync boundary", cloudSource, "function openCloudSyncSettings");
requireText("cloud sync boundary", cloudSource, 'window.storageKey("cloud::url"');
requireText("cloud sync boundary", cloudSource, "Experimental.");
requireText("cloud sync boundary", cloudSource, "Conflict policy today:");
requireText("cloud sync boundary", cloudSource, "timestamp-based merge with validation");
requireText("cloud sync boundary", cloudSource, "@supabase/supabase-js@2/dist/umd/supabase.min.js");

const windowAssignments = [...cloudSource.matchAll(/\bwindow\.([A-Za-z0-9_$]+)\s*=/g)].map(
  (match) => match[1],
);
const allowedWindowAssignments = ["openCloudSyncSettings", "cloudSync"];
for (const name of windowAssignments) {
  if (!allowedWindowAssignments.includes(name)) {
    errors.push(`Cloud boundary must not expose unexpected window global: window.${name}`);
  }
}

const forbiddenPatterns = [
  { label: "direct projects assignment", pattern: /\bprojects\s*=(?!=)/ },
  { label: "direct curRoom assignment", pattern: /\bcurRoom\s*=(?!=)/ },
  { label: "direct persistence recursion", pattern: /\bsaveAll\s*\(/ },
  { label: "raw IndexedDB access", pattern: /\bindexedDB\.open\s*\(/ },
  { label: "string-built modal HTML", pattern: /\.innerHTML\s*=|insertAdjacentHTML\s*\(/ },
];

for (const { label, pattern } of forbiddenPatterns) {
  if (pattern.test(cloudSource)) {
    errors.push(`Cloud boundary contains forbidden ${label}.`);
  }
}

for (const [label, source] of [
  ["docs/cloud-sync.md", cloudDocs],
  ["docs/cloud-schema.sql", cloudSchema],
]) {
  for (const term of ["Experimental", "Supabase", "Row Level Security", "timestamp-based"]) {
    requireText(label, source, term);
  }
  if (/Phase\s+\d|\u00e2|\ufffd/.test(source)) {
    errors.push(`${label} contains phase-history or mojibake text.`);
  }
}

for (const term of ["docs/cloud-sync.md", "cloud sync is optional", "lower-confidence"]) {
  requireText("README", readme, term);
}

if (!read("package.json").includes('"validate:cloud-boundary"')) {
  errors.push("package.json is missing validate:cloud-boundary.");
}

if (errors.length) {
  console.error("Cloud boundary validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Cloud boundary validation passed.");
