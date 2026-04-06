# Rose Designs

Rose Designs is a browser-based room designer for planning, styling, and presenting interiors.

The app now runs as a small static app shell instead of one giant inlined page:
- `rose-designs.html` is the document shell
- `styles/app.css` holds the visual system
- `scripts/app.js` holds the planner/runtime logic
- `data/asset-manifest.json` adds structured catalog metadata for collections and room recommendations

It includes:
- 2D room drawing with walls, doors, windows, closets, partitions, and measurements
- 3D room viewing with orbit and walk modes
- furniture placement with multi-select, copy/paste, snap-to-grid, and finish colors
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
- `scripts/app.js` - extracted planner/runtime code
- `data/asset-manifest.json` - structured asset metadata
- `assets/` - models and supporting art assets
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

## Current Highlights

- persistent undo/redo
- imperial and metric units
- redesign options and client presentation export
- room comparison views in 2D and 3D
- stronger floor and furniture rendering for clearer visual contrast
- profile-aware local persistence for Rose and Marco
- collection-aware asset browsing with manifest-backed catalog metadata
