# Hardening Status

Last updated: 2026-05-01

Current app version: `0.5.0-hardening.53`

This document tracks the ruthless cleanup work honestly. It is not a claim that the full checklist is complete.

## Completed In Repo

- Canonical app shell is `index.html`.
- Redirect-only legacy HTML entrypoints have been removed and are blocked by runtime validation.
- App identity is centralized in `scripts/core/app-config.js`.
- Runtime boot has an explicit documented bridge in `scripts/main.js`.
- The transitional runtime bridge is validated by `npm run validate:runtime-modules` so missing or duplicate classic modules fail before browser boot.
- Remaining CDN dependencies are documented in `docs/dependencies.md` and guarded by `npm run validate:dependencies`.
- Package scripts exist for dev, syntax checks, lint, format, manifest validation, self-test, smoke, Playwright specs, thumbnails, and cleanup.
- `npm test` now includes syntax, lint, format, validators, and the built-in self-test so local verification mirrors CI discipline more closely.
- `npm run clean` removes ignored smoke, self-test, and debug artifacts with root-bound safety checks.
- CI runs install, syntax checks, lint, format checks, manifest validation, delegated UI handler validation, silent-catch validation, built-in self-test, Playwright spec, and smoke checks.
- `scripts/core/app-state.js` owns the first central runtime metadata surface.
- `appState.dispatch()` now covers high-risk bridge actions for room selection, selection clearing, tool changes, render requests, save scheduling, 3D rebuild scheduling, and dirty/saved markers.
- `scripts/core/history.js` owns shared room history and undo/redo behavior.
- `scripts/core/storage-keys.js` owns localStorage and IndexedDB key naming.
- `npm run validate:storage-keys` blocks raw localStorage key literals outside the storage-key boundary.
- IndexedDB access now exposes readable storage-service bridge names (`openDatabase`, `getRecord`, `setRecord`) while legacy callers migrate.
- `scripts/cloud/supabase.js` isolates experimental cloud sync behavior.
- `scripts/ui/shortcuts.js` owns keyboard shortcuts and shortcut-sheet rendering.
- Generated catalog picker interactions use delegated `data-action` handlers instead of inline event attributes.
- Home Plan room/floor controls, property-panel close, and room panel tabs use delegated `data-action` handlers.
- Add Room width/depth and Up/Right/Down/Left controls use delegated `data-action` handlers and have a Playwright adjacent-room smoke path.
- Surfaces wall, floor, and trim controls use delegated `data-action` handlers and are covered by the desktop/mobile Playwright smoke path.
- Lighting Mood preset and range controls use delegated `data-action` handlers and are covered by the desktop/mobile Playwright smoke path.
- Ceiling Geometry and Design Direction controls use delegated `data-action` handlers and are covered by the desktop/mobile Playwright smoke path.
- Tracing Reference, Redesign Planning, Plan Layers, Design Options, and Presentation room-panel controls use delegated `data-action` handlers; non-file-picker paths are covered by desktop/mobile Playwright smoke checks.
- No-selection Furnish helper controls use delegated `data-action` handlers and are covered by desktop/mobile smoke checks.
- Selected-furniture property controls use delegated `data-action` handlers and are covered by desktop/mobile smoke checks.
- Selected geometry and annotation property panels use delegated `data-action` handlers and are covered by desktop/mobile smoke checks.
- Home project cards, create-room starter cards, delete confirmation buttons, and undo timeline nodes use delegated `data-action` handlers.
- Generated 3D reveal, walkthrough, photo, and mobile walk-control trays use delegated `data-action` or hold handlers.
- Runtime diagnostics, cloud sync modal buttons, canvas pointer events, and reference file input use delegated actions or `addEventListener` instead of handler properties.
- Empty catch blocks have been replaced with explicit recoverable error reporting and are guarded by `npm run validate:error-handling`.
- The fatal-load screen renders dynamic error text with `textContent` instead of `innerHTML`.
- Shared HTML escaping now lives in `scripts/core/html.js`, and high-risk diagnostic/self-test rendering paths are guarded by `npm run validate:html-safety`.
- The project delete confirmation now renders with DOM nodes and `textContent`, and `npm run validate:html-safety` blocks it from regressing to string-built HTML.
- Project JSON import validation now checks room text fields, polygon geometry, array fields, and furniture geometry through `npm run validate:project-schema`.
- Project JSON import validation now rejects dangerous prototype-pollution keys and oversized JSON files before merging rooms into local state.
- Experimental cloud sync validates room payloads before push/pull and reports config storage failures instead of silently swallowing them.
- Pure 2D geometry helpers are isolated in `scripts/planner2d/geometry.js` and covered by `npm run validate:geometry`.
- Catalog manifest loading and normalization is isolated in `scripts/catalog/manifest.js`, and required source boundary directories are guarded by `npm run validate:structure`.
- 3D material, scene, renderer, listener, and composer disposal helpers are isolated in `scripts/planner3d/lifecycle.js` and covered by `npm run validate:3d-lifecycle`.
- Export filenames are sanitized through `scripts/export/filenames.js` and covered by `npm run validate:export-filenames`.
- `data/asset-validation-overrides.json` documents intentional shared GLB aliases.
- Every catalog entry now declares a valid `mountType`, and manifest validation blocks new entries that omit placement metadata.
- Kenney catalog entries now point to tracked `assets/models/kn_*.glb` files instead of ignored local source-pack paths, so CI and GitHub Pages validate the same assets as the local app.
- GLB asset file sizes are guarded by `npm run validate:asset-sizes` with a 10 MB per-model ceiling.
- Every manifest entry now carries a `sourceId`, and `npm run validate:asset-sources` checks it against `data/asset-sources.json`.
- Static app-shell accessibility basics are guarded by `npm run validate:static-a11y` for button types, icon labels, dialog metadata, and decorative SVG hiding.
- CSS accessibility and mobile guardrails are covered by `npm run validate:css`, including focus-visible styling, reduced motion, safe-area handling, and banned negative letter spacing.
- Dev/debug surfaces are guarded by `npm run validate:dev-mode` so model audits, diagnostics, and asset verification stay behind dev mode.
- GitHub PR and issue templates are guarded by `npm run validate:github-templates` so future work keeps hardening scope and verification prompts.
- README, testing docs, deployment notes, hardening status, and PR verification commands are guarded by `npm run validate:docs`.
- The Verify workflow uses current Node 24-compatible official action majors and keeps `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` guarded by repository validation.
- Standard Playwright config and a shell smoke spec exist for desktop and mobile Chromium viewports.
- README, changelog, roadmap, architecture, data model, testing, deployment, and limitations docs exist.

