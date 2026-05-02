# Hardening Status

Last updated: 2026-05-02

Current app version: `0.5.0-hardening.115`

This document tracks the ruthless cleanup work honestly. It is not a claim that the full checklist is complete.

## Completed In Repo

- Canonical app shell is `index.html`.
- Redirect-only legacy HTML entrypoints have been removed and are blocked by runtime validation.
- App identity is centralized in `scripts/core/app-config.js`.
- Runtime boot has an explicit documented bridge in `scripts/main.js`.
- The transitional runtime bridge is validated by `npm run validate:runtime-modules` so missing or duplicate classic modules fail before browser boot.
- The current browser-global compatibility surface is frozen by `npm run validate:global-bridge` so new `window.*` assignments are intentional.
- Runtime script cache-busting now uses the canonical `application-version` meta tag instead of a stale fixed bridge value.
- The old `scripts/app.js` compatibility wrapper is removed, and runtime validation blocks it from returning.
- File-mode model preflight recovery now points to the canonical `index.html` local preview URL from app config instead of stale legacy HTML filenames.
- Runtime module validation now blocks legacy `rose-designs.html` and `roses-indoor-designs.html` references from returning inside app modules.
- Package, lockfile, app shell, runtime config, changelog, and hardening-status versions are guarded by `npm run validate:version`.
- Remaining CDN dependencies are documented in `docs/dependencies.md` and guarded by `npm run validate:dependencies`.
- Lazy-loaded CDN dependencies, including experimental cloud sync's Supabase client, are now covered by dependency validation.
- The unused `dxf-writer` package was removed after CAD/DXF export was intentionally removed, and dependency validation blocks it from returning accidentally.
- Package scripts exist for dev, syntax checks, lint, format, manifest validation, self-test, smoke, Playwright specs, thumbnails, and cleanup.
- `npm run check` now scans maintained scripts, tests, and tool-config files instead of relying on a brittle manual `node --check` chain.
- `npm test` now includes syntax, lint, format, validators, and the built-in self-test so local verification mirrors CI discipline more closely.
- `npm run clean` removes ignored smoke, self-test, Edge browser-profile, and debug artifacts with root-bound safety checks.
- `npm run validate:clean-ignore` now verifies generated artifacts cleaned by `npm run clean` remain ignored in `.gitignore`.
- CI runs install, syntax checks, lint, format checks, manifest validation, delegated UI handler validation, silent-catch validation, built-in self-test, Playwright spec, and smoke checks.
- `scripts/core/app-state.js` owns the first central runtime metadata surface.
- `appState.dispatch()` now covers high-risk bridge actions for room selection, selection clearing, tool changes, render requests, save scheduling, 3D rebuild scheduling, and dirty/saved markers.
- `scripts/core/history.js` owns shared room history and undo/redo behavior, loads before the 3D renderer, and `npm run validate:structure` blocks history handlers from returning to `scripts/planner3d.js`.
- `scripts/core/storage-keys.js` owns localStorage and IndexedDB key naming.
- `npm run validate:storage-keys` blocks raw localStorage key literals outside the storage-key boundary.
- Active profile persistence now uses the storage-key boundary while preserving the legacy profile key during migration.
- `npm run validate:storage-keys` now blocks direct `localStorage` access from general app files.
- IndexedDB open/read/write behavior now lives in `scripts/core/storage-service.js`, with legacy wrappers kept in `scripts/storage.js`.
- `npm run validate:structure` blocks direct `indexedDB.open` usage outside the storage-service boundary.
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
- The fatal-load screen now uses CSS classes instead of inline style mutation, guarded by `npm run validate:html-safety`.
- Shared HTML escaping now lives in `scripts/core/html.js`, and high-risk diagnostic/self-test rendering paths are guarded by `npm run validate:html-safety`.
- Legacy room-panel templates now route through `RoseHTML.setTrustedHTML()`, a sanitized trusted-template bridge that strips event attributes, dangerous URLs, dangerous inline style values, and blocked tags before appending DOM nodes.
- `npm run validate:html-safety` now blocks direct `innerHTML`, `outerHTML`, and `insertAdjacentHTML` rendering in app runtime files outside the core HTML safety boundary.
- The project delete confirmation now renders with DOM nodes and `textContent`, and `npm run validate:html-safety` blocks it from regressing to string-built HTML.
- The project delete confirmation supports Escape close and Tab focus containment, covered by Playwright and guarded by `npm run validate:html-safety`.
- The keyboard shortcut sheet now renders with DOM nodes instead of `innerHTML`, guarded by `npm run validate:html-safety`.
- The first-run tutorial card now renders with DOM nodes and `textContent`, covered by Playwright and guarded by `npm run validate:html-safety`.
- The home project list now renders cards with DOM nodes and `textContent`, with Playwright coverage for unsafe project names and `npm run validate:html-safety` regression guards.
- The create-room starter grid now renders cards and SVG previews with DOM nodes, with Playwright inline-markup coverage and `npm run validate:html-safety` regression guards.
- The undo timeline strip now renders visible undo nodes with DOM nodes, guarded by `npm run validate:html-safety`.
- The asset preflight diagnostics panel now renders dynamic runtime URLs and status rows with DOM nodes and `textContent`, guarded by `npm run validate:html-safety`.
- The room runtime diagnostics panel now renders dynamic model placement status with DOM nodes and `textContent`, guarded by `npm run validate:html-safety`.
- The catalog placement status bar now renders item labels, placement status, and mobile placement actions with DOM nodes and `textContent`, guarded by `npm run validate:html-safety`.
- The furniture catalog picker overlay now renders filters, sections, asset cards, thumbnails, favorites, and empty-state copy with DOM nodes and `textContent`, guarded by `npm run validate:html-safety`.
- Room-panel floor button restyling now rebuilds label/count spans with DOM nodes and `textContent`, guarded by `npm run validate:html-safety`.
- Desktop and mobile Playwright coverage now asserts room/floor buttons keep clean ASCII labels, title/count spans, and non-overlapping text boxes after adding an adjacent room.
- Project JSON import validation now checks room text fields, polygon geometry, array fields, and furniture geometry through `npm run validate:project-schema`.
- Project JSON import validation now rejects dangerous prototype-pollution keys and oversized JSON files before merging rooms into local state.
- Experimental cloud sync validates room payloads before push/pull and reports config storage failures instead of silently swallowing them.
- The unused `scripts/cloud-sync.js` compatibility wrapper was removed, and structure validation blocks it from returning.
- Experimental cloud sync settings now render with DOM nodes and CSS classes, with Escape close and Tab focus containment guarded by `npm run validate:html-safety`.
- Experimental cloud sync warnings, RLS docs, compatibility globals, validation hooks, and no-direct-global-mutation rules are guarded by `npm run validate:cloud-boundary`.
- Pure 2D geometry helpers are isolated in `scripts/planner2d/geometry.js` and covered by `npm run validate:geometry`.
- Catalog default placement and elevation rules are isolated in `scripts/catalog/placement-rules.js` and covered by `npm run validate:placement-rules`, so wall/ceiling defaults do not return to label-specific state logic.
- Wall, ceiling, surface, and elevated catalog assets now carry manifest `placement` metadata for snap target, forward axis, and default elevation rules; runtime placement registers that metadata before using legacy fallbacks.
- Catalog manifest loading and normalization is isolated in `scripts/catalog/manifest.js`, and required source boundary directories are guarded by `npm run validate:structure`.
- 3D material, scene, renderer, listener, and composer disposal helpers are isolated in `scripts/planner3d/lifecycle.js` and covered by `npm run validate:3d-lifecycle`.
- 3D time-of-day lighting curves are isolated in `scripts/planner3d/lighting.js` and covered by `npm run validate:3d-lighting`, including bounded noon exposure so the room does not wash out.
- 3D camera labels and pose math are isolated in `scripts/planner3d/camera.js` and covered by `npm run validate:3d-camera`, including favorite-corner, overhead, and multi-room overview framing.
- 3D furniture finish/material helpers are isolated in `scripts/planner3d/materials.js` and covered by `npm run validate:3d-materials`.
- GLTF loader/cache/error-status behavior is isolated in `scripts/planner3d/model-loader.js` and covered by `npm run validate:3d-model-loader`.
- Duplicate 3D view, walkthrough, photo, camera, and rebuild handler overrides were collapsed into single function declarations, and `npm run validate:structure` blocks those late overrides from returning.
- Export filenames are sanitized through `scripts/export/filenames.js` and covered by `npm run validate:export-filenames`.
- Export downloads are centralized in `scripts/export/downloads.js`, loaded before export/3D runtime code, and covered by source/export validation.
- Project JSON import/export is isolated in `scripts/export/project-json.js` and guarded by source/export validation.
- PDF and presentation export behavior is isolated in `scripts/export/pdf.js`, loaded before the legacy export bridge, and guarded by source/export validation.
- PNG export, comparison sheets, design summaries, and render-to-image helpers are isolated in `scripts/export/png.js`, loaded before the legacy export bridge, and guarded by source/export validation.
- Print floor-plan export is isolated in `scripts/export/print.js`, loaded before the legacy export bridge, and guarded by source/export validation.
- SVG export is isolated in `scripts/export/svg.js`, loaded before the legacy export bridge, and guarded by source/export validation.
- The legacy `scripts/export.js` bridge has been removed; runtime/source validation blocks it from returning as a compatibility dumping ground.
- 3D renderer and verification-canvas containers are cleared through `RoseHTML.clear()` instead of empty `innerHTML` assignments, guarded by `npm run validate:3d-lifecycle`.
- Dev-only 3D asset verification cards and metadata rows render with DOM nodes and `textContent`, guarded by `npm run validate:html-safety`.
- Mobile 3D walk controls render with DOM nodes, CSS classes, and accessible hold-button labels instead of injected inline HTML/styles, guarded by `npm run validate:html-safety`.
- The 3D Reveal Mode presentation tray now renders room story copy, shot controls, and actions with DOM nodes and `textContent`, guarded by `npm run validate:html-safety`.
- The 3D Walkthrough and Photo Mode trays now render preset labels, copy, and action buttons with DOM nodes and `textContent`, guarded by `npm run validate:html-safety`.
- Maintained source comments no longer carry phase-history labels, and `npm run validate:structure` blocks them from returning across `scripts/**/*.js` and `scripts/**/*.mjs`.
- `data/asset-validation-overrides.json` documents intentional shared GLB aliases.
- Every catalog entry now declares a valid `mountType`, and manifest validation blocks mounted entries that omit placement metadata.
- Kenney catalog entries now point to tracked `assets/models/kn_*.glb` files instead of ignored local source-pack paths, so CI and GitHub Pages validate the same assets as the local app.
- GLB asset file sizes are guarded by `npm run validate:asset-sizes` with a 10 MB per-model ceiling.
- Every manifest entry now carries a `sourceId`, and `npm run validate:asset-sources` checks it against `data/asset-sources.json`.
- Static app-shell accessibility basics are guarded by `npm run validate:static-a11y` for button types, icon labels, dialog metadata, and decorative SVG hiding.
- Static app-shell form controls now carry accessible names, guarded by `npm run validate:static-a11y`.
- Runtime text encoding is guarded by `npm run validate:text-encoding`, and the catalog no longer carries mojibake icons or question-mark icon fallbacks.
- Static new-tab links are guarded so future `target="_blank"` anchors must include `rel="noopener noreferrer"`.
- Static inline styles are blocked in the app shell; formerly inline hidden states, profile modal copy, room-type icons, brief swatches, and time-of-day preset sizing now use CSS classes instead.
- CSS accessibility and mobile guardrails are covered by `npm run validate:css`, including focus-visible styling, reduced motion, safe-area handling, and banned negative letter spacing.
- CSS phase-history comments were removed, and `npm run validate:css` blocks phase-archaeology comments from returning.
- `styles/app.css` is now an ordered stylesheet manifest, while base, home, editor, planner, panel, modal, catalog, devtools, mobile, and overlay styling live in separate CSS files guarded by `npm run validate:css`.
- `npm run validate:version` now also keeps the app stylesheet cache-busting query aligned with the canonical app version.
- Dev/debug surfaces are guarded by `npm run validate:dev-mode` so model audits, diagnostics, and asset verification stay behind dev mode.
- GitHub PR and issue templates are guarded by `npm run validate:github-templates` so future work keeps hardening scope and verification prompts.
- The Verify workflow is guarded by `npm run validate:workflow` so CI keeps mirroring local hardening commands, current action majors, bounded Playwright install, and artifact uploads.
- Package metadata, required scripts, Node version guidance, and workflow alignment are guarded by `npm run validate:package`.
- README, testing docs, deployment notes, hardening status, and PR verification commands are guarded by `npm run validate:docs`.
- `npm run validate:docs` now also guards the hardening-status verification command list.
- `npm run validate:docs` now blocks stale legacy app-shell HTML filenames from returning in canonical docs and the progress log.
- The Verify workflow uses current Node 24-compatible official action majors and keeps `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` guarded by repository validation.
- The Verify workflow bounds Playwright Chromium installation with a five-minute step timeout and avoids the previously wedged hosted-runner `--with-deps` install path.
- Standard Playwright config and a shell smoke spec exist for desktop and mobile Chromium viewports.
- Playwright smoke coverage includes Project JSON import through the real hidden file input.
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
- Full DOM rendering for generated editor panels: important, but the remaining room-panel templates now pass through the sanitized trusted-template bridge instead of direct `innerHTML`.
- Full dependency bundling: still deferred to preserve GitHub Pages compatibility while hardening behavior.

## Current Known Debt

- `scripts/ui.js`, `scripts/catalog.js`, `scripts/planner2d.js`, and `scripts/planner3d.js` are still large browser-global files.
- Some legacy globals and large files remain; the event-handler cleanup is now substantially cleaner, but the browser-global architecture is still transitional.
- Some room property panel sections still originate as string templates before passing through `RoseHTML.setTrustedHTML()`; a full DOM section-by-section renderer remains the cleaner end state.
- Some catches remain intentionally soft for rendering/math fallbacks, but empty catches are now blocked by validation.
- Catalog metadata still has model aliases, now documented through validation overrides.
- The app still relies on CDN-loaded Three.js, jsPDF, and pdf.js at runtime.

## Reproducible Verification

Run:

```bash
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
npm run validate:package
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
npm run validate:3d-materials
npm run validate:3d-model-loader
npm run validate:export-filenames
npm run test:playwright
npm run test:self
npm test
npm run test:smoke
```

The browser-backed commands may need to run outside restricted sandboxes because Playwright has to launch Chromium.
