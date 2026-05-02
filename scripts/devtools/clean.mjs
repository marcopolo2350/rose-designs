import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const targets = [
  path.join(root, ".edge-headless"),
  path.join(root, ".edge-profile"),
  path.join(root, "output"),
  path.join(root, "output", "web-game-smoke"),
  path.join(root, "output", "playwright"),
  path.join(root, "tmp_playwright"),
  path.join(root, "tmp_playwright_quick"),
  path.join(root, "tmp_playwright_selftest"),
  path.join(root, "tmpshots"),
  path.join(root, ".selftest-dom.html"),
  path.join(root, ".selftest-server.pid"),
  path.join(root, "poly_bundle_test.bin"),
  path.join(root, "tmp_actions.json"),
];

const filePatterns = [
  /^debug_.*\.png$/i,
  /^output_.*\.png$/i,
  /^preview_existing_room_.*\.png$/i,
  /^rose-selftest\.png$/i,
  /^presentation-pass\.png$/i,
  /^presentation-reveal.*\.png$/i,
  /^presentation-.*\.png$/i,
];

function isInsideRoot(target) {
  const relative = path.relative(root, target);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

for (const target of targets) {
  if (!isInsideRoot(target)) {
    throw new Error(`Refusing to clean outside repository root: ${target}`);
  }
  fs.rmSync(target, { recursive: true, force: true });
}

for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  if (!filePatterns.some((pattern) => pattern.test(entry.name))) continue;
  const target = path.join(root, entry.name);
  if (!isInsideRoot(target)) {
    throw new Error(`Refusing to clean outside repository root: ${target}`);
  }
  fs.rmSync(target, { force: true });
}

console.log("Cleaned smoke, self-test, and temporary output artifacts.");
