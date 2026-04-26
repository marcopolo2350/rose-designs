import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const targets = [
  path.join(root, "output", "web-game-smoke"),
  path.join(root, "tmp_playwright"),
  path.join(root, "tmp_playwright_quick"),
];

for (const target of targets) {
  fs.rmSync(target, { recursive: true, force: true });
}

console.log("Cleaned smoke and temporary output folders.");
