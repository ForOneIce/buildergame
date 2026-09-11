# Green land-stage revision — 2026-09-11 (UTC)

Human design direction: [original instruction and translation](../prompts/0018-moss-land-stage.md). Remove the yellow soil surface, show green lichen, leave gaps in the fence, and use small saplings.

AI implementation: remove the stage-1 house clearing and open-earth overlay; retain the original green lawn, add low lichen cushions, replace continuous fences with interrupted sections and short broken rails, and replace mature crowns with two small stems, branches and leaves. The tile and sign anchor remain unchanged. Only stage-1 full-detail and distant GLBs are regenerated.

Reuse: existing original CC0 materials and modeling primitives; Blender 4.5.10 LTS. No new external art or dependency. Authoring scripts remain GPL-3.0-or-later and generated original asset derivatives CC0.

Generation: full-detail export succeeded with 59,352 triangles and 2,447,212 bytes; the distant derivative contains 7,117 triangles and 1,010,232 bytes. Both metadata files preserve the 7.25 × 6.9 tile and original sign placement. Git changes confirm the stage 2–5 assets were not regenerated.

Verification: `tests/stages-check.cjs` passed all five asset loads, metadata, localization, retry and rapid-switch checks; `tests/town-visual-check.cjs` passed snapshots, nearby detail and narrow-screen layout. Codex inspected the actual stage-1 screenshot: the yellow clearing is absent, the green surface is exposed, the fence has multiple gaps and the two leafy stems are smaller than the old trees. Production build passed with the existing shared-chunk advisory. Human acceptance of the revised artwork remains pending.
