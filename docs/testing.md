# Testing

## Local commands

```bash
npm run check
npm run validate:manifest
npm run test:playwright
npm run test:self
npm run test:smoke
npm test
```

## What each command does

- `check` - syntax checks the main runtime files
- `validate:manifest` - verifies asset manifest entries, model files, and thumbnails
- `test:playwright` - runs the standard Playwright spec suite
- `test:self` - launches the app locally and waits for the built-in `#selftest` flow
- `test:smoke` - runs the Playwright smoke helper against `index.html`
- `test` - runs the reproducible hardening check chain

## Devtools runner note

The smoke and self-test runners both use a shared local static server helper in `scripts/devtools/static-server.mjs`. That helper binds an ephemeral port instead of a fixed port so local verification is less brittle when another server is already running.

## Current gap

The repo does not yet have a full Playwright spec suite. It currently relies on a built-in self-test path plus a scripted smoke path.
