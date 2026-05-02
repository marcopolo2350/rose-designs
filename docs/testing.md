# Testing

## Local commands

```bash
npm run check
npm run lint
npm run format
npm run validate:version
npm run validate:manifest
npm run validate:asset-sizes
npm run validate:asset-sources
npm run validate:static-a11y
npm run validate:text-encoding
npm run validate:dev-mode
npm run validate:github-templates
npm run validate:workflow
npm run validate:package
npm run validate:docs
npm run validate:structure
npm run validate:global-bridge
npm run validate:css
npm run validate:html-safety
npm run validate:storage-keys
npm run validate:inline-handlers
npm run validate:error-handling
npm run validate:runtime-modules
npm run validate:dependencies
npm run validate:cloud-boundary
npm run validate:clean-ignore
npm run validate:project-schema
npm run validate:app-state
npm run validate:geometry
npm run validate:placement-rules
npm run validate:3d-lifecycle
npm run validate:3d-lighting
npm run validate:3d-camera
npm run validate:export-filenames
npm run test:playwright
npm run test:self
npm run test:smoke
npm test
```

## What each command does

- `check` - syntax checks maintained scripts, tests, and tool-config files
- `validate:version` - checks package, app shell, runtime config, changelog, and hardening status versions stay aligned
- `validate:manifest` - verifies asset manifest entries, mounted placement metadata, model files, and thumbnails
- `validate:asset-sizes` - verifies GLB files stay below the per-model size ceiling
- `validate:asset-sources` - verifies every catalog entry maps to `data/asset-sources.json`
- `validate:static-a11y` - checks static app-shell button names, button types, dialogs, and decorative SVG hiding
- `validate:text-encoding` - checks runtime files for mojibake, phase-history comments, and question-mark catalog icon fallbacks
- `validate:dev-mode` - checks debug/model/diagnostic surfaces stay behind `.dev-only`
- `validate:github-templates` - checks issue/PR templates keep hardening scope and verification prompts current
- `validate:workflow` - checks the GitHub Verify workflow mirrors local guardrails and current action majors
- `validate:package` - checks required package metadata, npm scripts, Node version guidance, and workflow alignment
- `validate:docs` - checks README, testing docs, hardening status, and PR verification commands for drift
- `validate:structure` - checks required source boundary directories, boundary files, and runtime ordering
- `validate:global-bridge` - checks the transitional browser-global compatibility surface has not expanded silently
- `validate:css` - checks focus styling, z-index tokens, reduced motion, safe-area handling, and blocked CSS patterns
- `validate:html-safety` - checks shared HTML escaping and high-risk diagnostic/self-test rendering paths
- `validate:storage-keys` - checks app storage calls use the storage-key registry instead of raw key literals
- `validate:inline-handlers` - blocks inline and direct handler regressions
- `validate:error-handling` - blocks empty catch blocks
- `validate:runtime-modules` - validates the transitional runtime bridge and canonical entrypoint
- `validate:dependencies` - verifies pinned CDN runtime dependencies
- `validate:cloud-boundary` - verifies experimental cloud sync stays isolated, documented, validated, and warning-labeled
- `validate:clean-ignore` - checks generated local artifacts cleaned by `npm run clean` stay ignored
- `validate:project-schema` - exercises project JSON import/export schema validation
- `validate:app-state` - exercises the central app state dispatcher bridge
- `validate:geometry` - exercises pure 2D polygon, segment, and intersection helpers
- `validate:placement-rules` - exercises manifest-backed wall, ceiling, surface, and floor placement defaults
- `validate:3d-lifecycle` - exercises 3D disposal helpers for scene, renderer, listeners, and composer cleanup
- `validate:3d-lighting` - exercises time-of-day HDRI buckets, sky colors, exposure limits, and light intensity curves
- `validate:3d-camera` - exercises 3D camera labels, favorite-corner framing, overhead, and multi-room overview poses
- `validate:export-filenames` - exercises export filename sanitizing, centralized download helpers, and extracted PDF/PNG/SVG/print/JSON export boundaries
- `test:playwright` - runs the standard Playwright spec suite
- `test:self` - launches the app locally and waits for the built-in `#selftest` flow
- `test:smoke` - runs the Playwright smoke helper against `index.html`
- `test` - runs syntax, lint, format, validation commands, and the built-in self-test

## Devtools runner note

The smoke and self-test runners both use a shared local static server helper in `scripts/devtools/static-server.mjs`. That helper binds an ephemeral port instead of a fixed port so local verification is less brittle when another server is already running.

## Current gap

The repo does not yet have a full Playwright spec suite. It currently relies on a built-in self-test path plus a scripted smoke path.
