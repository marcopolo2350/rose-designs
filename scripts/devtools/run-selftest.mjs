import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const port = 8137;

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js") || filePath.endsWith(".mjs"))
    return "application/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg";
  if (filePath.endsWith(".glb")) return "model/gltf-binary";
  return "application/octet-stream";
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const target = path.join(root, urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, ""));
  if (!target.startsWith(root) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    res.statusCode = 404;
    res.end("Not found");
    return;
  }
  res.setHeader("Content-Type", contentType(target));
  fs.createReadStream(target).pipe(res);
});

await new Promise((resolve) => server.listen(port, resolve));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
});
page.on("pageerror", (error) => errors.push(`page: ${error.message}`));

await page.goto(`http://127.0.0.1:${port}/index.html#selftest`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => !!window.__lastSelfTest, null, { timeout: 120000 });

const summary = await page.evaluate(() => window.__lastSelfTest);
await browser.close();
server.close();

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

if (!summary || (summary.failed && summary.failed.length)) {
  console.error(JSON.stringify(summary, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(summary, null, 2));
