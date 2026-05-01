# Changelog

## 0.5.0-hardening.48 - 2026-05-01

- opted the Verify workflow into Node 24 JavaScript actions early with `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` to clear GitHub's Node 20 deprecation warning before the June 2026 default switch

## 0.5.0-hardening.47 - 2026-05-01

- added `npm run validate:docs` to keep README, testing docs, deployment notes, hardening status, and PR verification commands aligned with the actual package scripts
- wired documentation validation into `npm test` and the GitHub Actions Verify workflow

## 0.5.0-hardening.46 - 2026-05-01

- rewired 24 Kenney manifest entries from ignored local source-pack paths into tracked `assets/models/kn_*.glb` files so Linux CI and GitHub Pages see the same assets as local Windows
- fixed the manifest-validation failure caught by GitHub Actions on the canonical repo

## 0.5.0-hardening.45 - 2026-04-30

- moved the 3D hint flag and cloud sync config onto the storage-key registry while keeping legacy cloud-key fallbacks
- added `npm run validate:storage-keys` and CI coverage for raw localStorage key drift

## 0.5.0-hardening.44 - 2026-04-30

- made `npm test` run lint and format checks before the validation chain so local verification matches CI discipline more closely

## 0.5.0-hardening.43 - 2026-04-30

- expanded PR and issue templates with current hardening verification, evidence, and scope-discipline prompts
- added `npm run validate:github-templates` and a CI gate so repository process docs do not drift behind the test suite

## 0.5.0-hardening.42 - 2026-04-30

- added a dev-mode boundary validator to keep model audit, diagnostics, preflight, and asset verification surfaces hidden from normal UI
- wired the dev-mode validator into local tests and CI

## 0.5.0-hardening.41 - 2026-04-30

- stamped every catalog asset with explicit `mountType` metadata so placement rules no longer depend on runtime guessing
- tightened manifest validation so future catalog entries must declare a valid mount type

## 0.5.0-hardening.40 - 2026-04-30

- hardened project JSON imports against prototype-pollution keys and oversized import files
- expanded project-schema validation to cover unsafe imported keys

## 0.5.0-hardening.39 - 2026-04-30

- added static app-shell accessibility validation for button types, icon names, dialog metadata, and decorative SVG hiding
- added dialog roles/labels to static modals and removed remaining phase-label comments from the app shell

## 0.5.0-hardening.38 - 2026-04-30

- added `data/asset-sources.json` and `sourceId` tracking for every manifest item so catalog provenance is explicit and machine-checkable
- added `npm run validate:asset-sources` and a CI gate for asset source registry drift

## 0.5.0-hardening.37 - 2026-04-30

- added a GLB size validation command and CI gate so oversized catalog assets are caught before they bloat the app

## 0.5.0-hardening.36 - 2026-04-30

- extracted export filename sanitizing into `scripts/export/filenames.js` and wired PNG/SVG/PDF/JSON downloads through the shared helper
- added an export filename validation command and CI gate

## 0.5.0-hardening.35 - 2026-04-30

- extracted 3D disposal helpers into `scripts/planner3d/lifecycle.js` and added validation for material, scene, renderer, listener, and composer cleanup

## 0.5.0-hardening.34 - 2026-04-30

- extracted pure 2D geometry helpers into `scripts/planner2d/geometry.js` with a reproducible validator while keeping compatibility wrappers in `state.js`

## 0.5.0-hardening.33 - 2026-04-30

- added an `appState.dispatch()` bridge for high-risk runtime actions and a reproducible validator for the dispatcher behavior

## 0.5.0-hardening.32 - 2026-04-30

- made cloud sync report local config storage failures, validate payloads before push/pull, and escape modal status/config values more defensively

## 0.5.0-hardening.31 - 2026-04-30

- tightened project JSON import validation for room text, polygon points, arrays, and furniture geometry
- added a reproducible project-schema validation command and CI gate

## 0.5.0-hardening.30 - 2026-04-30

