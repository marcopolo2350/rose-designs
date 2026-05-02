# Rose's Indoor Designs

Rose's Indoor Designs is a local-first browser app for planning, furnishing, reviewing, and presenting interior spaces in 2D and 3D.

This repo contains a real working app, but it is still in a transition phase between ambitious prototype and maintainable product. The goal of this README is to describe the repo honestly instead of treating every feature as equally mature.

## Live App

GitHub Pages serves the canonical app at:

```text
https://marcopolo2350.github.io/roses-indoor-designs/
```

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
- runtime dependencies still load from pinned CDNs instead of a bundle
- large browser-global files still need gradual extraction

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
npm run validate:version
npm run validate:manifest
npm run validate:asset-sizes
npm run validate:asset-sources
npm run validate:static-a11y
npm run validate:text-encoding
npm run validate:dev-mode
npm run validate:github-templates
npm run validate:workflow
npm run validate:docs
npm run validate:structure
npm run validate:global-bridge
npm run validate:css
npm run validate:html-safety
npm run validate:storage-keys
npm run validate:inline-handlers
npm run validate:error-handling
npm run validate:runtime-modules
npm run validate:dependencies
npm run validate:cloud-boundary
npm run validate:clean-ignore
npm run validate:project-schema
npm run validate:app-state
npm run validate:geometry
npm run validate:placement-rules
npm run validate:3d-lifecycle
npm run validate:3d-lighting
npm run validate:3d-camera
npm run validate:export-filenames
npm run test:playwright
npm run test:self
npm run test:smoke
npm test
npm run thumbs
npm run clean
```

What they do:

- `dev` - starts a simple static server on `8123`
- `dev:alt` - starts a simple static server on `8124`
- `check` - runs syntax validation across maintained scripts, tests, and tool-config files
- `lint` - lints the new hardening boundary files
- `format` - checks formatting for docs and the new hardening files
- `validate:version` - checks package, lockfile, app shell, runtime config, changelog, and hardening status versions stay aligned
- `validate:manifest` - verifies asset manifest entries, mounted placement metadata, models, and thumbnails
- `validate:asset-sizes` - verifies GLB files stay below the per-model size ceiling
- `validate:asset-sources` - verifies every catalog entry points to a documented source registry entry
- `validate:static-a11y` - checks static app-shell button names, button types, dialogs, decorative SVG hiding, and new-tab link safety
- `validate:text-encoding` - blocks mojibake, phase-history runtime comments, and question-mark catalog icon fallbacks
- `validate:dev-mode` - checks debug/model/diagnostic surfaces stay behind `.dev-only`
- `validate:github-templates` - checks issue/PR templates keep hardening scope and verification prompts current
- `validate:workflow` - checks the GitHub Verify workflow keeps the same local guardrails and current action majors
- `validate:docs` - checks README, testing docs, hardening status, and PR verification commands for drift
- `validate:structure` - checks required source boundary directories, boundary files, and runtime ordering
- `validate:global-bridge` - freezes the current browser-global compatibility surface so new globals are intentional
- `validate:css` - checks focus styling, z-index tokens, reduced motion, safe-area handling, and blocked CSS patterns
- `validate:html-safety` - checks shared HTML escaping and high-risk diagnostic/self-test rendering paths
- `validate:storage-keys` - checks app storage calls use the storage-key registry instead of raw key literals
- `validate:inline-handlers` - blocks inline and direct handler regressions
- `validate:error-handling` - blocks empty catch blocks
- `validate:runtime-modules` - verifies the transitional runtime module bridge
- `validate:dependencies` - verifies pinned CDN dependency versions and blocks removed CAD/DXF packages
- `validate:cloud-boundary` - verifies experimental cloud sync warnings, Supabase docs, validation hooks, and no direct global project mutation
- `validate:clean-ignore` - checks generated artifacts cleaned by `npm run clean` stay ignored
- `validate:project-schema` - checks project JSON import/export schema validation
- `validate:app-state` - checks the central app state dispatcher bridge
- `validate:geometry` - checks pure 2D geometry helpers
- `validate:placement-rules` - checks catalog-owned default placement/elevation rules against manifest metadata
- `validate:3d-lifecycle` - checks 3D disposal/lifecycle helpers
- `validate:3d-lighting` - checks data-driven time-of-day lighting buckets, colors, and exposure bounds
- `validate:3d-camera` - checks data-driven 3D camera labels and pose math
- `validate:export-filenames` - checks shared export filename sanitizing and centralized download helpers
- `test:playwright` - runs the standard Playwright spec suite
- `test:self` - runs the built-in `#selftest` flow through Playwright
- `test:smoke` - starts a temporary local server and runs the Playwright smoke helper against the app
- `test` - runs syntax, lint, format, validation commands, and the built-in self-test
- `thumbs` - regenerates catalog thumbnails
- `clean` - clears ignored smoke-test, self-test, and temporary debug output artifacts

## Entrypoints

- [index.html](./index.html) is now the canonical app shell
- redirect-only legacy HTML entrypoints are intentionally not kept in the repo

## Repo Layout

