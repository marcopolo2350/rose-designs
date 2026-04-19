/**
 * Phase 1C — Selective Kenney furniture kit import.
 * Picks ~15 items not already represented by existing kn_* entries or real-GLB
 * alternatives (Poly Haven / temp pack). Kenney is CC0 low-poly — used here for
 * structural + niche gaps (dryer, corner cabinets, TV cabinet, rug doormat, etc.).
 * Run with: node scripts/absorb-kenney.mjs
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const srcDir = path.join(repoRoot, 'assets', 'kenney_furniture-kit', 'Models', 'GLTF format');
const dstDir = path.join(repoRoot, 'assets', 'models');
const manifestPath = path.join(repoRoot, 'data', 'asset-manifest.json');

const PICKS = [
  ['dryer.glb',                        'kn_dryer',                 'Dryer',                  'Laundry',  'appliance', ['laundry'], ['laundry','dryer','appliance'], 1, 'floor'],
  ['kitchenCabinetCornerInner.glb',    'kn_kitchen_corner_inner',  'Corner Cabinet (Inner)', 'Kitchen',  'cabinet',   ['kitchen'], ['kitchen','cabinet','corner'], 1, 'floor'],
  ['kitchenCabinetCornerRound.glb',    'kn_kitchen_corner_round',  'Corner Cabinet (Round)', 'Kitchen',  'cabinet',   ['kitchen'], ['kitchen','cabinet','corner','round'], 1, 'floor'],
  ['kitchenBar.glb',                   'kn_kitchen_bar',           'Kitchen Bar',            'Kitchen',  'counter',   ['kitchen','dining_room'], ['kitchen','bar','counter'], 1, 'floor'],
  ['kitchenBarEnd.glb',                'kn_kitchen_bar_end',       'Bar End',                'Kitchen',  'counter',   ['kitchen'], ['kitchen','bar','end'], 1, 'floor'],
  ['hoodModern.glb',                   'kn_hood_modern',           'Range Hood (Modern)',    'Kitchen',  'appliance', ['kitchen'], ['kitchen','hood','vent','modern'], 1, 'ceiling'],
  ['hoodLarge.glb',                    'kn_hood_large',            'Range Hood (Large)',     'Kitchen',  'appliance', ['kitchen'], ['kitchen','hood','vent','large'], 1, 'ceiling'],
  ['cabinetTelevision.glb',            'kn_cabinet_tv',            'TV Cabinet',             'Storage',  'media',     ['living_room','bedroom'], ['tv','cabinet','media'], 1, 'floor'],
  ['cabinetTelevisionDoors.glb',       'kn_cabinet_tv_doors',      'TV Cabinet (Doors)',     'Storage',  'media',     ['living_room','bedroom'], ['tv','cabinet','media','doors'], 1, 'floor'],
  ['doorwayOpen.glb',                  'kn_doorway_open',          'Open Doorway Frame',     'Openings', 'doorway',   ['living_room','entry','dining_room'], ['doorway','opening','passage'], 1, 'wall'],
  ['paneling.glb',                     'kn_paneling',              'Wall Paneling',          'Wall Decor','panel',    ['living_room','dining_room','entry'], ['paneling','wall','trim'], 1, 'wall'],
  ['kitchenFridgeSmall.glb',           'kn_fridge_small',          'Fridge (Small)',         'Kitchen',  'appliance', ['kitchen'], ['kitchen','fridge','small','apartment'], 1, 'floor'],
  ['kitchenFridgeBuiltIn.glb',         'kn_fridge_builtin',        'Fridge (Built-in)',      'Kitchen',  'appliance', ['kitchen'], ['kitchen','fridge','builtin','luxury'], 1, 'floor'],
  ['loungeSofaCorner.glb',             'kn_lounge_sectional',      'Corner Sectional Sofa',  'Seating',  'sofa',      ['living_room'], ['sofa','sectional','corner','lounge'], 1, 'floor'],
  ['computerMouse.glb',                'kn_computer_mouse',        'Computer Mouse',         'Decor',    'tech',      ['office'], ['mouse','computer','desk'], 1, 'floor'],
  ['rugDoormat.glb',                   'kn_rug_doormat',           'Doormat',                'Rugs',     'doormat',   ['entry'], ['rug','doormat','entry'], 1, 'floor'],
  ['coatRackStanding.glb',             'kn_coat_rack_standing',    'Standing Coat Rack',     'Storage',  'rack',      ['entry','bedroom'], ['coat','rack','standing'], 1, 'floor'],
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
      collections: ['Kenney Kit'],
      recommendedRoomTypes: rooms,
      variants: [],
      source: 'Kenney (CC0)',
    });
    copied++;
    console.log(`  [add]  ${id}  ←  ${src}`);
  }

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nDone. Added: ${copied}, Skipped: ${skipped}, Missing: ${missing}. Manifest total: ${manifest.length}`);
}

main().catch(err => { console.error(err); process.exitCode = 1; });
