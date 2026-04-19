/**
 * Phase 1A — Cherry-pick assets from temp_house_interior/ into the main catalog.
 * Copies selected GLB files to assets/models/ with snake_case IDs and appends
 * matching entries to data/asset-manifest.json (skips any IDs already registered).
 * Run with: node scripts/absorb-temp-house.mjs
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const srcDir = path.join(repoRoot, 'temp_house_interior');
const dstDir = path.join(repoRoot, 'assets', 'models');
const manifestPath = path.join(repoRoot, 'data', 'asset-manifest.json');

// [sourceFileName, newId, name, category, subcategory, rooms, tags, scale, mountType]
const PICKS = [
  // Kitchen (alternates to primitive-generated entries)
  ['Kitchen Fridge.glb',         'thi_kitchen_fridge',    'Fridge (Realistic)',       'Kitchen',  'appliance', ['kitchen'], ['kitchen','appliance','fridge','realistic'], 1, 'floor'],
  ['Kitchen Sink.glb',           'thi_kitchen_sink',      'Kitchen Sink (Realistic)', 'Kitchen',  'appliance', ['kitchen'], ['kitchen','appliance','sink','realistic'], 1, 'floor'],
  ['Oven.glb',                   'thi_kitchen_oven',      'Oven (Realistic)',         'Kitchen',  'appliance', ['kitchen'], ['kitchen','appliance','oven','stove','realistic'], 1, 'floor'],
  // Bathroom
  ['Bathroom Sink.glb',          'thi_bathroom_sink',     'Bathroom Sink (Realistic)','Bathroom', 'fixture',   ['bathroom'], ['bathroom','fixture','sink','realistic'], 1, 'floor'],
  ['Bathtub.glb',                'thi_bathtub',           'Bathtub (Realistic)',      'Bathroom', 'fixture',   ['bathroom'], ['bathroom','fixture','tub','realistic'], 1, 'floor'],
  ['Toilet.glb',                 'thi_toilet',            'Toilet (Realistic)',       'Bathroom', 'fixture',   ['bathroom'], ['bathroom','fixture','toilet','realistic'], 1, 'floor'],
  ['Bathroom Toilet Paper.glb',  'thi_toilet_paper',      'Toilet Paper Roll',        'Bathroom', 'accessory', ['bathroom'], ['bathroom','accessory','paper'], 1, 'floor'],
  ['Toilet Paper stack.glb',     'thi_toilet_paper_stack','Toilet Paper Stack',       'Bathroom', 'accessory', ['bathroom'], ['bathroom','accessory','paper','stack'], 1, 'floor'],
  ['Towel Rack.glb',             'thi_towel_rack',        'Towel Rack (Realistic)',   'Bathroom', 'accessory', ['bathroom'], ['bathroom','accessory','towel','rack'], 1, 'wall'],
  // Laundry
  ['Washing Machine.glb',        'thi_washing_machine',   'Washing Machine (Realistic)','Laundry','appliance',['laundry'], ['laundry','appliance','washer','realistic'], 1, 'floor'],
  // Unique architectural / decor
  ['Fireplace.glb',              'thi_fireplace',         'Fireplace',                'Decor',    'feature',   ['living_room'], ['fireplace','feature','hearth'], 1, 'wall'],
  ['Column Round.glb',           'thi_column_round',      'Round Column',             'Decor',    'structural',['living_room','entry','dining_room'], ['column','structural','round'], 1, 'floor'],
  ['Bunk Bed.glb',               'thi_bunk_bed',          'Bunk Bed',                 'Beds',     'bed',       ['bedroom'], ['bed','bunk','kids'], 1, 'floor'],
  ['L Couch.glb',                'thi_l_couch',           'L-Shaped Sectional',       'Seating',  'sofa',      ['living_room'], ['sofa','sectional','l-shape'], 1, 'floor'],
  ['Stool.glb',                  'thi_stool',             'Stool',                    'Seating',  'stool',     ['kitchen','dining_room'], ['stool','seat'], 1, 'floor'],
  ['Trashcan Large.glb',         'thi_trashcan_large',    'Trash Can (Large)',        'Utility',  'trashcan',  ['kitchen','office'], ['trash','bin','utility'], 1, 'floor'],
  ['Trashcan.glb',               'thi_trashcan',          'Trash Can',                'Utility',  'trashcan',  ['kitchen','office','bathroom'], ['trash','bin','utility'], 1, 'floor'],
  ['Light Chandelier.glb',       'thi_chandelier',        'Chandelier',               'Lighting', 'ceiling',   ['dining_room','living_room','bedroom'], ['lighting','chandelier','ceiling'], 1, 'ceiling'],
  ['Dead Houseplant.glb',        'thi_dead_houseplant',   'Dead Houseplant',          'Plants',   'plant',     ['living_room','office'], ['plant','dead','humor'], 1, 'floor'],
  ['Square Plate.glb',           'thi_square_plate',      'Square Plate',             'Decor',    'tabletop',  ['dining_room','kitchen'], ['plate','tableware','tabletop'], 1, 'floor'],
];

async function main() {
  const raw = await fs.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(raw);
  const existing = new Set(manifest.map(m => m.id));

  let copied = 0, skipped = 0, missing = 0;
  for (const [src, id, name, cat, sub, rooms, tags, scale, mount] of PICKS) {
    if (existing.has(id)) { skipped++; console.log(`  [skip] ${id} (already in manifest)`); continue; }
    const srcPath = path.join(srcDir, src);
    if (!existsSync(srcPath)) { missing++; console.log(`  [miss] ${src} not found`); continue; }
    const dstPath = path.join(dstDir, `${id}.glb`);
    if (!existsSync(dstPath)) {
      await fs.copyFile(srcPath, dstPath);
    }
    manifest.push({
      id, name,
      category: cat,
      subcategory: sub,
      modelPath: `./assets/models/${id}.glb`,
      thumbnailPath: `./assets/thumbnails/${id}.png`,
      defaultScale: scale,
      mountType: mount,
      tags,
      collections: ['House Interior Pack'],
      recommendedRoomTypes: rooms,
      variants: [],
      source: 'temp_house_interior',
    });
    copied++;
    console.log(`  [add]  ${id}  ←  ${src}`);
  }

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nDone. Added: ${copied}, Skipped: ${skipped}, Missing: ${missing}. Manifest total: ${manifest.length}`);
}

main().catch(err => { console.error(err); process.exitCode = 1; });