## Partially Completed

- The runtime is still browser-global, but the bridge is explicit and several core surfaces have been extracted.
- State is still largely mutable globals, but high-risk metadata and history now have central owners.
- Inline handlers and direct `on*` handler properties are removed from the static app shell and application scripts.
- Manifest validation is stricter and quieter, and source tracking now marks cleared versus needs-review asset families; full provenance cleanup is still not complete.
- Cloud sync is isolated and marked experimental, but conflict handling is still timestamp-oriented.
- Playwright coverage exists for desktop and mobile smoke paths, but it is still smoke-level rather than a full workflow suite.

## Deferred With Reason

- Full ESM conversion: too risky to force without a bundler/build step and broad regression coverage.
- Full central action dispatcher: needs careful migration from existing globals to avoid breaking editor flows.
- CSS file split: useful, but less urgent than state, persistence, and test reliability.
- Full `innerHTML` removal: important, but generated editor panels still need a focused rendering refactor.
- Full dependency bundling: still deferred to preserve GitHub Pages compatibility while hardening behavior.

## Current Known Debt

- `scripts/ui.js`, `scripts/catalog.js`, `scripts/planner2d.js`, and `scripts/planner3d.js` are still large browser-global files.
- Some legacy globals and large files remain; the event-handler cleanup is now substantially cleaner, but the browser-global architecture is still transitional.
- Some catches remain intentionally soft for rendering/math fallbacks, but empty catches are now blocked by validation.
- Catalog metadata still has model aliases, now documented through validation overrides.
- The app still relies on CDN-loaded Three.js, jsPDF, and pdf.js at runtime.

## Reproducible Verification

Run:

```bash
npm run check
npm run lint
npm run format
npm run validate:manifest
npm run validate:asset-sizes
npm run validate:asset-sources
npm run validate:static-a11y
npm run validate:dev-mode
npm run validate:github-templates
npm run validate:docs
npm run validate:structure
npm run validate:css
npm run validate:html-safety
npm run validate:storage-keys
npm run validate:error-handling
npm run validate:runtime-modules
npm run validate:dependencies
npm run validate:project-schema
npm run validate:app-state
npm run validate:geometry
npm run validate:3d-lifecycle
npm run validate:export-filenames
npm run test:playwright
npm test
npm run test:smoke
```

The browser-backed commands may need to run outside restricted sandboxes because Playwright has to launch Chromium.