- [index.html](./index.html) - primary app shell
- [styles/app.css](./styles/app.css) - ordered stylesheet manifest
- [styles/](./styles) - split visual system files for base, home, editor, planner, panels, modals, catalog, mobile, and devtools styling
- [scripts/main.js](./scripts/main.js) - canonical runtime bootstrap entry
- [scripts/core/app-config.js](./scripts/core/app-config.js) - canonical app identity and version metadata
- [scripts/core/project-schema.js](./scripts/core/project-schema.js) - JSON import/export schema helpers
- [scripts/core/error-reporting.js](./scripts/core/error-reporting.js) - fatal load and runtime error helpers
- [scripts/core/storage-service.js](./scripts/core/storage-service.js) - IndexedDB open/read/write boundary
- [scripts/core/app-state.js](./scripts/core/app-state.js) - first central runtime state surface for high-risk globals
- [scripts/core/history.js](./scripts/core/history.js) - shared undo/redo and room-history runtime
- [scripts/catalog/placement-rules.js](./scripts/catalog/placement-rules.js) - manifest-backed placement/elevation defaults
- [scripts/planner2d/geometry.js](./scripts/planner2d/geometry.js) - pure 2D geometry helpers shared by planner logic
- [scripts/planner3d/lifecycle.js](./scripts/planner3d/lifecycle.js) - 3D disposal and cleanup helpers
- [scripts/planner3d/camera.js](./scripts/planner3d/camera.js) - data-driven 3D camera labels and pose helpers
- [scripts/export/filenames.js](./scripts/export/filenames.js) - shared export filename sanitizing
- [scripts/export/project-json.js](./scripts/export/project-json.js) - project JSON import/export boundary
- [scripts/state.js](./scripts/state.js) - shared state helpers, geometry, snapping, walk logic
- [scripts/storage.js](./scripts/storage.js) - persistence, normalization, and legacy storage wrappers
- [scripts/ui.js](./scripts/ui.js) - home/editor shell behavior
- [scripts/planner2d.js](./scripts/planner2d.js) - 2D plan rendering and editor interactions
- [scripts/planner3d.js](./scripts/planner3d.js) - 3D scene assembly and walkthrough glue
- [scripts/catalog.js](./scripts/catalog.js) - catalog UI, variants, placement controls
- [scripts/export.js](./scripts/export.js) - PNG, SVG, PDF, and presentation export logic
- [scripts/cloud/supabase.js](./scripts/cloud/supabase.js) - experimental cloud sync boundary
- [scripts/devtools/validate-manifest.mjs](./scripts/devtools/validate-manifest.mjs) - manifest validator
- [scripts/devtools/validate-asset-sources.mjs](./scripts/devtools/validate-asset-sources.mjs) - asset provenance validator
- [scripts/devtools/run-selftest.mjs](./scripts/devtools/run-selftest.mjs) - reproducible self-test runner
- [scripts/thumbgen.html](./scripts/thumbgen.html) - thumbnail rendering stage
- [scripts/generate-thumbnails.mjs](./scripts/generate-thumbnails.mjs) - bulk thumbnail generator
- [data/asset-manifest.json](./data/asset-manifest.json) - asset metadata, including mounted placement rules
- [data/asset-sources.json](./data/asset-sources.json) - asset source, license, and review-status registry
- [progress.md](./progress.md) - running implementation and verification log
- [docs/REFACTOR_ROADMAP.md](./docs/REFACTOR_ROADMAP.md) - structural cleanup plan
- [CHANGELOG.md](./CHANGELOG.md) - versioned hardening changes
- [ROADMAP.md](./ROADMAP.md) - hardening roadmap
- [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) - active limitations and honest boundaries
- [docs/architecture.md](./docs/architecture.md) - current runtime architecture
- [docs/data-model.md](./docs/data-model.md) - current room/project model
- [docs/testing.md](./docs/testing.md) - test and verification commands
- [docs/deployment.md](./docs/deployment.md) - deployment notes
- [docs/cloud-sync.md](./docs/cloud-sync.md) - experimental Supabase sync boundary, schema, and conflict policy
- [docs/cloud-schema.sql](./docs/cloud-schema.sql) - Supabase table, index, and Row Level Security setup
- [docs/asset-sources.md](./docs/asset-sources.md) - catalog source and license posture
- [docs/hardening-status.md](./docs/hardening-status.md) - current checklist status

## QA

Built-in self-test:

```text
http://127.0.0.1:8123/index.html#selftest
```

Notes:

- the repo now includes reproducible `test:self`, `test:smoke`, and manifest-validation commands
- the repo has a starter Playwright spec suite, but not full workflow coverage yet
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
- cloud sync is optional, experimental, and still a lower-confidence surface than local editing
- cloud sync setup and Row Level Security notes live in [docs/cloud-sync.md](./docs/cloud-sync.md)

## Architecture Reality Check

The runtime is split across files, but it is not yet a clean ES-module architecture. Today it boots through [scripts/main.js](./scripts/main.js), which is an explicit ES-module entrypoint that still uses a documented compatibility bridge to load the existing browser-global runtime. That bridge is temporary and intentional. The repo now also has first-pass central surfaces for runtime state and history in [scripts/core/app-state.js](./scripts/core/app-state.js) and [scripts/core/history.js](./scripts/core/history.js), but most feature code has not been migrated onto them yet.

If you are trying to contribute or extend this app, treat it like a capable but still consolidating codebase:

- prefer small, verified changes
- expect some cross-file coupling
- check `progress.md` before assuming a subsystem is stable
- read the refactor roadmap before adding big new feature surfaces
