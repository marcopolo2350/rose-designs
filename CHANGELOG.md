# Changelog

## 0.5.0-hardening.124 - 2026-05-07

- extracted procedural floor texture and planar UV helper behavior into `scripts/planner3d/textures.js`
- added `validate:3d-textures` and wired it through local `npm test`, CI, docs, and the PR checklist

## 0.5.0-hardening.123 - 2026-05-07

- extracted 3D furniture placement for wall, surface, ceiling, and floor assets into `scripts/planner3d/placement.js`
- added `validate:3d-placement` and wired it through local `npm test`, CI, docs, and the PR checklist

## 0.5.0-hardening.122 - 2026-05-07

- extracted 3D wall segment, door leaf, window trim, and orbit cutaway helper behavior into `scripts/planner3d/walls.js`
- added `validate:3d-walls` and wired it through local `npm test`, CI, docs, and the PR checklist

## 0.5.0-hardening.121 - 2026-05-06

- increased the multi-room 3D Playwright mesh-registration wait for slower mobile CI WebGL startup
- kept the regression focused on verifying both furnished rooms render in the same 3D floor

## 0.5.0-hardening.120 - 2026-05-06

- extracted shared 3D room-shell shape, bounds, geometry, and texture-anisotropy helpers into `scripts/planner3d/room-shell.js`
- registered the room-shell boundary in the runtime bridge and source/global-bridge validators
- added Playwright coverage that adds an adjacent room, furnishes both rooms, enters 3D, and verifies both room shells and furniture anchors render

## 0.5.0-hardening.119 - 2026-05-06

- moved 3D renderer shader-diagnostic gating into `scripts/planner3d/lifecycle.js`
- kept Three.js shader checks enabled in dev mode while suppressing production PMREM vendor warnings during normal 3D entry
- extended `validate:3d-lifecycle` to guard renderer diagnostic behavior

## 0.5.0-hardening.118 - 2026-05-02

- extracted 2D furniture tint, stroke, and label-ink helpers into `scripts/planner2d/furniture-style.js`
- registered the furniture style boundary in runtime order and global-bridge validation
- added `validate:furniture-style` to guard 2D furniture readability styling

## 0.5.0-hardening.117 - 2026-05-02

- extracted wall-mounted furniture snapping helpers into `scripts/planner2d/snapping.js`
- registered the snapping boundary in runtime order and global-bridge validation
- added `validate:snapping` to guard wall, opening, and floor-item snap behavior

## 0.5.0-hardening.116 - 2026-05-02

- extracted 2D reference overlay geometry and label helpers into `scripts/planner2d/reference-overlay.js`
- registered the reference overlay boundary in runtime order and global-bridge validation
- added `validate:reference-overlay` to keep reference overlay helpers out of the main 2D planner

## 0.5.0-hardening.115 - 2026-05-02

- extracted furniture finish/material helpers into `scripts/planner3d/materials.js`
- registered the 3D material boundary in runtime order and global-bridge validation
- added `validate:3d-materials` to keep finish/material behavior out of the main 3D renderer

## 0.5.0-hardening.114 - 2026-05-02

- extracted GLTF loader/cache/error-status behavior into `scripts/planner3d/model-loader.js`
- registered the 3D model-loader boundary in runtime order and global-bridge validation
- added `validate:3d-model-loader` to keep model-loading behavior out of the main 3D renderer

## 0.5.0-hardening.113 - 2026-05-02

- added `validate:package` to enforce required npm scripts, package metadata, Node version guidance, and workflow alignment
- wired the package/tooling validator into `npm test` and the Verify GitHub Actions workflow
- documented the new reproducible package contract check

## 0.5.0-hardening.112 - 2026-05-02

- removed the legacy `scripts/export.js` bridge after replacing its last SVG helper call with shared export services
- tightened runtime/source validation so `scripts/export.js` cannot return as a compatibility dumping ground
- kept PDF, PNG, print, SVG, downloads, filenames, and project JSON export behavior in explicit `scripts/export/` boundaries

## 0.5.0-hardening.111 - 2026-05-02

- extracted PDF and presentation export behavior into `scripts/export/pdf.js` while preserving the existing `exportPDF()` UI hook
- registered the PDF export boundary in runtime order, global-bridge validation, and export/source validation
- shrank the legacy `scripts/export.js` bridge to shared compatibility helpers only

