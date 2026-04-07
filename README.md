# Rose Designs

Rose Designs is a browser-based room designer for planning, styling, and presenting interiors.

The app now runs as a small static app shell instead of one giant inlined page:
- `rose-designs.html` is the document shell
- `styles/app.css` holds the visual system
- `scripts/app.js` is the module bootstrap
- `scripts/state.js`, `scripts/storage.js`, `scripts/catalog.js`, `scripts/planner2d.js`, `scripts/planner3d.js`, `scripts/walkthrough.js`, `scripts/export.js`, and `scripts/ui.js` split the runtime into focused static modules
- `data/asset-manifest.json` is the source of truth for the catalog taxonomy, collections, and thumbnail wiring

It includes:
- 2D room drawing with walls, doors, windows, closets, partitions, and measurements
- multi-room home planning inside one project, with per-room geometry, furniture, variants, overlays, notes, and floor grouping
- local reference-image and PDF tracing in 2D with import, move, scale, opacity, lock, page switching, and calibration controls
- 3D room viewing with orbit and walk modes
- photo-focused 3D captures with `Photo Mode`, hero framing presets, and higher-quality PNG output
- richer lighting control with `Lighting Mood` plus a `Light Character` slider for daylight-to-evening scene shaping
- polished local walkthrough presets: `Dollhouse`, `Stroll`, `Corner Reveal`, `Before / After Flythrough`, and `Romantic Reveal`
- a cleaner `Reveal Mode` for hero framing, room-story presentation, and cover-style captures
- furniture placement with multi-select, copy/paste, snap-to-grid, and material variants
- premium catalog browsing with stronger category taxonomy, collection filters, favorites, recents, and real generated product thumbnails
- existing-room redesign planning with `keep / move / replace / remove`
- option-based redesign workflows with notes, thumbnails, and comparison views
- export tools for PNGs, comparison sheets, summary sheets, and client presentation PDFs

## Run Locally

This app is a static web app and works best when served over HTTP so 3D assets load correctly.

### Option 1: Python

```bash
python -m http.server 8123
```

Then open:

```text
http://127.0.0.1:8123/
```

### Option 2: VS Code Live Server

Open the folder and serve it with any simple static server.

## Files

- `rose-designs.html` - document shell
- `styles/app.css` - extracted UI styling
- `scripts/app.js` - module bootstrap loader
- `scripts/state.js` - shared state and planner model helpers
- `scripts/storage.js` - IndexedDB/local profile persistence and catalog/storage utilities
- `scripts/catalog.js` - manifest-backed catalog, picker, variant selection, and furniture-side props
- `scripts/planner2d.js` - 2D plan rendering and editor interactions
- `scripts/planner2d.js` also owns the image/PDF reference-overlay tracing workflow, page rendering, and calibration behavior
- `scripts/planner3d.js` - 3D scene, camera behavior, walkthrough presets, and photo mode / lighting polish
- `scripts/walkthrough.js` - emotional layer, self-test boot, and guided story behavior
- `scripts/thumbgen.html` - local thumbnail-render stage used to generate catalog previews
- `scripts/generate-thumbnails.mjs` - bulk thumbnail generator for the current asset catalog
- `scripts/export.js` - PNG, summary, comparison, and PDF export
- `scripts/ui.js` - home/editor shell behavior and compare state
- `scripts/ui.js` also owns project-level room/floor grouping, room organizer actions, and multi-room creation flows
- `data/asset-manifest.json` - structured asset metadata
- `assets/models/` - source GLB furniture and decor assets
- `assets/thumbnails/` - generated product thumbnails used by the catalog
- `package.json` - local Playwright dependency for QA
- `progress.md` - running development and verification log

## Notes

- The app stores rooms and editor state locally in the browser.
- For the best experience, use a modern Chromium-based browser.
- If 3D models do not appear, make sure you are not opening the file directly with `file://`.

## QA

The app includes a built-in self-test:

```text
http://127.0.0.1:8123/rose-designs.html#selftest
```

## Thumbnail Pipeline

Generate or refresh the product thumbnails with:

```bash
node ./scripts/generate-thumbnails.mjs
```

This uses `scripts/thumbgen.html` as a consistent local render stage and writes PNGs into `assets/thumbnails/`.

## Current Highlights

- persistent undo/redo
- imperial and metric units
- local image-based floor-plan / room-photo tracing overlays with calibration and saved per-room state
- local PDF floor-plan import that renders into the same saved tracing overlay workflow
- project-aware room organization with floor-ready metadata and limited multi-floor switching
- redesign options and client presentation export
- room comparison views in 2D and 3D
- stronger floor and furniture rendering for clearer visual contrast
- profile-aware local persistence for Rose and Marco
- collection-aware asset browsing with manifest-backed catalog metadata
- category-first premium picker with favorites, recents, collection chips, and real thumbnail cards
- manifest-driven product/material variants for major furniture, storage, rug, and lighting categories
- smoother 3D camera behavior with double-click focus and walkthrough presets
- photo mode with capture-oriented camera presets and cleaner presentation framing
- more cinematic 3D lighting with ACES tone mapping, better shadowing, and a daylight-to-evening light character control
- reveal mode with stronger hero framing, before/after sequencing, and presentation-first microcopy

## Reference Overlay Workflow

- import a local image or PDF as a floor-plan or room-photo reference
- reposition it directly on the 2D canvas
- adjust opacity and scale
- lock it so tracing/editing ignores the overlay
- calibrate it by clicking two points and entering a real-world distance
- switch PDF pages when the source file has more than one page

Everything stays local in the browser. PDFs are rendered into the same overlay system as images, so tracing, calibration, and saved room state work the same way.

## Multi-Room Planning

- each project can now contain multiple named rooms
- each room keeps its own geometry, furniture, variants, tracing overlay, and option state
- floors are lightweight but persistent: rooms carry `floorId`, `floorLabel`, and `floorOrder`
- the current editor exports still operate on the active room and its option set, not the whole project at once
