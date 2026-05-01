import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => readFileSync(path.join(root, file), "utf8");
const errors = [];

const packageJson = JSON.parse(read("package.json"));
const scripts = packageJson.scripts || {};

const requiredDocs = [
  "README.md",
  "CHANGELOG.md",
  "ROADMAP.md",
  "KNOWN_LIMITATIONS.md",
  "docs/architecture.md",
  "docs/asset-sources.md",
  "docs/data-model.md",
  "docs/dependencies.md",
  "docs/deployment.md",
  "docs/hardening-status.md",
  "docs/testing.md",
];

for (const file of requiredDocs) {
  const absolute = path.join(root, file);
  if (!existsSync(absolute)) {
    errors.push(`Required documentation file is missing: ${file}`);
  } else if (statSync(absolute).size < 80) {
    errors.push(`Documentation file is suspiciously small: ${file}`);
  }
}

const readme = read("README.md");
const testing = read("docs/testing.md");
const hardeningStatus = read("docs/hardening-status.md");
const deployment = read("docs/deployment.md");
const prTemplate = read(".github/pull_request_template.md");

const verifyScripts = Object.keys(scripts)
  .filter(
    (name) =>
      name === "check" ||
      name === "lint" ||
      name === "format" ||
      name === "test" ||
      name.startsWith("test:") ||
      name.startsWith("validate:"),
  )
  .sort();

for (const name of verifyScripts) {
  const command = `npm run ${name}`;
  const normalized = name === "test" ? "npm test" : command;
  if (!readme.includes(normalized)) {
    errors.push(`README is missing package command: ${normalized}`);
  }
  if (!testing.includes(normalized)) {
    errors.push(`docs/testing.md is missing package command: ${normalized}`);
  }
  if (!hardeningStatus.includes(normalized)) {
    errors.push(`docs/hardening-status.md is missing package command: ${normalized}`);
  }
  if (!prTemplate.includes(`\`${normalized}\``)) {
    errors.push(`PR template is missing package command: ${normalized}`);
  }
}

for (const name of ["dev", "dev:alt", "thumbs", "clean"]) {
  if (!scripts[name]) errors.push(`package.json is missing expected script: ${name}`);
  if (!readme.includes(`npm run ${name}`)) {
    errors.push(`README is missing package command: npm run ${name}`);
  }
}

for (const file of ["README.md", "docs/deployment.md"]) {
  const source = file === "README.md" ? readme : deployment;
  if (!source.includes(packageJson.homepage)) {
    errors.push(`${file} is missing canonical GitHub Pages URL: ${packageJson.homepage}`);
  }
}

if (!hardeningStatus.includes(packageJson.version)) {
  errors.push(
    `docs/hardening-status.md does not mention current app version ${packageJson.version}`,
  );
}

if (!/Last updated:\s+2026-05-01/.test(hardeningStatus)) {
  errors.push("docs/hardening-status.md Last updated value is not current.");
}

if (errors.length) {
  console.error("Documentation validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Documentation validation passed for ${requiredDocs.length} files.`);
