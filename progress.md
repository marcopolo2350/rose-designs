Original prompt: Fix and verify the live room designer correctness issues, especially colors, asset orientation, closet duplication, and rebuild stability.

- 2026-03-19: Starting live verification loop for remaining broken behavior.

- Installed Playwright locally and copied the testing client into the workspace so the browser loop can run from local node_modules.

- Reproduced the color mismatch in a real browser: 2D respected wall/floor changes, while 3D checker flooring and subtle custom wall colors read too weakly. Patched 3D wall emissive response and strengthened checker rendering for custom colors.

- Verified in Playwright over http://127.0.0.1:8000: created room, changed wall/floor finishes and colors, entered 3D, and saved/reopened. Room materials persisted; checker flooring needed stronger 3D treatment and was patched. Wall colors do reach 3D; softer swatches remain visually subtle under warm lighting.

- Added 3D teardown cleanup: clear pending rebuild timer, dispose scene graph materials/textures/geometries, force renderer context loss, and null listener references. Also made self-test wait longer after re-entering 3D post-reload before checking mapped models.


- 2026-04-06: Added an existing-room redesign layer in the editor: furniture can now be marked as existing vs new, tagged keep/move/replace/remove, locked, ghosted, hidden when removed, and duplicated into redesign copies. Starting visual/browser verification next.

- 2026-04-06: Browser verification complete. Preview room renders with existing/new furniture tags in 2D; targeted Playwright check passed for keep/move/replace/remove tagging, hide-removed behavior, locking, and redesign-copy creation. 3D ghosting works but still reads less clearly than the 2D planning view.

- 2026-04-06: Added plan view toggles (As-Is / Redesign / Combined), an on-canvas legend for the existing-room tags, and a side-by-side before/after PNG export sheet. Verified in Playwright that the plan views render different furniture sets and that the comparison sheet exports as a PNG data URL.

- 2026-04-06: Full QA pass completed. Built-in self-test passed, broader Playwright verification passed for colors, plan views, existing-room workflow, 3D entry, exports, persistence, and model loading. Added package.json type=module to remove Node ESM warnings for the local Playwright helper.

- 2026-04-06: Added explicit replacement pairing (existing piece <-> redesign piece) plus named room options linked under a shared base room. Focused Playwright check passed for auto-pairing, manual pairing, stale-link cleanup on source change, option creation, renaming, and switching.

- 2026-04-06: Added 3D compare cycling, option thumbnail previews on home cards, per-option notes, and a design summary export sheet. Follow-up Playwright verification passed for thumbnail generation, note persistence, option cloning, summary export, and the full `Combined -> As-Is -> Redesign -> Combined` 3D compare flow with no console errors.

- 2026-04-06: Upgraded PDF export into a multi-page client presentation. The PDF now bundles a cover/overview, per-option As-Is/Redesign/Combined plan pages with notes, and option comparison pages. Browser verification confirmed the export saved successfully as a 4-page PDF for a two-option room with no console errors.

- 2026-04-06: Tightened visual rendering after a regression report about furniture disappearing against light finishes. Strengthened 2D furniture contrast with darker type-aware default tints, clearer strokes, drop shadows, and readable label pills; increased 2D floor-pattern contrast across wood/tile/checker/concrete; and boosted 3D floor texture/accent visibility. Focused Playwright verification passed for wall/floor changes, existing/redesign plan modes, thumbnail generation, comparison export, 3D entry, and console cleanliness.

- 2026-04-06: Pushed floor drama further on request. 2D floor patterns now render with stronger plank seams, grout, checker contrast, and concrete variation; 3D wood floors now show richer plank separation and more visible grain/highlight structure. Visual screenshot checks confirmed the finishes read much more strongly in both plan and 3D views.

- 2026-04-06: Final release-readiness audit completed across the source-bearing files (`index.html`, `package.json`, `web_game_playwright_client.js`, `progress.md`). Fixed one real project-management bug: duplicating a room card could keep the original `baseRoomId`, so copies could stay linked into the original option group. Duplicates are now detached into a fresh standalone project (`baseRoomId = new id`, `optionName = Main`). Added a `.gitignore` for local dependencies, temp browser profiles, screenshots, and debug artifacts. Final Playwright verification passed for self-test, undo/redo (`Ctrl+Y` included), PDF export, mood/preset chips, duplicate detachment, redesign compare flow, and console cleanliness.

