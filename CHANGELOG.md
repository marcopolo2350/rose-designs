# Changelog

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
