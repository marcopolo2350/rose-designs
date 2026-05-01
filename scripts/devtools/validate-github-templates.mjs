import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => readFileSync(path.join(root, file), "utf8");
const errors = [];

const prTemplate = read(".github/pull_request_template.md");
const bugTemplate = read(".github/ISSUE_TEMPLATE/bug_report.md");
const featureTemplate = read(".github/ISSUE_TEMPLATE/feature_request.md");
const dependabot = read(".github/dependabot.yml");
const verifyWorkflow = read(".github/workflows/verify.yml");

const requiredPrCommands = [
  "npm run check",
  "npm run lint",
  "npm run format",
  "npm run validate:manifest",
  "npm run validate:asset-sizes",
  "npm run validate:asset-sources",
  "npm run validate:static-a11y",
  "npm run validate:dev-mode",
  "npm run validate:github-templates",
  "npm run validate:inline-handlers",
  "npm run validate:docs",
  "npm run validate:html-safety",
  "npm run validate:storage-keys",
  "npm run validate:error-handling",
  "npm run validate:runtime-modules",
  "npm run validate:dependencies",
  "npm run validate:project-schema",
  "npm run validate:app-state",
  "npm run validate:geometry",
  "npm run validate:3d-lifecycle",
  "npm run validate:export-filenames",
  "npm run test:playwright",
  "npm run test:self",
  "npm run test:smoke",
  "npm test",
];

for (const command of requiredPrCommands) {
  if (!prTemplate.includes(`\`${command}\``)) {
    errors.push(`PR template is missing verification command: ${command}`);
  }
}

for (const phrase of [
  "preserves existing app behavior",
  "does not add new product modes",
  "deferred debt",
]) {
  if (!prTemplate.includes(phrase)) errors.push(`PR template is missing scope phrase: ${phrase}`);
}

for (const phrase of ["console errors/warnings", "app version", "project JSON involved"]) {
  if (!bugTemplate.includes(phrase))
    errors.push(`Bug template is missing evidence field: ${phrase}`);
}

for (const phrase of [
  "Why this belongs during hardening",
  "Non-goals",
  "new product modes",
  "Verification Needed",
]) {
  if (!featureTemplate.includes(phrase)) {
    errors.push(`Feature template is missing hardening discipline field: ${phrase}`);
  }
}

if (!/package-ecosystem:\s*"npm"/.test(dependabot) || !/interval:\s*"weekly"/.test(dependabot)) {
  errors.push("Dependabot must be configured for weekly npm dependency checks.");
}

const requiredActions = [
  "actions/checkout@v6",
  "actions/setup-node@v6",
  "actions/setup-python@v6",
  "actions/upload-artifact@v7",
];

for (const action of requiredActions) {
  if (!verifyWorkflow.includes(action)) {
    errors.push(`Verify workflow is missing current action pin: ${action}`);
  }
}

if (!verifyWorkflow.includes("FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true")) {
  errors.push("Verify workflow must keep Node 24 JavaScript action opt-in enabled.");
}

if (errors.length) {
  console.error("GitHub template validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("GitHub template validation passed.");
