# Refactor Roadmap

This roadmap turns the current repo critique into an execution order that improves maintainability without freezing the app for weeks.

## Goals

1. reduce surprise coupling
2. make local workflows obvious
3. make the repo honest about stability
4. create a safe path from browser globals toward real modules

## Phase 1 - Repo Honesty and Workflow Cleanup

Status: in progress

Scope:

- make [index.html](../index.html) the primary shell
- keep the old entry URL only as a compatibility redirect
- add basic package scripts
- document stable vs fragile areas in the README
- document this roadmap in the repo

Exit criteria:

- local contributors have one obvious entrypoint
- `npm run dev`, `npm run check`, and `npm run thumbs` exist
- README no longer reads like a product brochure

## Phase 2 - Runtime Boundary Cleanup

Status: next

Scope:

- replace sequential classic script injection in [app.js](../scripts/app.js) with real ES module imports
- identify hard dependencies between `state`, `storage`, `ui`, `planner2d`, `catalog`, `export`, `planner3d`, and `walkthrough`
- remove accidental load-order dependence where possible

Target outcome:

- app boot is explicit instead of order-magical
- missing dependencies fail at import time instead of random runtime points

## Phase 3 - State and History Extraction

Status: planned

Scope:

- move undo/redo out of 3D-specific files
- create a clearer central app state shape
- introduce explicit update helpers or action-style mutations for high-risk changes
- reduce direct mutation of broad globals from multiple subsystems

Target outcome:

- room edits, selection, viewport state, and 3D state become easier to reason about
- multi-room bugs stop requiring cross-file guesswork

## Phase 4 - UI Event Cleanup

Status: planned

Scope:

- reduce inline `onclick` handlers in the main shell
- centralize event binding for repeated UI surfaces
- separate user-facing controls from diagnostic and dev-only controls

Target outcome:

- HTML becomes easier to scan
- refactors stop depending on global function names

## Phase 5 - Tooling and CI

Status: planned

Scope:

- formalize smoke checks
- add a GitHub Actions workflow for syntax and smoke verification
- expose thumbnail generation and self-test flows cleanly

Target outcome:

- pushes are checked by the repo, not just by memory

## Phase 6 - Save Format Hardening

Status: planned

Scope:

- introduce explicit schema versioning for saved rooms and projects
- document migration expectations
- validate imported project JSON more aggressively

Target outcome:

- saved projects become safer to evolve over time

## Phase 7 - Dependency Strategy

Status: planned

Scope:

- reduce runtime CDN dependence where practical
- evaluate bundling with Vite or another static-friendly build step
- decide which libraries remain external and which should be bundled

Target outcome:

- the app becomes more deterministic and more portable

## Guardrails

- no large refactor without a smoke verification step
- no new major feature surface until Phase 2 and Phase 3 are meaningfully underway
- keep compatibility redirects only where they preserve existing shared links
- prefer extraction over rewrite when the behavior is already working

## Immediate Next Steps

1. convert `app.js` away from ordered classic-script loading
2. identify the smallest safe history/state extraction slice
3. add a basic CI workflow once local smoke commands are stable
