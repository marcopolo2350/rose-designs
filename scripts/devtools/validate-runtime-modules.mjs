import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const mainPath = path.join(root, "scripts", "main.js");
const indexPath = path.join(root, "index.html");
const legacyHtmlPath = path.join(root, "roses-indoor-designs.html");
const mainSource = readFileSync(mainPath, "utf8");
const indexSource = readFileSync(indexPath, "utf8");
const errors = [];

const modulesBlock = mainSource.match(/const\s+RUNTIME_MODULES\s*=\s*\[([\s\S]*?)\];/);
if (!modulesBlock) {
  errors.push("scripts/main.js is missing the RUNTIME_MODULES list.");
} else {
  const modules = [...modulesBlock[1].matchAll(/["']([^"']+)["']/g)].map((match) => match[1]);
  const seen = new Set();
  for (const modulePath of modules) {
    if (seen.has(modulePath)) {
      errors.push(`Duplicate runtime module: ${modulePath}`);
    }
    seen.add(modulePath);
    if (!modulePath.startsWith("./scripts/")) {
      errors.push(`Runtime module must be under ./scripts/: ${modulePath}`);
      continue;
    }
    const absolutePath = path.join(root, modulePath.replace(/^\.\//, ""));
    if (!existsSync(absolutePath)) {
      errors.push(`Missing runtime module file: ${modulePath}`);
    }
  }
  if (!modules.length) {
    errors.push("RUNTIME_MODULES must contain at least one module.");
  }
  if (modules[0] !== "./scripts/core/app-config.js") {
    errors.push("app-config must remain the first runtime module.");
  }
  if (!modules.includes("./scripts/core/error-reporting.js")) {
    errors.push("error-reporting must remain in the runtime module bridge.");
  }
  if (!modules.includes("./scripts/walkthrough.js")) {
    errors.push(
      "walkthrough.js must remain in the runtime module bridge because it registers boot().",
    );
  }
}

const mainEntrypoints = [
  ...indexSource.matchAll(/<script[^>]+src=["']\.\/scripts\/main\.js[^"']*["'][^>]*>/g),
];
const legacyEntrypoints = [
  ...indexSource.matchAll(/<script[^>]+src=["']\.\/scripts\/app\.js[^"']*["'][^>]*>/g),
];
if (mainEntrypoints.length !== 1) {
  errors.push(
    `index.html must load ./scripts/main.js exactly once; found ${mainEntrypoints.length}.`,
  );
}
if (legacyEntrypoints.length) {
  errors.push("index.html must not load the legacy ./scripts/app.js bridge.");
}
if (existsSync(legacyHtmlPath)) {
  errors.push("roses-indoor-designs.html must not exist as a redirect-only entrypoint.");
}
if (/http-equiv=["']refresh["']/i.test(indexSource)) {
  errors.push("index.html must be the real app shell, not a meta-refresh redirect.");
}

if (errors.length) {
  console.error("Runtime module bridge validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Runtime module bridge validation passed.");
