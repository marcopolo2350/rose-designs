/**
 * Generates thumbnails only for manifest entries that are missing a thumbnail file.
 * Run with: node scripts/generate-thumbnails-new.mjs
 * Requires dev server running on http://127.0.0.1:8123
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const manifestPath = path.join(repoRoot, 'data', 'asset-manifest.json');
const outDir = path.join(repoRoot, 'assets', 'thumbnails');
const thumbgenUrl = 'http://127.0.0.1:8124/scripts/thumbgen.html';

async function waitForReady(page) {
  await page.waitForFunction(
    () => document.body.dataset.thumbReady === 'true',
    null,
    { timeout: 30000 }
  );
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const raw = await fs.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(raw);

  // Only process entries whose thumbnail file doesn't exist yet
  const missing = manifest.filter(entry => {
    const thumbFile = path.join(repoRoot, (entry.thumbnailPath || '').replace(/^\.\//, ''));
    return !existsSync(thumbFile);
  });

  if (missing.length === 0) {
    console.log('All thumbnails already exist — nothing to generate.');
    return;
  }

  console.log(`Generating thumbnails for ${missing.length} missing entries...`);

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({
    viewport: { width: 640, height: 500 },
    deviceScaleFactor: 1.5,
  });
  page.on('console', msg => {
    if (msg.type() === 'error') console.error('[thumbgen]', msg.text());
  });

  await page.goto(thumbgenUrl, { waitUntil: 'domcontentloaded' });
  // Wait for Three.js + window.thumbgen to initialise (CDN load may take a moment)
  await page.waitForFunction(() => !!window.thumbgen, null, { timeout: 25000 });

  const fallbackIds = [];
  let generated = 0;

  for (const entry of missing) {
    const modelUrl = `http://127.0.0.1:8124/${entry.modelPath.replace(/^\.\//, '')}`;
    console.log(`  [${++generated}/${missing.length}] ${entry.id}`);

    await page.evaluate(async ({ modelUrl, entry }) => {
      await window.thumbgen.renderThumb(modelUrl, entry);
    }, { modelUrl, entry });

    await waitForReady(page);

    const mode = await page.evaluate(() => document.body.dataset.thumbMode || 'render');
    if (mode === 'fallback') fallbackIds.push(entry.id);

    const thumbOut = path.join(outDir, `${entry.id}.png`);
    try {
      const target = mode === 'fallback' ? page.locator('#fallback') : page.locator('canvas');
      await target.screenshot({ path: thumbOut, timeout: 10000 });
    } catch (err) {
      console.log(`    (screenshot failed for ${entry.id}: ${err.message}) — using viewport fallback`);
      await page.screenshot({ path: thumbOut, clip: { x: 0, y: 0, width: 640, height: 500 } });
    }
  }

  await browser.close();

  console.log(`\nDone. Generated: ${generated}, Fallbacks (placeholder thumbnails): ${fallbackIds.length}`);
  if (fallbackIds.length) {
    console.log('Fallback IDs (no 3D model found, got placeholder card):');
    fallbackIds.forEach(id => console.log(`  - ${id}`));
  }
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
