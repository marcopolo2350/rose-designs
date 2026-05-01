# Hardening Status

Last updated: 2026-04-30

This document tracks the ruthless cleanup work honestly. It is not a claim that the full checklist is complete.

## Completed In Repo

- Canonical app shell is `index.html`.
- Redirect-only legacy HTML entrypoints have been removed and are blocked by runtime validation.
- App identity is centralized in `scripts/core/app-config.js`.
- Runtime boot has an explicit documented bridge in `scripts/main.js`.
- The transitional runtime bridge is validated by `npm run validate:runtime-modules` so missing or duplicate classic modules fail before browser boot.
- Remaining CDN dependencies are documented in `docs/dependencies.md` and guarded by `npm run validate:dependencies`.
- Package scripts exist for dev, syntax checks, lint, format, manifest validation, self-test, smoke, Playwright specs, thumbnails, and cleanup.
- `npm run clean` removes ignored smoke, self-test, and debug artifacts with root-bound safety checks.
- CI runs install, syntax checks, lint, format checks, manifest validation, delegated UI handler validation, silent-catch validation, built-in self-test, Playwright spec, and smoke checks.
- `scripts/core/app-state.js` owns the first central runtime metadata surface.
- `appState.dispatch()` now covers high-risk bridge actions for room selection, selection clearing, tool changes, render requests, save scheduling, 3D rebuild scheduling, and dirty/saved markers.
- `scripts/core/history.js` owns shared room history and undo/redo behavior.
- `scripts/core/storage-keys.js` owns localStorage and IndexedDB key naming.
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
- Project JSON import validation now checks room text fields, polygon geometry, array fields, and furniture geometry through `npm run validate:project-schema`.
- Experimental cloud sync validates room payloads before push/pull and reports config storage failures instead of silently swallowing them.
- `data/asset-validation-overrides.json` documents intentional shared GLB aliases.
- Standard Playwright config and a shell smoke spec exist for desktop and mobile Chromium viewports.
- README, changelog, roadmap, architecture, data model, testing, deployment, and limitations docs exist.

## Partially Completed

- The runtime is still browser-global, but the bridge is explicit and several core surfaces have been extracted.
- State is still largely mutable globals, but high-risk metadata and history now have central owners.
- Inline handlers and direct `on*` handler properties are removed from the static app shell and application scripts.
- Manifest validation is stricter and quieter, but asset licensing and heavy GLB audits are still not complete.
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
npm run validate:error-handling
npm run validate:runtime-modules
npm run validate:dependencies
npm run validate:project-schema
npm run validate:app-state
npm run test:playwright
npm test
npm run test:smoke
```

The browser-backed commands may need to run outside restricted sandboxes because Playwright has to launch Chromium.
