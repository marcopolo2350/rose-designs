# Testing

## Local commands

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
npm run validate:inline-handlers
npm run validate:error-handling
npm run validate:runtime-modules
npm run validate:dependencies
npm run validate:project-schema
npm run validate:app-state
npm run validate:geometry
npm run validate:3d-lifecycle
npm run validate:export-filenames
npm run test:playwright
npm run test:self
npm run test:smoke
npm test
```

## What each command does

- `check` - syntax checks the main runtime files
- `validate:manifest` - verifies asset manifest entries, model files, and thumbnails
- `validate:asset-sizes` - verifies GLB files stay below the per-model size ceiling
- `validate:asset-sources` - verifies every catalog entry maps to `data/asset-sources.json`
- `validate:static-a11y` - checks static app-shell button names, button types, dialogs, and decorative SVG hiding
- `validate:dev-mode` - checks debug/model/diagnostic surfaces stay behind `.dev-only`
- `validate:github-templates` - checks issue/PR templates keep hardening scope and verification prompts current
- `validate:docs` - checks README, testing docs, hardening status, and PR verification commands for drift
- `validate:structure` - checks required source boundary directories, boundary files, and runtime ordering
- `validate:css` - checks focus styling, z-index tokens, reduced motion, safe-area handling, and blocked CSS patterns
- `validate:html-safety` - checks shared HTML escaping and high-risk diagnostic/self-test rendering paths
- `validate:storage-keys` - checks app storage calls use the storage-key registry instead of raw key literals
- `validate:inline-handlers` - blocks inline and direct handler regressions
- `validate:error-handling` - blocks empty catch blocks
- `validate:runtime-modules` - validates the transitional runtime bridge and canonical entrypoint
- `validate:dependencies` - verifies pinned CDN runtime dependencies
- `validate:project-schema` - exercises project JSON import/export schema validation
- `validate:app-state` - exercises the central app state dispatcher bridge
- `validate:geometry` - exercises pure 2D polygon, segment, and intersection helpers
- `validate:3d-lifecycle` - exercises 3D disposal helpers for scene, renderer, listeners, and composer cleanup
- `validate:export-filenames` - exercises export filename sanitizing
- `test:playwright` - runs the standard Playwright spec suite
- `test:self` - launches the app locally and waits for the built-in `#selftest` flow
- `test:smoke` - runs the Playwright smoke helper against `index.html`
- `test` - runs syntax, lint, format, validation commands, and the built-in self-test

## Devtools runner note

The smoke and self-test runners both use a shared local static server helper in `scripts/devtools/static-server.mjs`. That helper binds an ephemeral port instead of a fixed port so local verification is less brittle when another server is already running.

## Current gap

The repo does not yet have a full Playwright spec suite. It currently relies on a built-in self-test path plus a scripted smoke path.