- expanded `npm run clean` to remove ignored smoke, self-test, and debug artifacts with repository-root safety checks

## 0.5.0-hardening.29 - 2026-04-30

- removed the redirect-only `roses-indoor-designs.html` legacy entrypoint and made runtime validation block redirect shell drift

## 0.5.0-hardening.28 - 2026-04-30

- documented the remaining runtime CDN dependencies and added validation for pinned CDN versions and consistent Three.js loader versions

## 0.5.0-hardening.27 - 2026-04-30

- added a runtime-module bridge validator to catch missing, duplicate, or incorrectly ordered classic runtime modules before browser boot

## 0.5.0-hardening.26 - 2026-04-30

- introduced readable storage-service bridge names (`openDatabase`, `getRecord`, `setRecord`) while preserving legacy `odb`/`dg`/`ds` compatibility

## 0.5.0-hardening.25 - 2026-04-30

- changed the fatal-load screen to build DOM nodes with `textContent` instead of rendering boot error text through `innerHTML`

## 0.5.0-hardening.24 - 2026-04-30

- added recoverable dev-mode error reporting and replaced the remaining empty catch blocks in app scripts
- added a silent-catch validation command and CI gate so future failures must be handled intentionally

## 0.5.0-hardening.23 - 2026-04-30

- made CI enforce formatting and delegated UI handler validation alongside syntax, lint, manifest, self-test, Playwright, and smoke checks

## 0.5.0-hardening.22 - 2026-04-30

- replaced remaining runtime diagnostics, cloud modal, canvas, and reference-file direct handler assignments with delegated actions or `addEventListener`
- added an inline-handler audit check confirming no `onclick`/`onchange`/pointer property handlers remain under `scripts/`

## 0.5.0-hardening.21 - 2026-04-30

- moved generated 3D reveal, walkthrough, photo, and mobile walk-control tray actions to delegated `data-action` and hold handlers
- kept 3D tray behavior compatible with existing `npm test` self-test coverage for 3D entry and walk/orbit mode toggles

## 0.5.0-hardening.20 - 2026-04-30

- moved home project cards, create-room starter cards, delete confirmation buttons, and undo timeline nodes to delegated `data-action` handlers
- removed a stale unused room-card mini markup path from the catalog property panel
- extended desktop/mobile smoke coverage for create-modal, hidden home-card, and undo-strip inline handler checks

## 0.5.0-hardening.19 - 2026-04-30

- moved selected geometry and annotation property controls to delegated `data-action` handlers
- extended desktop/mobile Playwright smoke coverage for vertex, door, closet, text annotation, and dimension annotation panels

## 0.5.0-hardening.18 - 2026-04-30

- moved selected-furniture property controls to delegated `data-action` handlers
- extended desktop/mobile Playwright smoke coverage to seed a deterministic selected furniture item, edit its label, rotate it, lock it, and cycle redesign source/action controls

## 0.5.0-hardening.17 - 2026-04-30

- moved no-selection Furnish helper controls to delegated `data-action` handlers
- extended desktop/mobile smoke coverage for snap, multi-select, and unit toggles while restoring their original state

## 0.5.0-hardening.16 - 2026-04-30

- moved Tracing Reference, Redesign Planning, Plan Layers, Design Options, and Presentation room-panel controls to delegated `data-action` handlers
- extended desktop/mobile Playwright smoke coverage for layer toggles, redesign toggles, plan view mode, and option metadata edits

## 0.5.0-hardening.15 - 2026-04-30

- moved Ceiling Geometry and Design Direction controls to delegated `data-action` handlers
- extended the desktop/mobile Playwright smoke path to exercise room height, room type, and style preset controls

## 0.5.0-hardening.14 - 2026-04-30

- moved Lighting Mood preset and range controls to delegated `data-action` handlers
- extended the desktop/mobile Playwright smoke path to exercise delegated lighting controls

## 0.5.0-hardening.13 - 2026-04-30