## 0.5.0-hardening.110 - 2026-05-02

- extracted print-floor-plan behavior into `scripts/export/print.js` while preserving the existing `printFloorPlan()` UI hook
- added print export registration to the runtime bridge, global-bridge validator, and export boundary validator
- kept the legacy export bridge focused on shared helpers plus PDF/presentation generation

## 0.5.0-hardening.109 - 2026-05-02

- extracted PNG, comparison-sheet, design-summary, and render-to-image helpers into `scripts/export/png.js`
- kept existing global export hooks compatible while shrinking the legacy export bridge to PDF/presentation helpers
- extended export/source/global validation so PNG export behavior cannot drift back into `scripts/export.js`

## 0.5.0-hardening.108 - 2026-05-02

- extracted SVG export behavior into `scripts/export/svg.js` while keeping the existing `exportSVG()` UI hook
- added source-structure and export validation so SVG export logic does not drift back into `scripts/export.js`
- wired the SVG export boundary into runtime load order and the global-bridge validator

## 0.5.0-hardening.107 - 2026-05-02

- added manifest `placement` metadata for wall, ceiling, surface, and elevated catalog assets
- made catalog placement rules register manifest metadata before falling back to legacy defaults
- tightened manifest and placement-rule validation so mounted assets declare snap target, forward axis, and default elevation rules

## 0.5.0-hardening.106 - 2026-05-02

- isolated catalog default placement and elevation rules into `scripts/catalog/placement-rules.js`
- added `npm run validate:placement-rules` to guard wall, ceiling, surface, and floor placement defaults
- routed `state.js` default elevation through the catalog-owned rules boundary

## 0.5.0-hardening.105 - 2026-05-02

- removed duplicate late override patterns from 3D view, walkthrough, photo, camera, and rebuild handlers
- kept the existing final behavior as single function declarations so future edits touch one owner per handler
- expanded source-structure validation to block those 3D handler overrides from returning

## 0.5.0-hardening.104 - 2026-05-02

- isolated 3D camera labels and pose math into `scripts/planner3d/camera.js`
- added `npm run validate:3d-camera` to guard favorite-corner, overhead, and multi-room overview camera framing
- wired the 3D camera boundary into runtime load order, CI, docs, and bridge validation

## 0.5.0-hardening.103 - 2026-05-02

- isolated data-driven time-of-day lighting curves into `scripts/planner3d/lighting.js`
- added `npm run validate:3d-lighting` to guard HDRI buckets, bounded noon exposure, and brightness curves
- wired the 3D lighting boundary into runtime load order, CI, docs, and bridge validation

## 0.5.0-hardening.102 - 2026-05-02

- split the monolithic stylesheet into ordered CSS surface files while keeping `styles/app.css` as the cascade manifest
- expanded CSS validation so required style files, manifest order, accessibility guards, mobile guards, and banned CSS patterns are checked across the split stylesheet set
- added version validation for the app stylesheet URL so CSS cache-busting stays aligned with the app release

## 0.5.0-hardening.101 - 2026-05-02

- removed duplicate undo/redo handlers from `scripts/planner3d.js` so room history stays owned by `scripts/core/history.js`
- added source-structure validation to keep history behavior from returning to the 3D renderer

## 0.5.0-hardening.100 - 2026-05-02

- added desktop/mobile Playwright regression coverage for room/floor button label cleanliness after adding an adjacent room
- guarded floor buttons against corrupted text, missing title/count spans, and label overlap regressions

## 0.5.0-hardening.99 - 2026-05-02

- cleaned mojibake catalog icons, section comments, reference status separators, and thumbnail comments from runtime files
- added `npm run validate:text-encoding` to block mojibake, phase-history comments, and question-mark catalog icon fallbacks from returning

## 0.5.0-hardening.98 - 2026-05-02

- added `npm run validate:cloud-boundary` to guard experimental Supabase sync boundaries
- documented cloud sync status, RLS setup, conflict policy, and validation expectations
- cleaned cloud schema comments so phase-history and mojibake text do not return

## 0.5.0-hardening.97 - 2026-05-02

- added explicit accessible names to static app-shell file, range, room setup, and reference calibration inputs
- expanded static accessibility validation so future static form controls need accessible names

