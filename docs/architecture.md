# Architecture

## Runtime today

The app boots through [scripts/main.js](../scripts/main.js), which is an ES module entrypoint that loads the existing browser-global runtime files in a fixed order. This is a compatibility bridge, not the final architecture.

## Major runtime layers

- `scripts/core/` - shared configuration, validation, error boundaries
- `scripts/state.js` - geometry helpers, storage keys, history helpers, app preferences
- `scripts/storage.js` - IndexedDB access, normalization, runtime persistence glue
- `scripts/ui.js` - home/editor shell behavior
- `scripts/planner2d.js` - 2D room editing and drawing
- `scripts/planner3d.js` - 3D scene and camera behavior
- `scripts/catalog.js` - catalog UI and furniture controls
- `scripts/export.js` - PNG, SVG, PDF, and project JSON export
- `scripts/cloud/` - cloud sync boundary
- `scripts/devtools/` - validation and verification scripts

## Honest status

The repo is only partly modular. The next structural step is moving runtime ownership from browser-global files toward explicit imports, controllers, and app-state boundaries.