- moved Surfaces wall, floor, and trim controls to delegated `data-action` handlers
- extended the desktop/mobile Playwright smoke path to exercise delegated surface controls

## 0.5.0-hardening.12 - 2026-04-30

- added desktop and mobile Chromium Playwright projects for the canonical smoke path
- made the room panel smoke flow resilient to mobile's collapsed panel behavior
- fixed catalog favorite hit targets after converting catalog cards away from nested buttons

## 0.5.0-hardening.11 - 2026-04-30

- moved Add Room width/depth inputs and Up/Right/Down/Left buttons to delegated `data-action` handlers
- extended Playwright coverage to add an adjacent room through the delegated Home Plan controls and confirm both rooms remain in the project

## 0.5.0-hardening.10 - 2026-04-30

- moved Home Plan room/floor panel controls to delegated `data-action` handlers
- moved property-panel close and room panel tabs off inline click handlers
- added Playwright coverage for delegated room panel tab switching and panel close behavior

## 0.5.0-hardening.9 - 2026-04-30

- replaced generated catalog picker inline handlers with delegated `data-action` handlers for search, close, filters, cards, favorites, placement, and variant chips
- extended the Playwright smoke spec to open the catalog picker and verify it has no generated inline handlers
- kept property-panel inline-handler cleanup tracked as remaining hardening work

## 0.5.0-hardening.8 - 2026-04-30

- added `docs/hardening-status.md` to track completed, partial, deferred, and remaining hardening work
- added `playwright.config.mjs` and a standard Playwright smoke spec for the canonical app shell
- added `npm run test:playwright` and CI coverage for the Playwright spec suite
- verified delegated shell actions, shortcut-sheet close behavior, create-room flow, and runtime version metadata in the spec

## 0.5.0-hardening.7 - 2026-04-30

- added `data/asset-validation-overrides.json` to document intentional shared GLB aliases
- updated manifest validation so expected shared model files are quiet, while stale overrides and unexpected duplicates still fail or warn

## 0.5.0-hardening.6 - 2026-04-30

- replaced silent persistence catches in IndexedDB, profile selection, editor preferences, and preview thumbnail generation with explicit error reports
- kept existing graceful fallback behavior while making storage and preference failures visible in diagnostics

## 0.5.0-hardening.5 - 2026-04-30

- added `scripts/core/storage-keys.js` as the localStorage and IndexedDB key registry
- moved profile/local storage key helpers out of `scripts/state.js` and `scripts/storage.js`
- aligned app version metadata across `package.json`, `index.html`, and `scripts/core/app-config.js`

## 0.5.0-hardening.4 - 2026-04-29

- extracted keyboard shortcut binding and shortcut-sheet rendering into `scripts/ui/shortcuts.js`
- removed the shortcut-sheet inline close handler in favor of the delegated `data-action` layer
- updated lint, format, and syntax-check coverage so the new `scripts/ui/**/*.js` runtime slice is verified explicitly

## 0.5.0-hardening.3 - 2026-04-26

- replaced a large shell/editor slice of inline `onclick` and `oninput` handlers with delegated `data-action` bindings
- bound the delegated UI action layer during boot so the home screen, editor chrome, 3D controls, and setup modal no longer depend on direct inline event wiring
- added a shared devtools static server helper and moved smoke/self-test runners to ephemeral ports to avoid fixed-port collisions during local verification

## 0.5.0-hardening.2 - 2026-04-26

- made `index.html` the canonical app shell
- added a documented runtime bootstrap bridge in `scripts/main.js`
- added repo workflow scripts for syntax, smoke, self-test, manifest validation, lint, format, and cleanup
- added first-pass architecture, data model, testing, deployment, roadmap, and limitations docs
- added manifest validation and self-test runner scripts
- moved cloud sync implementation into `scripts/cloud/supabase.js` with validation-aware merge behavior
- added central app config and version metadata

## 0.5.0-hardening.1 - 2026-04-26

- cleaned up README and entrypoint naming
- added initial GitHub Actions verification workflow
