# Rose Designs — Free Premium Asset Sprint

**Goal:** Import 25+ curated free assets from Poly Haven, ambientCG, and Sketchfab to complete Kitchen, Bathroom, and Living Room categories.

**Status:** Phase 1 ✅ (Asset Discovery Complete)

---

## 📋 Quick Start Checklist

### Phase 1: Asset Discovery ✅
- [x] **asset-acquisitions.json** — Curated list of 25 free assets with download URLs, licenses, real-world dimensions
  - 11 Kitchen assets (cabinets, appliances, lighting, hardware)
  - 8 Bathroom assets (vanities, toilet, tub, mirrors, sconces, tile)
  - 6 Living Room upgrades (sofas, tables, lighting, rugs)

### Phase 2: Download & Normalize (YOU ARE HERE)
- [ ] Create `./assets/models/temp/` directory
- [ ] Download all 25 assets from URLs in **asset-acquisitions.json** into `./temp/`
- [ ] Run Blender batch script to normalize all GLBs
- [ ] Verify normalization log

### Phase 3: Register Assets
- [ ] Run Node.js registration script
- [ ] Manually copy code blocks into storage.js, catalog.js, planner3d.js
- [ ] Verify asset-manifest.json updated
- [ ] Test app loads without errors

### Phase 4: Generate Thumbnails
- [ ] Run thumbnail generation script
- [ ] Verify all PNG thumbnails created in `./assets/thumbnails/`
- [ ] Test catalog UI displays new assets

### Phase 5: License Tracking & Verification
- [ ] Create asset-sources.json with full attribution
- [ ] Run verification tests (load room, add assets, 3D render)
- [ ] Commit to git with "feat: add free premium kitchen/bathroom/living room assets"

---

## 🚀 Phase 2: Download & Normalize (Detailed Instructions)

### Step 1: Prepare Download Directory

```bash
mkdir -p ./assets/models/temp/
```

### Step 2: Download Assets

Go through **data/asset-acquisitions.json** and download each asset:

**Kitchen Assets Example:**
- Cabinet Base: https://sketchfab.com/3d-models/simple-kitchen-cabinet-base-d45f8e → Download as GLB → Save to `./assets/models/temp/cabinet_base_white.glb`
- Island Kitchen: https://polyhaven.com/a/kitchen_island_04 → Download GLB → Save to `./assets/models/temp/island_kitchen.glb`
- Etc.

**Quick Tips:**
- Sketchfab: Click "Download" → Choose "Glyphs & Meshes" format, select GLB
- Poly Haven: Click "Download" → Choose GLB format
- ambientCG: Download PBR texture ZIPs, extract to `./assets/textures/ambientcg/`

### Step 3: Sort Downloaded Files

Now you have ~25 files in `./assets/models/temp/`

Rename them to match asset IDs for easier tracking:
```bash
# Example: Rename sketchfab download to cabinet_base_white.glb
mv "simple-kitchen-cabinet-base-d45f8e.glb" "cabinet_base_white.glb"
```

### Step 4: Run Blender Normalization Script

**Requirements:**
- Blender 3.0+ installed
- Python 3 (Blender comes with its own Python)

**Run from project root:**

```bash
blender --background --python scripts/normalize-assets.py
```

**What it does:**
1. Imports each GLB/FBX from `./assets/models/temp/`
2. Centers origin at base (0, 0, 0)
3. Ensures Y-axis points up
4. Checks scale (~1 unit = 1 foot)
5. Applies all transforms
6. Exports normalized GLB to `./assets/models/`
7. Logs metadata (dimensions, polygon count, materials) to `data/normalization-log.json`

**Output:**
```
✓ Batch processing complete!
  Processed: 25
  Errors: 0
  Log: data/normalization-log.json
```

### Step 5: Verify Normalization

Check `data/normalization-log.json` for any errors:
```json
{
  "processed": [
    {
      "filename": "cabinet_base_white.glb",
      "output": "cabinet_base_white.glb",
      "bounds": { "center": [...], "size": [...] },
      "dimensions": { "width": 1.5, "depth": 0.65, "height": 0.88 },
      "materials": 3,
      "vertices": 4200,
      "polygons": 2850,
      "status": "normalized"
    }
  ],
  "errors": [],
  "skipped": []
}
```

If all show `"status": "normalized"`, you're good! ✅

---

## 🔧 Phase 3: Register Assets (Semi-Automated)

### Step 1: Run Registration Script

```bash
node scripts/register-assets.js
```

**What it does:**
1. Reads **asset-acquisitions.json** and normalization log
2. Generates MODEL_REGISTRY code block
3. Generates FURN_ITEMS array entries
4. Generates verificationTargetSize() entries
5. Auto-updates `data/asset-manifest.json`
6. Outputs code snippets ready to copy-paste

