/**
 * Phase 1E — Download selected Poly Haven models and register in asset-manifest.json.
 * Auto-discovers real slugs from https://api.polyhaven.com/assets?type=models
 * and downloads the textured gltf (with embedded buffers + textures) into assets/models/.
 * All assets are CC0. Usage: node scripts/fetch-polyhaven.mjs
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const manifestPath = path.join(repoRoot, 'data', 'asset-manifest.json');
const modelsDir = path.join(repoRoot, 'assets', 'models');

// Category keywords -> room types / categories. We auto-pick the first N matching models per keyword.
const PICKS_CONFIG = [
  { match:/chair/i,              max:3, category:'Seating',  subcat:'chair',    rooms:['living_room','office','dining_room'] },
  { match:/sofa|couch/i,         max:2, category:'Seating',  subcat:'sofa',     rooms:['living_room'] },
  { match:/table/i,              max:3, category:'Tables',   subcat:'table',    rooms:['dining_room','living_room','office'] },
  { match:/lamp|light/i,         max:3, category:'Lighting', subcat:'lamp',     rooms:['living_room','bedroom','office'] },
  { match:/plant|pot/i,          max:2, category:'Plants',   subcat:'plant',    rooms:['living_room','office'] },
  { match:/vase|bowl|jar/i,      max:2, category:'Decor',    subcat:'vessel',   rooms:['living_room','dining_room'] },
  { match:/book|frame|clock/i,   max:2, category:'Decor',    subcat:'prop',     rooms:['living_room','office'] },
  { match:/rug|carpet/i,         max:1, category:'Rugs',     subcat:'rug',      rooms:['living_room','bedroom'] },
  // Phase ✨ — Soft goods & decor density
  { match:/curtain|drape/i,      max:2, category:'Decor',    subcat:'curtain',  rooms:['living_room','bedroom'] },
  { match:/pillow|cushion/i,     max:2, category:'Decor',    subcat:'pillow',   rooms:['living_room','bedroom'] },
  { match:/blanket|throw/i,      max:1, category:'Decor',    subcat:'throw',    rooms:['living_room','bedroom'] },
  { match:/painting|picture|poster|canvas/i, max:3, category:'Wall Decor', subcat:'art', rooms:['living_room','bedroom','office'] },
  { match:/mirror/i,             max:2, category:'Wall Decor', subcat:'mirror', rooms:['bedroom','bathroom','entry'] },
  { match:/candle|tealight/i,    max:1, category:'Decor',    subcat:'candle',   rooms:['living_room','bedroom'] },
  { match:/fruit|apple|orange/i, max:1, category:'Decor',    subcat:'tabletop', rooms:['dining_room'] },
];
const TOTAL_LIMIT = 25;

// --- fetch helpers ---
function fetchBuffer(url, redirects=3){
  return new Promise((resolve,reject)=>{
    https.get(url, res=>{
      if(res.statusCode>=300 && res.statusCode<400 && res.headers.location && redirects>0){
        return fetchBuffer(res.headers.location, redirects-1).then(resolve).catch(reject);
      }
      if(res.statusCode!==200) return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      const chunks=[];
      res.on('data',c=>chunks.push(c));
      res.on('end',()=>resolve(Buffer.concat(chunks)));
      res.on('error',reject);
    }).on('error',reject);
  });
}
async function fetchJson(url){
  const buf=await fetchBuffer(url);
  return JSON.parse(buf.toString('utf8'));
}

async function fetchOne(slug, meta){
  const outId = `ph_${slug.toLowerCase().replace(/[^a-z0-9_]/g,'_')}`;
  const outPath = path.join(modelsDir, `${outId}.gltf`);
  if(existsSync(outPath)) return { ok:true, id:outId, slug, name:meta.name||slug, skipped:true };
  console.log(`  [fetch] ${slug}`);
  try{
    const files = await fetchJson(`https://api.polyhaven.com/files/${slug}`);
    // find available res (1k preferred)
    let gltfRes = null;
    for(const res of ['1k','2k','4k']){
      if(files?.gltf?.[res]?.gltf){ gltfRes = files.gltf[res].gltf; break; }
    }
    if(!gltfRes?.url) throw new Error('no gltf variant');
    const gltfBuf = await fetchBuffer(gltfRes.url);
    const gltf = JSON.parse(gltfBuf.toString('utf8'));
    // Poly Haven's files endpoint exposes include{path -> {url}} ON gltfRes itself,
    // listing ALL referenced files (bins + textures) with direct CDN URLs.
    const includeMap = {};
    const include = gltfRes.include || {};
    for(const [p, info] of Object.entries(include)){
      if(info?.url) includeMap[p] = info.url;
    }
    const base = gltfRes.url.substring(0, gltfRes.url.lastIndexOf('/')+1);
    const resolveUri = (uri) => includeMap[uri] || (base + uri);

    if(Array.isArray(gltf.buffers)){
      for(const b of gltf.buffers){
        if(b.uri && !b.uri.startsWith('data:')){
          try{
            const bin = await fetchBuffer(resolveUri(b.uri));
            b.uri = `data:application/octet-stream;base64,${bin.toString('base64')}`;
          }catch(e){ throw new Error(`buffer ${b.uri}: ${e.message}`); }
        }
      }
    }
    if(Array.isArray(gltf.images)){
      for(const im of gltf.images){
        if(im.uri && !im.uri.startsWith('data:')){
          try{
            const tx = await fetchBuffer(resolveUri(im.uri));
            const ext = (im.uri.split('.').pop()||'png').toLowerCase();
            const mime = ext==='jpg'||ext==='jpeg' ? 'image/jpeg' : 'image/png';
            im.uri = `data:${mime};base64,${tx.toString('base64')}`;
          }catch(e){
            console.log(`    (texture missing, dropping: ${im.uri})`);
            delete im.uri;
          }
        }
      }
    }
    await fs.writeFile(outPath, JSON.stringify(gltf));
    return { ok:true, id:outId, slug, name:meta.name||slug };
  }catch(err){
    console.log(`  [fail] ${slug}: ${err.message}`);
    return { ok:false, slug, err:err.message };
  }
}

async function main(){
  await fs.mkdir(modelsDir, { recursive:true });
  const manifest = JSON.parse(await fs.readFile(manifestPath,'utf8'));
  const existing = new Set(manifest.map(m=>m.id));

  console.log('Discovering Poly Haven model catalog...');
  const catalog = await fetchJson('https://api.polyhaven.com/assets?type=models');
  const slugs = Object.keys(catalog);
  console.log(`  Found ${slugs.length} models.`);

  // Build the pick list: N per config category, skipping already-registered.
  const picks = [];
  for(const cfg of PICKS_CONFIG){
    let taken = 0;
    for(const slug of slugs){
      if(taken>=cfg.max) break;
      const name = catalog[slug].name||slug;
      if(!cfg.match.test(name) && !cfg.match.test(slug)) continue;
      const outId = `ph_${slug.toLowerCase().replace(/[^a-z0-9_]/g,'_')}`;
      if(existing.has(outId)) continue;
      picks.push({ slug, name, cfg });
      taken++;
      if(picks.length>=TOTAL_LIMIT) break;
    }
    if(picks.length>=TOTAL_LIMIT) break;
  }

  console.log(`\nPlanning to fetch ${picks.length} models:`);
  picks.forEach(p=>console.log(`  - ${p.slug} (${p.name})`));
  console.log();

  const results = [];
  for(const p of picks){
    results.push(await fetchOne(p.slug, { name:p.name, cfg:p.cfg }));
  }

  let added = 0;
  for(let i=0;i<results.length;i++){
    const r = results[i]; if(!r.ok || r.skipped) continue;
    const cfg = picks[i].cfg;
    manifest.push({
      id: r.id,
      name: r.name,
      category: cfg.category,
      subcategory: cfg.subcat,
      modelPath: `./assets/models/${r.id}.gltf`,
      thumbnailPath: `./assets/thumbnails/${r.id}.png`,
      defaultScale: 1,
      mountType: 'floor',
      tags: ['polyhaven'],
      collections: ['Poly Haven'],
      recommendedRoomTypes: cfg.rooms,
      variants: [],
      source: 'Poly Haven (CC0)'
    });
    added++;
  }

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  const failed = results.filter(r=>!r.ok);
  console.log(`\nDone. Added ${added} new models. Manifest total: ${manifest.length}`);
  if(failed.length){
    console.log(`Failed (${failed.length}):`);
    failed.forEach(r=>console.log(`  - ${r.slug}: ${r.err}`));
  }
}

main().catch(err=>{ console.error(err); process.exitCode=1; });
