# Hardening Status

Last updated: 2026-04-30

This document tracks the ruthless cleanup work honestly. It is not a claim that the full checklist is complete.

## Completed In Repo

- Canonical app shell is `index.html`.
- App identity is centralized in `scripts/core/app-config.js`.
- Runtime boot has an explicit documented bridge in `scripts/main.js`.
- Package scripts exist for dev, syntax checks, lint, format, manifest validation, self-test, smoke, Playwright specs, thumbnails, and cleanup.
- CI runs install, syntax checks, lint, manifest validation, built-in self-test, Playwright spec, and smoke checks.
- `scripts/core/app-state.js` owns the first central runtime metadata surface.
- `scripts/core/history.js` owns shared room history and undo/redo behavior.
- `scripts/core/storage-keys.js` owns localStorage and IndexedDB key naming.
- `scripts/cloud/supabase.js` isolates experimental cloud sync behavior.
- `scripts/ui/shortcuts.js` owns keyboard shortcuts and shortcut-sheet rendering.
- Generated catalog picker interactions use delegated `data-action` handlers instead of inline event attributes.
- Home Plan room/floor controls, property-panel close, and room panel tabs use delegated `data-action` handlers.
- Add Room width/depth and Up/Right/Down/Left controls use delegated `data-action` handlers and have a Playwright adjacent-room smoke path.
- Surfaces wall, floor, and trim controls use delegated `data-action` handlers and are covered by the desktop/mobile Playwright smoke path.
- Lighting Mood preset and range controls use delegated `data-action` handlers and are covered by the desktop/mobile Playwright smoke path.
- Ceiling Geometry and Design Direction controls use delegated `data-action` handlers and are covered by the desktop/mobile Playwright smoke path.
- `data/asset-validation-overrides.json` documents intentional shared GLB aliases.
- Standard Playwright config and a shell smoke spec exist for desktop and mobile Chromium viewports.
- README, changelog, roadmap, architecture, data model, testing, deployment, and limitations docs exist.

## Partially Completed

- The runtime is still browser-global, but the bridge is explicit and several core surfaces have been extracted.
- State is still largely mutable globals, but high-risk metadata and history now have central owners.
- Inline handlers are removed from the static app shell, generated catalog picker, Home Plan controls, Add Room controls, Surfaces controls, Lighting Mood controls, Ceiling Geometry, and Design Direction, but generated property-panel markup still contains inline handlers in legacy editor surfaces.
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
- Generated property-panel HTML still uses inline event handlers outside the catalog picker, Home Plan, Add Room, Surfaces, Lighting Mood, Ceiling Geometry, and Design Direction controls.
- Some catches remain intentionally soft for rendering/math fallbacks and should be reviewed in smaller passes.
- Catalog metadata still has model aliases, now documented through validation overrides.
- The app still relies on CDN-loaded Three.js, jsPDF, and pdf.js at runtime.

## Reproducible Verification

Run:

```bash
npm run check
npm run lint
npm run format
npm run validate:manifest
npm run test:playwright
npm test
npm run test:smoke
```

The browser-backed commands may need to run outside restricted sandboxes because Playwright has to launch Chromium.
