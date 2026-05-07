# Architecture

## Runtime today

The app boots through [scripts/main.js](../scripts/main.js), which is an ES module entrypoint that loads the existing browser-global runtime files in a fixed order. This is a compatibility bridge, not the final architecture.

The bridge appends the canonical `application-version` meta value to runtime script URLs so pushed hardening builds do not accidentally reuse stale browser-cached modules.

## Major runtime layers

- `scripts/core/` - shared configuration, validation, error boundaries
- `scripts/core/storage-keys.js` - localStorage and IndexedDB key registry
- `scripts/core/storage-service.js` - IndexedDB open/read/write boundary
- `scripts/core/app-state.js` - first central state surface for room/editor/runtime metadata
- `scripts/core/history.js` - shared room history and undo/redo behavior
- `scripts/catalog/placement-rules.js` - manifest-backed default placement/elevation rules
- `scripts/state.js` - geometry helpers, storage keys, and app preferences
- `scripts/storage.js` - normalization, runtime persistence glue, and compatibility wrappers
- `scripts/ui.js` - home/editor shell behavior
- `scripts/ui/shortcuts.js` - keyboard bindings and shortcut-sheet rendering
- `scripts/planner2d.js` - 2D room editing and drawing
- `scripts/planner2d/furniture-style.js` - 2D furniture tint/stroke/label style helpers
- `scripts/planner2d/reference-overlay.js` - reference overlay geometry and label helpers
- `scripts/planner2d/snapping.js` - wall-mounted furniture snapping helpers
- `scripts/planner3d.js` - 3D scene assembly and walkthrough glue
- `scripts/planner3d/lighting.js` - data-driven time-of-day lighting curves and HDRI buckets
- `scripts/planner3d/camera.js` - data-driven 3D camera labels and pose math
- `scripts/planner3d/materials.js` - furniture finish/material helper boundary
- `scripts/planner3d/model-loader.js` - GLTF loader/cache/error-status boundary
- `scripts/planner3d/placement.js` - furniture placement and wall/surface snapping helper boundary
- `scripts/planner3d/room-shell.js` - room shell shape, bounds, and floor geometry helper boundary
- `scripts/planner3d/textures.js` - procedural floor texture and planar UV helper boundary
- `scripts/planner3d/walls.js` - wall segment geometry, door leaf, window trim, and orbit cutaway helper boundary
- `scripts/catalog.js` - catalog UI and furniture controls
- `scripts/export/pdf.js` - PDF and presentation export boundary
- `scripts/export/png.js` - PNG, comparison-sheet, and design-summary export boundary
- `scripts/export/print.js` - print floor-plan export boundary
- `scripts/export/svg.js` - SVG floor-plan export boundary
- `scripts/cloud/` - cloud sync boundary
- `scripts/devtools/` - validation and verification scripts
- `styles/app.css` - ordered stylesheet manifest
- `styles/*.css` - split styling surfaces for base tokens, home, editor, planner, panels, devtools, mobile, modals, catalog, and overlays

## Honest status

The repo is only partly modular. The next structural step is moving runtime ownership from browser-global files toward explicit imports, controllers, and app-state boundaries. `app-state.js` and `history.js` are the first extraction step, not the end state.

The existing browser-global compatibility surface is now guarded by `npm run validate:global-bridge`. New `window.*` assignments should be treated as an architectural decision, not a convenience.

## UI event wiring status

The shell is in migration from inline HTML handlers to delegated `data-action` bindings. `scripts/ui.js` now owns a central `handleUiAction()` dispatcher plus `bindStaticUiActions()`, and boot calls that binding once up front. This reduces direct HTML-to-global coupling for the home shell, editor header, setup modal, time-of-day controls, and major 3D buttons, but it is still a transitional layer rather than a finished component system.