- 2026-04-06: Mobile UX pass for iPhone feedback. Added per-device profile selection (`Rose` vs `Marco`) with profile-scoped saves/preferences, expanded the tutorial into a real guided walkthrough, changed the mobile panel into a compact peek sheet by default, auto-collapsed the panel during furniture placement on small touch screens, fixed adjacent-room growth to create a reliable connector segment and door, and replaced the old mobile walk controls with separate move/turn buttons plus a sideways/landscape-friendly dock. Focused iPhone-sized Playwright verification passed for profile chooser visibility, room creation, Add North Room, compact panel state, 3D walk control rendering, and console cleanliness.
- 2026-04-06: In-place productization pass landed without a framework rewrite. Split the runtime into static modules (`app.js` bootstrap + `state/storage/ui/planner2d/catalog/export/planner3d/walkthrough`) while keeping the app local-first and GitHub Pages-safe. Switched the bootstrap to a module loader that pulls the chunk files in sequence so the original global planner behavior survives the split cleanly.
- 2026-04-06: Upgraded the catalog to feel more productized. `data/asset-manifest.json` is now the source of truth for category grouping and collection metadata, the picker now uses premium card placeholders instead of emoji tiles, and it supports cleaner categories, collection filters, favorites, recents, and stronger search matching.
- 2026-04-06: Added local walkthrough presets in 3D (`Dollhouse`, `Stroll`, `Corner Reveal`, `Before / After Flythrough`, `Romantic Reveal`) plus double-click focus wiring and smoother orbit/pinch tuning. Consolidated browser validation passed for CSS/module bootstrap loading, manifest loading, catalog filter rendering, walkthrough preset rendering/function, and console cleanliness.

- 2026-04-06: Generated real catalog thumbnails into assets/thumbnails via a local Edge/Three.js render stage (scripts/thumbgen.html + scripts/generate-thumbnails.mjs). Updated the asset manifest so every current catalog item has a valid thumbnailPath, corrected ookshelf into the Storage taxonomy, and verified desktop/mobile picker runs load thumbnail media with 200 responses and no console errors.

- 2026-04-06: Added manifest-driven material variants for the highest-impact catalog groups: sofas, beds, chairs, tables, storage pieces, rugs, and lamps. Variants now flow through picker search, placement preview, mobile `Place Here`, selected-item details, copy/paste persistence, and 3D material application with family-aware fabric/wood/metal/rug behavior. Focused Playwright validation passed for desktop/mobile variant selection, placement, persistence, search by variant term, and console cleanliness.

## 2026-04-06 - Reference overlay import + tracing
- Added local image reference overlay import in 2D with move, opacity, scale, lock, and calibration controls.
- Persisted overlay state per room via normalizeRoom/IndexedDB save flow.
- Browser validation passed for import, drag, calibration, persistence, free-draw tracing, and mobile panel visibility; no console errors in the validation runs.

- 2026-04-06: Rough-edge UX cleanup pass. Replaced the browser `prompt(...)` calibration step with an in-app bottom sheet that validates measured distance inline and supports Enter/Escape. Tightened room-panel wording (`Lighting Mood`, `Design Direction`, clearer project/floor copy), added live tracing guidance in the reference section, and auto-collapsed the mobile panel into a dedicated tracing mode while calibration is active. Validation passed with no console errors on desktop and phone-sized runs; desktop fully exercised the new calibration sheet and mobile confirmed the tracing-state panel behavior.
- 2026-04-06: Presentation / reveal polish pass. Added a cleaner Reveal Mode tray with hero/favorite/whole-room/intimate/before-after shots, strengthened hero framing defaults, improved walkthrough/photo tray copy, upgraded comparison/export language to feel more presentation-ready, and refreshed option-panel labels around Before / After, story summary, and presentation deck actions. Desktop and phone-sized browser validation passed for reveal tray rendering, photo mode, walkthrough moves, and clean console output.

- 2026-04-19: Finish pass on the reported rough edges. Simplified the live 3D toolbar down to labeled `Orbit / Walk / Overview / Room / Corner`, removed the top-level Present/Photo/Tour buttons, changed 3D entry to land on `Room` instead of an outside dollhouse angle, silenced the stale first-time 3D popup plus other low-value placement/status toasts, made room reordering rerender immediately, and added polygon offset protection to trim/baseboard/window/door trim materials to reduce 3D z-fighting. Browser verification on `http://127.0.0.1:8123/` confirmed: adjacent-room add creates a second room, move order swaps correctly, top-level 3D buttons are reduced and labeled, no random toast was visible during the test flow, wall-mounted art computes flush to the wall face with inward normal, trim materials all report `polygonOffset: true`, and no console/page errors were emitted.
