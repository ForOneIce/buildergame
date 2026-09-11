# Town visual integration — 2026-09-11 (UTC)

Human input: continue the approved visual direction after the five-stage studio iteration. Prior courtyard and stage requirements remain the design source.

AI work: specify main-town integration; derive five distant-view GLBs using Blender 4.5.10 LTS and a 0.12 decimation ratio. Original high-detail assets remain unchanged. The derivative assets contain 7,055 / 9,985 / 12,750 / 14,940 / 21,458 triangles, respectively.

Reuse: Three.js 0.180.0 (MIT), Blender 4.5.10 LTS (GPL); existing project-authored CC0 model assets. New `build_lods.py` uses GPL-3.0-or-later, matching the existing Blender authoring scripts. Generated derivatives remain CC0.

Verification so far: Blender generated all five assets and `lods.stats.json`. Visual acceptance of the integrated town and browser performance are pending.

Scope: [prompt](../prompts/0017-town-visual-integration.md), [specification](../specs/0009-town-visual-integration.md). No human review of this new integration is claimed.
