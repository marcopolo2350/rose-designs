import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const css = readFileSync(path.join(root, "styles/app.css"), "utf8");
const errors = [];

for (const token of [
  "--z-3d",
  "--z-floating",
  "--z-panel",
  "--z-menu",
  "--z-modal",
  "--z-overlay",
  "--z-devtools",
  "--z-verify",
  "--z-welcome",
]) {
  if (!css.includes(token)) errors.push(`Missing z-index token: ${token}`);
}

if (!css.includes(":focus-visible")) {
  errors.push("Global focus-visible styling is missing.");
}

if (!css.includes("prefers-reduced-motion:reduce")) {
  errors.push("Reduced-motion media query is missing.");
}

if (!css.includes("env(safe-area-inset-bottom")) {
  errors.push("Mobile safe-area bottom handling is missing.");
}

if (!css.includes("body:not(.dev-mode) .dev-only")) {
  errors.push("Dev-only UI hiding rule is missing.");
}

const blockedPatterns = [
  { pattern: /letter-spacing\s*:\s*-[^;]+/i, label: "negative letter-spacing" },
  { pattern: /outline\s*:\s*none/i, label: "outline removal" },
  { pattern: /font-size\s*:\s*calc\([^;]*vw/i, label: "viewport-scaled font size" },
];

for (const { pattern, label } of blockedPatterns) {
  const match = css.match(pattern);
  if (match) errors.push(`Blocked CSS pattern found (${label}): ${match[0]}`);
}

if (errors.length) {
  console.error("CSS validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("CSS validation passed.");
