import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const workflow = readFileSync(path.join(root, ".github", "workflows", "verify.yml"), "utf8");
const nvmrcPath = path.join(root, ".nvmrc");
const errors = [];

const scripts = packageJson.scripts || {};
const devDependencies = packageJson.devDependencies || {};
const dependencies = packageJson.dependencies || {};

function requireScript(name, expected) {
  if (!scripts[name]) {
    errors.push(`package.json is missing script: ${name}`);
    return;
  }
  if (expected && scripts[name] !== expected) {
    errors.push(`package.json script ${name} must be "${expected}", found "${scripts[name]}"`);
  }
}

for (const [field, expectedType] of [
  ["name", "string"],
  ["version", "string"],
  ["description", "string"],
  ["license", "string"],
  ["homepage", "string"],
  ["repository", "object"],
  ["bugs", "object"],
]) {
  if (typeof packageJson[field] !== expectedType) {
    errors.push(`package.json field ${field} must be a ${expectedType}.`);
  }
}

if (packageJson.private !== true) {
  errors.push("package.json must stay private while this app is not published to npm.");
}
if (packageJson.type !== "module") {
  errors.push('package.json must keep "type": "module" for the Node validation scripts.');
}
if (!packageJson.engines?.node) {
  errors.push("package.json must declare engines.node.");
}
if (!existsSync(nvmrcPath)) {
  errors.push(".nvmrc must exist for local Node version guidance.");
} else {
  const nvmrc = readFileSync(nvmrcPath, "utf8").trim();
  if (!/^\d+(?:\.\d+){0,2}$/.test(nvmrc)) {
    errors.push(`.nvmrc must contain a plain Node version number, found "${nvmrc}".`);
  }
  if (!workflow.includes(`node-version: ${nvmrc}`)) {
    errors.push(`Verify workflow must use node-version: ${nvmrc} to match .nvmrc.`);
  }
}

const requiredScripts = [
  ["dev", "python -m http.server 8123"],
  ["test:playwright", "playwright test"],
  ["test:smoke", "node ./scripts/devtools/run-smoke.mjs"],
  ["test:self", "node ./scripts/devtools/run-selftest.mjs"],
  ["thumbs", "node ./scripts/generate-thumbnails.mjs"],
  ["clean", "node ./scripts/devtools/clean.mjs"],
  ["check", "node ./scripts/devtools/check-syntax.mjs"],
  ["validate:package", "node ./scripts/devtools/validate-package.mjs"],
];

for (const [name, expected] of requiredScripts) {
  requireScript(name, expected);
}

for (const name of [
  "lint",
  "format",
  "validate:version",
  "validate:manifest",
  "validate:asset-sizes",
  "validate:asset-sources",
  "validate:static-a11y",
  "validate:text-encoding",
  "validate:dev-mode",
  "validate:github-templates",
  "validate:workflow",
  "validate:docs",
  "validate:structure",
  "validate:global-bridge",
  "validate:css",
  "validate:html-safety",
  "validate:storage-keys",
  "validate:inline-handlers",
  "validate:error-handling",
  "validate:runtime-modules",
  "validate:dependencies",
  "validate:cloud-boundary",
  "validate:clean-ignore",
  "validate:project-schema",
  "validate:app-state",
  "validate:geometry",
  "validate:furniture-style",
  "validate:reference-overlay",
  "validate:snapping",
  "validate:placement-rules",
  "validate:3d-lifecycle",
  "validate:3d-lighting",
  "validate:3d-camera",
  "validate:3d-materials",
  "validate:3d-model-loader",
  "validate:3d-walls",
  "validate:export-filenames",
]) {
  requireScript(name);
}

if (!scripts.test?.includes("npm run validate:package")) {
  errors.push("npm test must include npm run validate:package.");
}
if (!workflow.includes("run: npm run validate:package")) {
  errors.push("Verify workflow must run npm run validate:package.");
}

for (const packageName of ["@eslint/js", "eslint", "playwright", "prettier"]) {
  if (!devDependencies[packageName]) {
    errors.push(`${packageName} must remain in devDependencies.`);
  }
}
for (const packageName of Object.keys(dependencies)) {
  errors.push(
    `${packageName} is in dependencies; runtime dependencies must be intentionally documented before being added.`,
  );
}

if (errors.length) {
  console.error("Package/tooling validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Package/tooling validation passed.");
