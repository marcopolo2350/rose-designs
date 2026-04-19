/**
 * Phase 1B — Cherry-pick from temp_furniture_pack/ into the main catalog.
 * Same shape/flow as absorb-temp-house.mjs.
 * Run with: node scripts/absorb-temp-furniture.mjs
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const srcDir = path.join(repoRoot, 'temp_furniture_pack');
const dstDir = path.join(repoRoot, 'assets', 'models');
const manifestPath = path.join(repoRoot, 'data', 'asset-manifest.json');

const PICKS = [
  ['Bed Double.glb',         'tfp_bed_double',     'Double Bed',           'Beds',    'bed',      ['bedroom'], ['bed','double','full'], 1, 'floor'],
  ['Bed Twin.glb',           'tfp_bed_twin',       'Twin Bed',             'Beds',    'bed',      ['bedroom'], ['bed','twin','single'], 1, 'floor'],
  ['Bookcase with Books.glb','tfp_bookcase_books', 'Bookcase with Books',  'Storage', 'bookcase', ['living_room','office','bedroom'], ['bookcase','shelf','books','decor'], 1, 'floor'],
  ['Office Chair.glb',       'tfp_office_chair',   'Office Chair',         'Seating', 'chair',    ['office','bedroom'], ['chair','office','desk','task'], 1, 'floor'],
  ['Closet.glb',             'tfp_closet',         'Tall Closet',          'Storage', 'closet',   ['bedroom','entry'], ['closet','wardrobe','storage'], 1, 'floor'],
  ['Short Closet.glb',       'tfp_closet_short',   'Short Closet',         'Storage', 'closet',   ['bedroom','entry'], ['closet','wardrobe','storage','short'], 1, 'floor'],
  ['Desk.glb',               'tfp_desk',           'Desk',                 'Tables',  'desk',     ['office','bedroom'], ['desk','office','work'], 1, 'floor'],
  ['Sofa.glb',               'tfp_sofa',           'Sofa (Realistic)',     'Seating', 'sofa',     ['living_room'], ['sofa','couch','realistic'], 1, 'floor'],
  ['Stool.glb',              'tfp_stool',          'Stool (Variant)',      'Seating', 'stool',    ['kitchen','dining_room'], ['stool','seat','variant'], 1, 'floor'],
  ['Night Stand.glb',        'tfp_night_stand',    'Nightstand (Realistic)','Storage','nightstand',['bedroom'], ['nightstand','bedside','storage'], 1, 'floor'],
];

async function main() {
  const raw = await fs.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(raw);
  const existing = new Set(manifest.map(m => m.id));

  let copied = 0, skipped = 0, missing = 0;
  for (const [src, id, name, cat, sub, rooms, tags, scale, mount] of PICKS) {
    if (existing.has(id)) { skipped++; console.log(`  [skip] ${id}`); continue; }
    const srcPath = path.join(srcDir, src);
    if (!existsSync(srcPath)) { missing++; console.log(`  [miss] ${src}`); continue; }
    const dstPath = path.join(dstDir, `${id}.glb`);
    if (!existsSync(dstPath)) await fs.copyFile(srcPath, dstPath);
    manifest.push({
      id, name,
      category: cat,
      subcategory: sub,
      modelPath: `./assets/models/${id}.glb`,
      thumbnailPath: `./assets/thumbnails/${id}.png`,
      defaultScale: scale,
      mountType: mount,
      tags,
      collections: ['Furniture Pack'],
      recommendedRoomTypes: rooms,
      variants: [],
      source: 'temp_furniture_pack',
    });
    copied++;
    console.log(`  [add]  ${id}  ←  ${src}`);
  }

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nDone. Added: ${copied}, Skipped: ${skipped}, Missing: ${missing}. Manifest total: ${manifest.length}`);
}

main().catch(err => { console.error(err); process.exitCode = 1; });
