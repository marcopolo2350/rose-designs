# Dependency Policy

The app is still GitHub Pages compatible and currently loads several browser runtime libraries from pinned CDN URLs in `index.html`.

## Current npm Dependencies

- Runtime dependencies: none
- Development dependencies: ESLint, Prettier, and Playwright

## Current Runtime CDNs

- Three.js `0.147.0` plus matching example loaders, shaders, postprocessing passes, and `Reflector`
- jsPDF `2.5.1`
- pdf.js `3.11.174`

## Rules

- CDN URLs must stay version pinned.
- Three.js core and example paths must use the same version.
- New CDN dependencies require a short note in this file and must pass `npm run validate:dependencies`.
- Removed feature packages such as `dxf-writer` must not return unless that feature is intentionally restored and documented.
- Bundling these dependencies through npm/Vite is still the preferred long-term direction, but it is deferred until the runtime-global bridge is safer to replace.

## Verification

```bash
npm run validate:dependencies
```
