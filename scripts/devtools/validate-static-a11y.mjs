import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const html = readFileSync(path.join(root, "index.html"), "utf8");
const errors = [];

const attr = (source, name) => {
  const match = source.match(new RegExp(`${name}=["']([^"']*)["']`, "i"));
  return match ? match[1] : "";
};

const stripTags = (source) =>
  source
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
const hasAttr = (source, name) => new RegExp(`\\s${name}(=|\\s|>)`, "i").test(source);

for (const match of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
  const attrs = match[1];
  const body = match[2];
  const label = stripTags(body);
  const ariaLabel = attr(attrs, "aria-label").trim();
  const title = attr(attrs, "title").trim();
  const descriptor = ariaLabel || title || label || attrs.trim() || "<button>";

  if (attr(attrs, "type") !== "button") {
    errors.push(`Button missing type="button": ${descriptor}`);
  }
  if (!label && !ariaLabel && !title) {
    errors.push(`Icon-only button missing accessible name: ${attrs.trim()}`);
  }
}

for (const match of html.matchAll(/<svg\b([^>]*)>/gi)) {
  const attrs = match[1];
  if (attr(attrs, "aria-hidden") !== "true") {
    errors.push(`Decorative static SVG missing aria-hidden="true": ${attrs.trim()}`);
  }
}

for (const match of html.matchAll(/<a\b([^>]*)>/gi)) {
  const attrs = match[1];
  if (attr(attrs, "target").toLowerCase() !== "_blank") continue;
  const rel = attr(attrs, "rel").toLowerCase().split(/\s+/);
  if (!rel.includes("noopener") || !rel.includes("noreferrer")) {
    errors.push(`New-tab link must include rel="noopener noreferrer": ${attrs.trim()}`);
  }
}

for (const match of html.matchAll(
  /<div\b([^>]*class=["'][^"']*(?:modal-bg|verify-overlay)[^"']*["'][^>]*)>/gi,
)) {
  const attrs = match[1];
  const id = attr(attrs, "id") || "<dialog>";
  const labelledBy = attr(attrs, "aria-labelledby");
  if (attr(attrs, "role") !== "dialog") errors.push(`Dialog ${id} missing role="dialog".`);
  if (attr(attrs, "aria-modal") !== "true") errors.push(`Dialog ${id} missing aria-modal="true".`);
  if (!labelledBy) {
    errors.push(`Dialog ${id} missing aria-labelledby.`);
  } else if (
    !new RegExp(`\\bid=["']${labelledBy.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`).test(html)
  ) {
    errors.push(`Dialog ${id} aria-labelledby target not found: ${labelledBy}`);
  }
}

if (/<(?:button|input|select|textarea)\b[^>]*\sautofocus\b/i.test(html)) {
  errors.push("Static app shell should not autofocus controls before modal focus handling runs.");
}

if (/style=["'][^"']*display\s*:\s*none/i.test(html)) {
  errors.push(
    "Static display:none styles must use CSS classes instead of inline style attributes.",
  );
}

if (/<svg\b/i.test(html) && !hasAttr(html, "aria-hidden")) {
  errors.push("Static SVG audit did not find aria-hidden attributes.");
}

if (errors.length) {
  console.error("Static accessibility validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Static accessibility validation passed.");
