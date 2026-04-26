import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const port = 8138;

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

const child = spawn(
  process.execPath,
  [
    "./web_game_playwright_client.js",
    "--url",
    `http://127.0.0.1:${port}/index.html`,
    "--click-selector",
    ".w-btn",
    "--click",
    "24,24",
    "--iterations",
    "1",
    "--pause-ms",
    "300",
    "--screenshot-dir",
    "output/web-game-smoke",
  ],
  {
    cwd: root,
    stdio: "inherit",
  },
);

const exitCode = await new Promise((resolve) => child.on("exit", resolve));
server.close();

if (exitCode !== 0) {
  process.exit(exitCode || 1);
}
