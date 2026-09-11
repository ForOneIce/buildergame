# Town visual integration — 2026-09-11 (UTC)

Human input: continue the approved visual direction after the five-stage studio iteration. Prior courtyard and stage requirements remain the design source.

AI work: specify main-town integration; derive five distant-view GLBs using Blender 4.5.10 LTS and a 0.12 decimation ratio. Original high-detail assets remain unchanged. The derivative assets contain 7,055 / 9,985 / 12,750 / 14,940 / 21,458 triangles, respectively.

Reuse: Three.js 0.180.0 (MIT), Blender 4.5.10 LTS (GPL); existing project-authored CC0 model assets. New `build_lods.py` uses GPL-3.0-or-later, matching the existing Blender authoring scripts. Generated derivatives remain CC0.

Implementation: `src/town.ts`, `src/town-assets.ts` and `src/town.css` replace the primitive island with connected streets and five instanced appearances. Full detail is limited to six nearby buildings. Project signs, camera focus, directory access and fixed snapshot positions remain available. Ray-only click boxes stay outside the render scene so AO does not treat them as opaque buildings.

Verification: production build passed (shared Three.js chunk-size advisory remains); all 14 working-tree Node tests passed. `tests/browser-check.cjs` passed existing setup, mocked capture, backup, reload, dialog and bilingual/mobile journeys. `tests/town-visual-check.cjs` passed main-town snapshots, close-up detail loading and narrow-screen layout. `tests/town-scale-check.cjs` passed 12/50/200-project rendering, sign-versus-building actions, drag suppression, latest-snapshot loading, deliberate 503 retry, unknown-state display and disposal during requests. Actual desktop screenshots were inspected and an AO interaction-proxy occlusion bug was corrected.

Performance observation: a short 2.2-second requestAnimationFrame window in headless Chrome with its default desktop GPU backend measured approximately 60 frames/second at 12, 50 and 200 projects (1440 × 1000). At 200, renderer counters reported about 5.30 million submitted triangles and 675 calls including passes. This is not a mobile, low-end-device or sustained performance guarantee. Distant meshes are simplified; full-detail assets load on approach. Walking/interiors and geographic maps remain deferred. Human acceptance of the integrated composition remains pending.

Scope: [prompt](../prompts/0017-town-visual-integration.md), [specification](../specs/0009-town-visual-integration.md). No human review of this new integration is claimed.