## 0.5.0-hardening.96 - 2026-05-02

- added `npm run validate:global-bridge` to freeze the current browser-global compatibility surface
- wired global-bridge validation into local verification, CI, docs, and the PR checklist

## 0.5.0-hardening.95 - 2026-05-02

- expanded dependency validation to include lazy-loaded CDN scripts inside runtime modules
- documented the experimental cloud sync Supabase CDN dependency in the dependency policy

## 0.5.0-hardening.94 - 2026-05-02

- extracted IndexedDB open/read/write behavior into `scripts/core/storage-service.js`
- kept legacy storage globals as compatibility wrappers and guarded direct IndexedDB opens with source-structure validation
- switched runtime script cache-busting to the canonical `application-version` meta tag

## 0.5.0-hardening.93 - 2026-05-02

- moved active profile persistence behind the storage-key boundary while preserving the legacy profile key
- tightened storage-key validation so general app files cannot access `localStorage` directly

## 0.5.0-hardening.92 - 2026-05-02

- added `npm run validate:workflow` to keep the GitHub Verify workflow aligned with local hardening checks
- guarded current action majors, bounded Playwright browser install, and CI artifact uploads from drifting silently

## 0.5.0-hardening.91 - 2026-05-02

- added clean/ignore contract validation for generated local artifacts
- wired `validate:clean-ignore` into `npm test`, CI, docs, and the PR verification checklist

## 0.5.0-hardening.90 - 2026-05-02

- removed the unused `scripts/cloud-sync.js` compatibility wrapper
- extended source-structure validation so the dead wrapper cannot return

## 0.5.0-hardening.89 - 2026-05-02

- canonicalized stale app-shell references in `progress.md`
- extended documentation validation to block old app-shell HTML filenames in canonical docs and progress notes

## 0.5.0-hardening.88 - 2026-05-02

- expanded `npm run clean` to remove ignored Edge browser-profile artifacts and leftover temporary debug files
- kept cleanup root-bound so recursive artifact removal cannot escape the repository

## 0.5.0-hardening.87 - 2026-05-02

- replaced the manual syntax-check command chain with a maintained script/test/config syntax scanner
- expanded `npm run check` coverage to include root utility scripts such as asset absorption and thumbnail generation

## 0.5.0-hardening.86 - 2026-05-02

- removed remaining phase-history comments from maintained asset and material utility scripts
- expanded source-structure validation so phase-history comments are blocked across all maintained script files

## 0.5.0-hardening.85 - 2026-05-02

- moved file-mode model preflight recovery to the canonical local `index.html` preview URL from app config
- extended runtime module validation so legacy app-shell HTML filenames cannot return inside app modules

## 0.5.0-hardening.84 - 2026-05-02

- bounded the GitHub Verify workflow Playwright browser install step with a five-minute timeout
- switched CI browser installation to Chromium-only install so a hosted-runner dependency install hang cannot freeze the entire hardening gate

## 0.5.0-hardening.83 - 2026-05-01

- added a sanitized `RoseHTML.setTrustedHTML()` bridge for legacy room-panel templates
- routed room property panel rendering through the trusted-template bridge and blocked direct app-side HTML insertion outside `scripts/core/html.js`

## 0.5.0-hardening.82 - 2026-05-01

- rebuilt the furniture catalog picker overlay with DOM nodes, `textContent`, and dataset-bound actions
- moved catalog filter chip sizing into CSS and added HTML safety validation for the picker overlay

## 0.5.0-hardening.81 - 2026-05-01

- rebuilt the 3D Walkthrough and Photo Mode trays with DOM nodes and `textContent`
- tightened HTML safety validation so `planner3d.js` cannot reintroduce direct tray HTML insertion

## 0.5.0-hardening.80 - 2026-05-01

- rebuilt the 3D Reveal Mode presentation tray with DOM nodes and `textContent`
- extended HTML safety validation to block presentation tray string rendering from returning

## 0.5.0-hardening.79 - 2026-05-01

- removed phase-history comments from runtime modules so source comments describe current behavior
- extended source-structure validation to block phase-history comments in the runtime bridge

## 0.5.0-hardening.78 - 2026-05-01