### Step 2: Copy Code into Three Files

The script will output code blocks. Copy-paste them into:

**File 1:** `scripts/storage.js` (line ~193, after existing MODEL_REGISTRY entries)
```javascript
const MODEL_REGISTRY = {
  // ... existing entries ...

  // [PASTE MODEL_REGISTRY ENTRIES HERE]

  // AUTO-GENERATED: Free Premium Assets Sprint
  cabinet_base_white: { file: 'cabinet_base_white.glb', ... },
  // ... more entries ...
};
```

**File 2:** `scripts/catalog.js` (line ~100, within FURN_ITEMS array)
```javascript
const FURN_ITEMS = [
  // ... existing entries ...

  // [PASTE FURN_ITEMS ENTRIES HERE]

  // AUTO-GENERATED: Free Premium Assets Sprint
  {label:'Base Cabinet - White',w:1.5,d:0.65,icon:'🚪',symbol:'C',assetKey:'cabinet_base_white',group:'Kitchen'},
  // ... more entries ...
];
```

**File 3:** `scripts/planner3d.js` (line ~1310, within verificationTargetSize() function)
```javascript
function verificationTargetSize(assetKey) {
  const map = {
    // ... existing entries ...

    // [PASTE VERIFICATION SIZE ENTRIES HERE]

    // AUTO-GENERATED: Free Premium Assets Sprint
    cabinet_base_white: { w: 1.5, d: 0.65, h: 0.88 },
    // ... more entries ...
  };
  return map[assetKey] || map.default;
}
```

### Step 3: Verify asset-manifest.json

The script auto-updates `data/asset-manifest.json`. Check it was updated:

```bash
# Count assets
cat data/asset-manifest.json | grep '"id":' | wc -l
# Should show: previous count + 25
```

### Step 4: Run Tests

```bash
# Start preview server (if not already running)
python -m http.server 8000 --bind 127.0.0.1 &

# Open browser: http://localhost:8000
# Create a new room, verify:
#   - No console errors
#   - Catalog shows all new assets in Kitchen/Bathroom/Living Room
#   - Can place assets without crashes
```

---

## 🎨 Phase 4: Generate Thumbnails

```bash
# Run thumbnail generator
npm run generate-thumbnails
# OR
node scripts/generate-thumbnails.mjs
```

**What it does:**
1. Launches headless browser
2. Renders each new asset in 3D
3. Captures screenshot → PNG
4. Saves to `./assets/thumbnails/{assetKey}.png`
5. Updates `asset-manifest.json` with thumbnail paths

**Output:**
```
Generated thumbnails for 25 assets
Updated asset-manifest.json
```

---

## 📄 Phase 5: License Tracking

Create `data/asset-sources.json` with full attribution:

```json
{
  "generated": "2026-04-07",
  "license_summary": "~70% CC0 (Poly Haven), ~20% CC0 (ambientCG), ~10% CC BY (Sketchfab with attribution)",
  "kitchenAssets": [
    {
      "id": "cabinet_base_white",
      "name": "Base Cabinet - White",
      "source": "Sketchfab",
      "sourceUrl": "https://sketchfab.com/3d-models/simple-kitchen-cabinet-base-d45f8e",
      "license": "CC BY",
      "creator": "3D Model Creator",
      "attribution": "Model by 3D Model Creator, Sketchfab CC BY License",
      "downloadDate": "2026-04-07"
    },
    // ... more kitchen assets ...
  ],
  "bathroomAssets": [ /* similar */ ],
  "livingRoomAssets": [ /* similar */ ],
  "ccZeroAssets": [ "Poly Haven models", "ambientCG textures" ],
  "ccByAssets": [ "Sketchfab models (20+ with attribution)" ],
  "attributionFooter": "Assets sourced from Poly Haven (CC0), ambientCG (CC0), and Sketchfab creators (CC BY with attribution)"
}
```

---

## ✅ Final Verification Checklist

### 2D Canvas Render
- [ ] Load an existing project
- [ ] Create a Kitchen room
- [ ] Place: cabinet base, cabinet upper, island, fridge, stove, sink
- [ ] Verify: all assets render, proportions look right, no overlapping
- [ ] Repeat for Bathroom: vanity, toilet, tub, tiles, mirrors, sconces
- [ ] Repeat for Living Room: sofas, dining table, lamps, rug

### 3D Render
- [ ] In 3D view, verify:
  - Assets load without 404 errors
  - Materials/colors apply correctly
  - Scale/proportions match 2D
  - Shadows render correctly
  - No console errors

### Variants System
- [ ] Select asset in 3D
- [ ] Change variant color
- [ ] Verify material updates instantly
- [ ] Save room → reload → verify variant persists

### Exports
- [ ] Export PNG (room as 2D plan)
- [ ] Export PNG (room as 3D render)
- [ ] Export PDF Presentation Deck
- [ ] Verify all exports complete without console errors

