# Testing

## Local commands

```bash
npm run check
npm run validate:manifest
npm run validate:inline-handlers
npm run validate:error-handling
npm run validate:runtime-modules
npm run validate:dependencies
npm run validate:project-schema
npm run validate:app-state
npm run validate:geometry
npm run test:playwright
npm run test:self
npm run test:smoke
npm test
```

## What each command does

- `check` - syntax checks the main runtime files
- `validate:manifest` - verifies asset manifest entries, model files, and thumbnails
- `validate:inline-handlers` - blocks inline and direct handler regressions
- `validate:error-handling` - blocks empty catch blocks
- `validate:runtime-modules` - validates the transitional runtime bridge and canonical entrypoint
- `validate:dependencies` - verifies pinned CDN runtime dependencies
- `validate:project-schema` - exercises project JSON import/export schema validation
- `validate:app-state` - exercises the central app state dispatcher bridge
- `validate:geometry` - exercises pure 2D polygon, segment, and intersection helpers
- `test:playwright` - runs the standard Playwright spec suite
- `test:self` - launches the app locally and waits for the built-in `#selftest` flow
- `test:smoke` - runs the Playwright smoke helper against `index.html`
- `test` - runs the reproducible hardening check chain

## Devtools runner note

The smoke and self-test runners both use a shared local static server helper in `scripts/devtools/static-server.mjs`. That helper binds an ephemeral port instead of a fixed port so local verification is less brittle when another server is already running.

## Current gap

The repo does not yet have a full Playwright spec suite. It currently relies on a built-in self-test path plus a scripted smoke path.