- rebuilt the mobile 3D walk-control dock with DOM nodes and CSS classes instead of injected inline HTML/styles
- added accessible labels to walk-control hold buttons and guarded the dock renderer with HTML safety validation

## 0.5.0-hardening.77 - 2026-05-01

- rebuilt the dev-only 3D asset verification cards and metadata rows with DOM nodes and `textContent`
- extended HTML safety validation to block asset verification HTML-string rendering from returning

## 0.5.0-hardening.76 - 2026-05-01

- switched 3D renderer container cleanup from empty `innerHTML` assignments to `RoseHTML.clear()`
- extended 3D lifecycle validation to block empty `innerHTML` clears from returning

## 0.5.0-hardening.75 - 2026-05-01

- rebuilt room-panel floor button restyling with DOM nodes and `textContent`
- extended HTML safety validation to keep floor button label cleanup out of `innerHTML`

## 0.5.0-hardening.74 - 2026-05-01

- rebuilt the catalog placement status bar with DOM nodes and `textContent`
- extended HTML safety validation to block catalog placement string rendering from returning

## 0.5.0-hardening.73 - 2026-05-01

- rebuilt the room runtime diagnostics panel with DOM nodes and `textContent`
- extended HTML safety validation to block runtime diagnostic string rendering from returning

## 0.5.0-hardening.72 - 2026-05-01

- rebuilt the asset preflight diagnostics panel with DOM nodes and `textContent`
- extended HTML safety validation to block asset-preflight string rendering from returning

## 0.5.0-hardening.71 - 2026-05-01

- rebuilt the undo timeline strip so visible undo nodes are DOM-rendered instead of assigned through `innerHTML`
- extended HTML safety validation to block undo-strip string rendering from returning

## 0.5.0-hardening.70 - 2026-05-01

- rebuilt create-room starter cards and their SVG previews with DOM nodes instead of `innerHTML`
- added Playwright coverage that starter cards have no inline markup or handlers
- extended HTML safety validation to block starter-card string rendering from returning

## 0.5.0-hardening.69 - 2026-05-01

- rebuilt the home project list and project cards with DOM nodes instead of `innerHTML`
- moved project thumbnail preview styling into CSS classes
- added Playwright coverage that project names render as text instead of executable markup
- extended HTML safety validation to block home-card string rendering from returning

## 0.5.0-hardening.68 - 2026-05-01

- rebuilt the first-run tutorial card with DOM nodes and `textContent` instead of `innerHTML`
- added Playwright coverage for the tutorial card inline-markup guardrail
- extended HTML safety validation to block tutorial string rendering from returning

## 0.5.0-hardening.67 - 2026-05-01

- moved fatal-load screen styling from JavaScript `style.cssText` mutations into CSS classes
- extended HTML safety validation to block fatal-load inline style regressions

## 0.5.0-hardening.66 - 2026-05-01

- rebuilt the experimental cloud sync settings dialog with DOM nodes and CSS classes instead of inline HTML/styles
- added Escape close and Tab focus containment to the cloud sync settings dialog
- extended HTML safety validation to block cloud modal string rendering and inline style regressions
- added Playwright coverage for the cloud sync settings dialog accessibility and inline-markup guardrails
- fixed modal keyboard ownership so trapped Tab/Escape events cannot leak into global editor shortcuts
- stabilized the mobile smoke close-panel step by dispatching the delegated close action directly

## 0.5.0-hardening.65 - 2026-05-01

- rebuilt the keyboard shortcut sheet with DOM nodes instead of `innerHTML` string templates
- extended HTML safety validation to block shortcut-sheet HTML string rendering from returning

## 0.5.0-hardening.64 - 2026-05-01

- removed phase-history comments from the stylesheet so source comments describe current UI areas
- extended CSS validation to block phase-archaeology comments from returning

## 0.5.0-hardening.63 - 2026-05-01

- removed the remaining static inline style attributes from `index.html`
- moved room-type icons, brief swatches, profile modal copy, and time-of-day preset sizing into CSS classes
- extended static accessibility validation to block future inline style attributes in the app shell

## 0.5.0-hardening.62 - 2026-05-01

- replaced static inline `display:none` usage with CSS classes for hidden app-shell elements
- moved print header sizing/typography out of inline markup and into `styles/app.css`
- updated the continue-project button to toggle a hidden class instead of mutating inline display styles
- extended static accessibility validation to block inline `display:none` regressions

