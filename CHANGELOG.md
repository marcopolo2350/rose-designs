# Changelog

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
