# Rose's Indoor Designs

Rose's Indoor Designs is a local-first browser app for planning, furnishing, reviewing, and presenting interior spaces in 2D and 3D.

This repo contains a real working app, but it is still in a transition phase between ambitious prototype and maintainable product. The goal of this README is to describe the repo honestly instead of treating every feature as equally mature.

## Current Status

### Stable enough to use

- 2D room drawing and editing
- local save/load in the browser
- multi-room projects with floor grouping
- catalog browsing and furniture placement
- room-to-room 3D viewing on the active floor
- image and PDF tracing overlays
- presentation exports and comparison sheets

### Working, but still fragile

- multi-room walkthrough behavior in very large projects
- 3D lighting presets and time-of-day tuning
- wall-mounted assets and some imported model pivots
- mobile editor ergonomics
- cloud sync

### Known architectural debt

- runtime still depends on ordered browser globals
- app boot uses sequential script injection instead of real `import` / `export`
- state is still shared through broad mutable globals
- UI still contains inline event handlers
- package/tooling is only partially formalized

## Run Locally

The app should be served over HTTP so local assets, 3D models, and PDF helpers load correctly.

### Recommended

```bash
npm run dev
```

Then open:

```text
http://127.0.0.1:8123/
```

### Alternate port

```bash
npm run dev:alt
```

Then open:

```text
http://127.0.0.1:8124/
```

## Package Scripts

```bash
npm run dev
npm run dev:alt
npm run check
npm run lint
npm run format
npm run validate:manifest
npm run test:self
npm run test:smoke
npm test
npm run thumbs
npm run clean
```

What they do:

- `dev` - starts a simple static server on `8123`
- `dev:alt` - starts a simple static server on `8124`
- `check` - runs `node --check` across the main runtime files
- `lint` - lints the new hardening boundary files
- `format` - checks formatting for docs and the new hardening files
- `validate:manifest` - verifies asset manifest entries, models, and thumbnails
- `test:self` - runs the built-in `#selftest` flow through Playwright
- `test:smoke` - starts a temporary local server and runs the Playwright smoke helper against the app
- `test` - runs the hardening validation chain
- `thumbs` - regenerates catalog thumbnails
- `clean` - clears smoke-test and temporary output folders

## Entrypoints

- [index.html](./index.html) is now the canonical app shell
- [roses-indoor-designs.html](./roses-indoor-designs.html) is kept as a compatibility redirect for older links

## Repo Layout

- [index.html](./index.html) - primary app shell
- [styles/app.css](./styles/app.css) - visual system and layout styling
- [scripts/main.js](./scripts/main.js) - canonical runtime bootstrap entry
- [scripts/app.js](./scripts/app.js) - compatibility wrapper that forwards to `scripts/main.js`
- [scripts/core/app-config.js](./scripts/core/app-config.js) - canonical app identity and version metadata
- [scripts/core/project-schema.js](./scripts/core/project-schema.js) - JSON import/export schema helpers
- [scripts/core/error-reporting.js](./scripts/core/error-reporting.js) - fatal load and runtime error helpers
- [scripts/state.js](./scripts/state.js) - shared state helpers, geometry, snapping, walk logic
- [scripts/storage.js](./scripts/storage.js) - persistence, IndexedDB, normalization
- [scripts/ui.js](./scripts/ui.js) - home/editor shell behavior
- [scripts/planner2d.js](./scripts/planner2d.js) - 2D plan rendering and editor interactions
- [scripts/planner3d.js](./scripts/planner3d.js) - 3D scene, camera, lighting, walkthrough logic
- [scripts/catalog.js](./scripts/catalog.js) - catalog UI, variants, placement controls
- [scripts/export.js](./scripts/export.js) - PNG, SVG, PDF, and presentation export logic
- [scripts/cloud/supabase.js](./scripts/cloud/supabase.js) - experimental cloud sync boundary
- [scripts/devtools/validate-manifest.mjs](./scripts/devtools/validate-manifest.mjs) - manifest validator
- [scripts/devtools/run-selftest.mjs](./scripts/devtools/run-selftest.mjs) - reproducible self-test runner
- [scripts/thumbgen.html](./scripts/thumbgen.html) - thumbnail rendering stage
- [scripts/generate-thumbnails.mjs](./scripts/generate-thumbnails.mjs) - bulk thumbnail generator
- [data/asset-manifest.json](./data/asset-manifest.json) - asset metadata
- [progress.md](./progress.md) - running implementation and verification log
- [docs/REFACTOR_ROADMAP.md](./docs/REFACTOR_ROADMAP.md) - structural cleanup plan
- [CHANGELOG.md](./CHANGELOG.md) - versioned hardening changes
- [ROADMAP.md](./ROADMAP.md) - hardening roadmap
- [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) - active limitations and honest boundaries
- [docs/architecture.md](./docs/architecture.md) - current runtime architecture
- [docs/data-model.md](./docs/data-model.md) - current room/project model
- [docs/testing.md](./docs/testing.md) - test and verification commands
- [docs/deployment.md](./docs/deployment.md) - deployment notes

## QA

Built-in self-test:

```text
http://127.0.0.1:8123/index.html#selftest
```

Notes:

- the repo now includes reproducible `test:self`, `test:smoke`, and manifest-validation commands
- the repo still does not have a full Playwright spec suite
- `progress.md` is still the best source for recent verification history

## Thumbnail Pipeline

Regenerate catalog thumbnails with:

```bash
npm run thumbs
```

The thumbnail tool renders from [scripts/thumbgen.html](./scripts/thumbgen.html) into [assets/thumbnails](./assets/thumbnails).

## Local-First Notes

- projects and editor state live in the browser
- most workflows are designed to work without a backend
- cloud sync is optional and still a lower-confidence surface than local editing

## Architecture Reality Check

The runtime is split across files, but it is not yet a clean ES-module architecture. Today it boots through [scripts/main.js](./scripts/main.js), which is an explicit ES-module entrypoint that still uses a documented compatibility bridge to load the existing browser-global runtime. That bridge is temporary and intentional.

If you are trying to contribute or extend this app, treat it like a capable but still consolidating codebase:

- prefer small, verified changes
- expect some cross-file coupling
- check `progress.md` before assuming a subsystem is stable
- read the refactor roadmap before adding big new feature surfaces