## 0.5.0-hardening.61 - 2026-05-01

- extended documentation validation so `docs/hardening-status.md` must list every reproducible verification command
- updated the hardening-status verification list with the missing version, inline-handler, and self-test commands

## 0.5.0-hardening.60 - 2026-05-01

- added Playwright smoke coverage for Project JSON import through the real file input
- verified imported rooms are validated, normalized, saved, and added to project state without console/page errors

## 0.5.0-hardening.59 - 2026-05-01

- added `eslint.config.js` to syntax and formatting checks so the tool config is verified with runtime code
- extended static accessibility validation to require `rel="noopener noreferrer"` on any future new-tab links
- updated README and hardening status to document the broader checks

## 0.5.0-hardening.58 - 2026-05-01

- extracted Project JSON import/export behavior into `scripts/export/project-json.js`
- wired the new export boundary into the runtime bridge, syntax checks, source-structure validation, and export validation
- kept the existing UI hooks while removing Project JSON functions from the monolithic `scripts/export.js`

## 0.5.0-hardening.57 - 2026-05-01

- removed the unused `dxf-writer` runtime dependency and lockfile entry after CAD/DXF export removal
- documented the current npm dependency posture in `docs/dependencies.md`
- extended dependency validation to block accidental reintroduction of `dxf-writer`

## 0.5.0-hardening.56 - 2026-05-01

- removed the obsolete `scripts/app.js` compatibility wrapper so `scripts/main.js` is the only app bootstrap path
- removed the wrapper from syntax checks and README file-structure docs
- extended runtime-module validation to fail if the deleted wrapper reappears
- extended version validation to include `package-lock.json`
- updated the refactor roadmap to point at the remaining `scripts/main.js` bridge instead of the deleted wrapper

## 0.5.0-hardening.55 - 2026-05-01

- aligned the app shell and runtime config version with package/docs after drift was found
- added Escape-to-close and Tab focus containment for the project delete confirmation dialog
- expanded Playwright smoke coverage for delete-dialog focus behavior and Escape close
- extended `npm run validate:html-safety` to guard delete-dialog keyboard handling

## 0.5.0-hardening.54 - 2026-05-01

- added `scripts/export/downloads.js` as the shared download helper for exported data URLs, blobs, and text files
- routed PNG, comparison, design summary, photo mode, reveal cover, and text downloads through the shared helper
- extended source-structure and export validation so download helpers load before export/3D runtime code

## 0.5.0-hardening.53 - 2026-05-01

- rebuilt the project delete confirmation modal with DOM nodes and `textContent` instead of `insertAdjacentHTML`
- added dialog metadata, outside-click close, focus restoration, and stylesheet classes for the delete confirmation
- extended `npm run validate:html-safety` to keep the delete confirmation out of string-built HTML

## 0.5.0-hardening.52 - 2026-05-01

- added global `:focus-visible` styling and z-index tokens to the app stylesheet
- removed the remaining negative letter-spacing value from the brand header
- added `npm run validate:css` to guard focus styling, z-index tokens, reduced motion, safe-area handling, and blocked CSS patterns
- added a `data-runtime-ready` boot marker so browser smoke tests wait for real event bindings

## 0.5.0-hardening.51 - 2026-05-01

- extracted catalog manifest loading and normalization into `scripts/catalog/manifest.js` so the catalog source boundary is real code, not just a checklist folder
- added `npm run validate:structure` to guard required source boundary directories, boundary files, and runtime module ordering

## 0.5.0-hardening.50 - 2026-05-01

- added `scripts/core/html.js` as the shared HTML escaping/clearing boundary for legacy browser-global rendering paths
- hardened asset/runtime diagnostic output and self-test output so dynamic values render through escaping or text nodes
- added `npm run validate:html-safety` and wired it into local tests and CI

## 0.5.0-hardening.49 - 2026-05-01

- upgraded the Verify workflow to current official action majors: `actions/checkout@v6`, `actions/setup-node@v6`, `actions/setup-python@v6`, and `actions/upload-artifact@v7`
- extended GitHub template validation to guard the Node 24 workflow opt-in and action-version pins

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
