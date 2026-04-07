#!/usr/bin/env node
// Download curated Poly Haven (CC0) furniture models and pack to GLB
// Usage: node scripts/download-ph-assets.js
// Requires: @gltf-transform/cli (npx)

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUT_DIR = path.join(__dirname, '../assets/models');
const TMP_DIR = path.join(__dirname, '../assets/models/tmp_ph');
fs.mkdirSync(TMP_DIR, { recursive: true });

// Curated selection — CC0 from Poly Haven — useful for Rose Designs
const TARGETS = [
  // Seating
  { id: 'ArmChair_01',           outKey: 'ph_armchair_01',       category: 'Seating',  w:2.6, d:2.4, h:3.0 },
  { id: 'modern_arm_chair_01',   outKey: 'ph_armchair_modern',   category: 'Seating',  w:2.4, d:2.6, h:3.0 },
  { id: 'mid_century_lounge_chair', outKey: 'ph_chair_midcentury', category: 'Seating', w:2.4, d:2.8, h:2.8 },
  { id: 'Sofa_01',               outKey: 'ph_sofa_01',           category: 'Seating',  w:6.2, d:2.8, h:2.6 },
  { id: 'sofa_02',               outKey: 'ph_sofa_02',           category: 'Seating',  w:6.5, d:2.8, h:2.6 },
  { id: 'sofa_03',               outKey: 'ph_sofa_03',           category: 'Seating',  w:5.8, d:2.6, h:2.5 },
  { id: 'painted_wooden_sofa',   outKey: 'ph_sofa_painted',      category: 'Seating',  w:5.5, d:2.4, h:3.2 },
  { id: 'Ottoman_01',            outKey: 'ph_ottoman_01',        category: 'Seating',  w:2.4, d:2.4, h:1.4 },
  { id: 'GreenChair_01',         outKey: 'ph_chair_green',       category: 'Seating',  w:2.0, d:2.0, h:3.0 },
  { id: 'chinese_armchair',      outKey: 'ph_chair_chinese',     category: 'Seating',  w:2.2, d:2.0, h:3.4 },
  { id: 'gallinera_chair',       outKey: 'ph_chair_gallinera',   category: 'Seating',  w:1.8, d:1.8, h:3.2 },
  { id: 'painted_wooden_chair_01', outKey: 'ph_chair_painted',   category: 'Seating',  w:1.6, d:1.6, h:3.0 },
  // Stools / Bar
  { id: 'bar_chair_round_01',    outKey: 'ph_bar_chair',         category: 'Seating',  w:1.4, d:1.4, h:2.8 },
  { id: 'metal_stool_01',        outKey: 'ph_stool_metal',       category: 'Seating',  w:1.2, d:1.2, h:2.8 },
  // Tables
  { id: 'CoffeeTable_01',        outKey: 'ph_coffee_table_01',   category: 'Tables',   w:3.8, d:1.8, h:1.3 },
  { id: 'coffee_table_round_01', outKey: 'ph_coffee_round',      category: 'Tables',   w:2.8, d:2.8, h:1.4 },
  { id: 'modern_coffee_table_01',outKey: 'ph_coffee_modern',     category: 'Tables',   w:3.5, d:1.8, h:1.2 },
  { id: 'modern_coffee_table_02',outKey: 'ph_coffee_modern_2',   category: 'Tables',   w:3.2, d:1.6, h:1.2 },
  { id: 'gothic_coffee_table',   outKey: 'ph_coffee_gothic',     category: 'Tables',   w:3.0, d:1.8, h:1.4 },
  { id: 'industrial_coffee_table',outKey:'ph_coffee_industrial', category: 'Tables',   w:3.4, d:1.8, h:1.4 },
  { id: 'WoodenTable_01',        outKey: 'ph_table_wooden',      category: 'Tables',   w:5.0, d:2.6, h:2.5 },
  { id: 'WoodenTable_02',        outKey: 'ph_table_wooden_2',    category: 'Tables',   w:5.5, d:2.8, h:2.5 },
  { id: 'round_wooden_table_01', outKey: 'ph_table_round',       category: 'Tables',   w:3.5, d:3.5, h:2.5 },
  { id: 'painted_wooden_table',  outKey: 'ph_table_painted',     category: 'Tables',   w:5.0, d:2.4, h:2.6 },
  { id: 'gallinera_table',       outKey: 'ph_table_gallinera',   category: 'Tables',   w:4.5, d:2.2, h:2.5 },
  { id: 'side_table_01',         outKey: 'ph_side_table',        category: 'Tables',   w:1.6, d:1.6, h:2.0 },
  { id: 'side_table_tall_01',    outKey: 'ph_side_table_tall',   category: 'Tables',   w:1.4, d:1.4, h:2.8 },
  // Storage / Shelving
  { id: 'Shelf_01',              outKey: 'ph_shelf_01',          category: 'Storage',  w:3.2, d:0.8, h:5.5 },
  { id: 'wooden_bookshelf_worn', outKey: 'ph_bookshelf',         category: 'Storage',  w:3.0, d:0.8, h:6.5 },
  { id: 'ClassicConsole_01',     outKey: 'ph_console_01',        category: 'Storage',  w:3.5, d:0.8, h:2.8 },
  { id: 'chinese_console_table', outKey: 'ph_console_chinese',   category: 'Storage',  w:3.2, d:0.8, h:3.0 },
  { id: 'modern_wooden_cabinet', outKey: 'ph_cabinet_modern',    category: 'Storage',  w:2.8, d:1.0, h:2.8 },
  { id: 'painted_wooden_cabinet',outKey: 'ph_cabinet_painted',   category: 'Storage',  w:2.4, d:0.9, h:2.8 },
  { id: 'vintage_cabinet_01',    outKey: 'ph_cabinet_vintage',   category: 'Storage',  w:2.8, d:1.2, h:5.2 },
  { id: 'drawer_cabinet',        outKey: 'ph_cabinet_drawer',    category: 'Storage',  w:2.4, d:1.0, h:2.4 },
  { id: 'chinese_cabinet',       outKey: 'ph_cabinet_chinese',   category: 'Storage',  w:2.8, d:1.0, h:5.0 },
  // Lighting
  { id: 'Chandelier_01',         outKey: 'ph_chandelier_01',     category: 'Lighting', w:2.5, d:2.5, h:3.0, mount:'ceiling' },
  { id: 'Chandelier_02',         outKey: 'ph_chandelier_02',     category: 'Lighting', w:2.8, d:2.8, h:3.5, mount:'ceiling' },
  { id: 'Chandelier_03',         outKey: 'ph_chandelier_03',     category: 'Lighting', w:3.0, d:3.0, h:4.0, mount:'ceiling' },
  { id: 'chinese_chandelier',    outKey: 'ph_chandelier_chinese',category: 'Lighting', w:2.6, d:2.6, h:3.2, mount:'ceiling' },
  { id: 'lantern_chandelier_01', outKey: 'ph_chandelier_lantern',category: 'Lighting', w:2.2, d:2.2, h:3.5, mount:'ceiling' },
  { id: 'modern_ceiling_lamp_01',outKey: 'ph_lamp_ceiling',      category: 'Lighting', w:1.8, d:1.8, h:1.2, mount:'ceiling' },
  { id: 'desk_lamp_arm_01',      outKey: 'ph_lamp_desk',         category: 'Lighting', w:1.0, d:0.8, h:2.4, mount:'surface' },
  { id: 'hanging_industrial_lamp',outKey:'ph_lamp_industrial',   category: 'Lighting', w:1.2, d:1.2, h:2.0, mount:'ceiling' },
  { id: 'industrial_pipe_lamp',  outKey: 'ph_lamp_pipe',         category: 'Lighting', w:1.0, d:0.6, h:5.5 },
  // Beds / Bedroom
  { id: 'GothicBed_01',          outKey: 'ph_bed_gothic',        category: 'Beds',     w:5.5, d:7.0, h:5.0 },
  { id: 'ClassicNightstand_01',  outKey: 'ph_nightstand_classic',category: 'Beds',     w:1.8, d:1.4, h:2.2 },
  { id: 'painted_wooden_nightstand',outKey:'ph_nightstand',      category: 'Beds',     w:1.6, d:1.4, h:2.0 },
  // Plants / Decor
  { id: 'potted_plant_01',       outKey: 'ph_plant_potted_01',   category: 'Plants',   w:1.2, d:1.2, h:2.4 },
  { id: 'potted_plant_02',       outKey: 'ph_plant_potted_02',   category: 'Plants',   w:1.4, d:1.4, h:2.8 },
  { id: 'potted_plant_04',       outKey: 'ph_plant_potted_04',   category: 'Plants',   w:1.0, d:1.0, h:1.8 },
  { id: 'planter_pot_clay',      outKey: 'ph_planter_clay',      category: 'Plants',   w:0.8, d:0.8, h:1.2 },
  { id: 'ornate_mirror_01',      outKey: 'ph_mirror_ornate',     category: 'Decor',    w:2.0, d:0.2, h:4.0, mount:'wall' },
  { id: 'ceramic_vase_01',       outKey: 'ph_vase_ceramic_01',   category: 'Decor',    w:0.5, d:0.5, h:1.2 },
  { id: 'brass_vase_01',         outKey: 'ph_vase_brass_01',     category: 'Decor',    w:0.4, d:0.4, h:1.0 },
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const proto = url.startsWith('https') ? https : http;
    proto.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => { fs.unlink(dest, () => {}); reject(err); });
  });
}

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function downloadAndPack(target) {
  const { id, outKey } = target;
  const glbOut = path.join(OUT_DIR, outKey + '.glb');

  if (fs.existsSync(glbOut)) {
    console.log(`  SKIP ${outKey} (already exists)`);
    return true;
  }

  const assetDir = path.join(TMP_DIR, id);
  fs.mkdirSync(path.join(assetDir, 'textures'), { recursive: true });

  // Get file manifest
  let manifest;
  try {
    manifest = await fetchJson(`https://api.polyhaven.com/files/${id}`);
  } catch(e) {
    console.log(`  FAIL ${id} — API error: ${e.message}`);
    return false;
  }

  const gltf1k = manifest.gltf?.['1k']?.gltf;
  if (!gltf1k) {
    console.log(`  FAIL ${id} — no 1k GLTF`);
    return false;
  }

  // Download GLTF + all included files
  const mainUrl = gltf1k.url;
  const gltfFile = path.join(assetDir, path.basename(mainUrl));
  try {
    await download(mainUrl, gltfFile);
    for (const [relPath, info] of Object.entries(gltf1k.include || {})) {
      const dest = path.join(assetDir, relPath);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      await download(info.url, dest);
    }
  } catch(e) {
    console.log(`  FAIL ${id} — download error: ${e.message}`);
    return false;
  }

  // Convert GLTF → GLB using gltf-transform
  try {
    execSync(
      `npx @gltf-transform/cli cp "${gltfFile}" "${glbOut}"`,
      { stdio: 'pipe', cwd: assetDir }
    );
    const size = Math.round(fs.statSync(glbOut).size / 1024);
    console.log(`  OK   ${outKey}.glb (${size}KB)`);
    return true;
  } catch(e) {
    console.log(`  FAIL ${id} — pack error: ${e.message.slice(0,100)}`);
    return false;
  }
}

async function main() {
  console.log(`\nDownloading ${TARGETS.length} Poly Haven models (CC0)\n`);
  const results = { ok: [], fail: [] };

  for (const target of TARGETS) {
    process.stdout.write(`Processing ${target.id}... `);
    const ok = await downloadAndPack(target);
    if (ok) results.ok.push(target.outKey);
    else results.fail.push(target.id);
  }

  console.log(`\n\nDone: ${results.ok.length} OK, ${results.fail.length} failed`);
  if (results.fail.length) console.log('Failed:', results.fail.join(', '));

  // Output registration data for manual insertion
  const reg = TARGETS.filter(t => results.ok.includes(t.outKey));
  console.log('\n// MODEL_REGISTRY entries (add to storage.js):');
  reg.forEach(t => {
    const mount = t.mount || 'floor';
    console.log(`  ${t.outKey}: {file:'${t.outKey}.glb',category:'${t.category}',mountType:'${mount}',defaultScale:1.0,yOffset:0,fit:'footprint'},`);
  });

  fs.writeFileSync(
    path.join(__dirname, '../data/ph-download-results.json'),
    JSON.stringify({ ok: results.ok, fail: results.fail, targets: TARGETS }, null, 2)
  );
}

main().catch(console.error);