### Mobile/Responsive
- [ ] Open on phone (iPhone 12 w/ notch)
- [ ] Catalog scrolls smoothly with 85+ assets
- [ ] Touch placement works (tap to place, drag to move)
- [ ] No layout breaking

### Console Errors
```bash
# Open DevTools (F12) and check:
# Should show ZERO errors logged during:
#   - Room create
#   - Asset placement
#   - 3D render
#   - Export
#   - Save/reload
```

---

## 🔄 Workflow Automation (Scripts Reference)

### Download & Normalize
```bash
# Download all assets to ./assets/models/temp/
# Then run:
blender --background --python scripts/normalize-assets.py

# Output: ./assets/models/*.glb + data/normalization-log.json
```

### Register Assets
```bash
# Auto-generate registration code:
node scripts/register-assets.js

# Output: Copy-paste code blocks into 3 files
```

### Generate Thumbnails
```bash
# Auto-render thumbnails for all assets:
npm run generate-thumbnails
# OR
node scripts/generate-thumbnails.mjs

# Output: ./assets/thumbnails/*.png + updated asset-manifest.json
```

### Full Pipeline (One Command)
```bash
# After downloading all assets to ./assets/models/temp/:
bash scripts/asset-sprint-pipeline.sh

# Runs: normalize → register → generate-thumbnails → verify
```

---

## 📊 Expected Results

### Before Sprint
- ~60 total assets
- Kitchen: 0 assets (MISSING)
- Bathroom: 0 assets (MISSING)
- Living Room: 12 assets (basic)

### After Sprint
- ~85 total assets (+25)
- Kitchen: 11 assets (cabinets, appliances, counters, lighting, hardware)
- Bathroom: 8 assets (vanities, toilet, tub, mirrors, sconces, tiles)
- Living Room: 6 new premium upgrades (sofas, tables, lamps, rugs)

### License Distribution
- CC0 (no attribution): 17 assets (Poly Haven + ambientCG)
- CC BY (with attribution): 8 assets (Sketchfab)

### File Changes
| File | Change | Lines |
|------|--------|-------|
| `scripts/storage.js` | +25 MODEL_REGISTRY entries | +150 |
| `scripts/catalog.js` | +25 FURN_ITEMS entries | +25 |
| `scripts/planner3d.js` | +25 verificationTargetSize entries | +25 |
| `data/asset-manifest.json` | +25 assets | +500 |
| (NEW) `data/asset-sources.json` | License tracking | +100 |
| `assets/models/` | +25 GLB files | ~50MB |
| `assets/thumbnails/` | +25 PNG files | ~10MB |

---

## 🚨 Troubleshooting

### Blender Script Fails
**Error:** `ERROR: No mesh objects found after import`
- **Cause:** Asset file has no mesh, only armature or empty groups
- **Fix:** Open in Blender manually, check what imported, delete non-mesh parts, save

**Error:** `Unsupported format`
- **Cause:** Script doesn't handle this file type
- **Fix:** Convert in Blender: Import → Export as GLB → Move to temp/

### Registration Script Missing CODE
**Error:** `Cannot find asset-acquisitions.json`
- **Cause:** Script ran from wrong directory
- **Fix:** Make sure you're in project root: `cd "Rose designs"`

**Error:** Entries don't copy into files
- **Cause:** Asset IDs have spaces or special chars
- **Fix:** Edit asset-acquisitions.json, use snake_case for all IDs

### Thumbnails Not Generated
**Error:** Playwright timeout / Edge not found
- **Cause:** Headless browser not installed
- **Fix:** `npm install` should install Playwright. If not: `npx playwright install`

### Assets Don't Render in 3D
**Error:** "Failed to load model"
- **Cause:** GLB file path wrong or corrupted
- **Fix:** Check ./assets/models/ folder, verify file exists, check console error message for exact path

---

## 📞 Next Steps

1. **Download** all 25 assets from asset-acquisitions.json
2. **Normalize** using Blender script
3. **Register** using Node.js script
4. **Generate Thumbnails** using existing npm script
5. **Verify** via full kitchen/bathroom/living room test rooms
6. **Commit** with message: "feat: add 25 free premium kitchen/bathroom/living room assets"

---

## 📚 Additional Resources

- **asset-acquisitions.json** — Full inventory with sources, licenses, URLs
- **normalize-assets.py** — Blender batch script
- **register-assets.js** — Node registration script
- **data/normalization-log.json** — Output from Blender (generated after running)
- **data/asset-sources.json** — License tracking (create after download)

---

**Sprint Start Date:** 2026-04-07
**Expected Completion:** 2 hours (download + normalize) + 1 hour (test + verify)
**Total Cost:** $0 (all free, CC0/CC BY sources)

