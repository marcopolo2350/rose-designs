# Testing

## Local commands

```bash
npm run check
npm run validate:manifest
npm run test:self
npm run test:smoke
npm test
```

## What each command does

- `check` - syntax checks the main runtime files
- `validate:manifest` - verifies asset manifest entries, model files, and thumbnails
- `test:self` - launches the app locally and waits for the built-in `#selftest` flow
- `test:smoke` - runs the Playwright smoke helper against `index.html`
- `test` - runs the reproducible hardening check chain

## Current gap

The repo does not yet have a full Playwright spec suite. It currently relies on a built-in self-test path plus a scripted smoke path.
