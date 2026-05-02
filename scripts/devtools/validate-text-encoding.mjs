import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];

function listFiles(relativePath) {
  const absolute = path.join(root, relativePath);
  const entries = readdirSync(absolute, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const child = path.join(relativePath, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(child));
      continue;
    }
    if (/\.(?:html|css|js|mjs)$/i.test(entry.name)) files.push(child);
  }
  return files;
}

const files = ["index.html", ...listFiles("styles"), ...listFiles("scripts")].sort((a, b) =>
  a.localeCompare(b),
);

const mojibakePattern = /[\u00c2\u00c3\u00c6\u00e2\ufffd]/;
const phaseCommentPattern = /Phase\s+(?:\d|\u2728)/i;
const catalogIconFallbackPattern = /icon:\s*['"][^'"]*\?[^'"]*['"]/;

for (const file of files) {
  const source = readFileSync(path.join(root, file), "utf8");
  const lines = source.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (mojibakePattern.test(line)) {
      errors.push(`${file}:${index + 1} contains likely mojibake text.`);
    }
    if (phaseCommentPattern.test(line)) {
      errors.push(`${file}:${index + 1} contains phase-history text in runtime code.`);
    }
    if (file === "scripts/catalog.js" && catalogIconFallbackPattern.test(line)) {
      errors.push(`${file}:${index + 1} contains a question-mark catalog icon fallback.`);
    }
  });
}

if (errors.length) {
  console.error("Text encoding validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Text encoding validation passed for ${files.length} runtime files.`);
