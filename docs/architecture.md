# Architecture

## Runtime today

The app boots through [scripts/main.js](../scripts/main.js), which is an ES module entrypoint that loads the existing browser-global runtime files in a fixed order. This is a compatibility bridge, not the final architecture.

## Major runtime layers

- `scripts/core/` - shared configuration, validation, error boundaries
- `scripts/core/app-state.js` - first central state surface for room/editor/runtime metadata
- `scripts/core/history.js` - shared room history and undo/redo behavior
- `scripts/state.js` - geometry helpers, storage keys, and app preferences
- `scripts/storage.js` - IndexedDB access, normalization, runtime persistence glue
- `scripts/ui.js` - home/editor shell behavior
- `scripts/ui/shortcuts.js` - keyboard bindings and shortcut-sheet rendering
- `scripts/planner2d.js` - 2D room editing and drawing
- `scripts/planner3d.js` - 3D scene and camera behavior
- `scripts/catalog.js` - catalog UI and furniture controls
- `scripts/export.js` - PNG, SVG, PDF, and project JSON export
- `scripts/cloud/` - cloud sync boundary
- `scripts/devtools/` - validation and verification scripts

## Honest status

The repo is only partly modular. The next structural step is moving runtime ownership from browser-global files toward explicit imports, controllers, and app-state boundaries. `app-state.js` and `history.js` are the first extraction step, not the end state.

## UI event wiring status

The shell is in migration from inline HTML handlers to delegated `data-action` bindings. `scripts/ui.js` now owns a central `handleUiAction()` dispatcher plus `bindStaticUiActions()`, and boot calls that binding once up front. This reduces direct HTML-to-global coupling for the home shell, editor header, setup modal, time-of-day controls, and major 3D buttons, but it is still a transitional layer rather than a finished component system.
