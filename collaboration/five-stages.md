# Expanded courtyard and five-stage art record

- Date: 2026-09-11.
- Human contribution: accepted the complete-house visual direction and requested a larger final courtyard, outward perimeter fence, larger visitor sign, and the remaining four appearances. [Original instruction](../prompts/0016-five-building-stages.md).
- AI contribution: parameterized the Blender authoring pipeline, derived five assets, rebuilt the garden perimeter, added a larger editable label, and implemented bilingual stage selection with replacement-resource disposal, stale-load guards and retry handling. [Scope](../specs/0008-five-building-stages.md).

## Result and measurements

The final tile grew from 7.25 × 6.9 to 9.4 × 9.4 units: **76.6% more area**. The architecture retains its original coordinates and scale. The final sign board is 2.15 × 1.00 units, with a 1.99 × 0.82 editable face. Its sample content contains project title, builder name and a short description, with no invented repository statistics. A dedicated sign camera makes it easy to inspect.

| Appearance | File | Triangles | GLB bytes |
| --- | --- | ---: | ---: |
| Land | stage-1.glb | 58,856 | 2,417,432 |
| Foundation | stage-2.glb | 83,012 | 3,030,384 |
| Frame | stage-3.glb | 106,056 | 3,751,976 |
| Blue-roof shell | stage-4.glb | 124,612 | 4,429,240 |
| Complete garden | cozy-house.glb | 178,528 | 5,966,320 |

Stages 1–4 use the smaller tile. Camera scale remains stable across stage changes. A later town integration must reserve the largest tile envelope without moving project plots; this change does not modify scoring, snapshot data or the existing town renderer.

## Executed checks

- Blender 4.5.10 LTS generated every GLB and editable local source. One batch run encountered a native Blender crash before completing stage 4; an isolated stage-4 retry exported successfully. No corrupt/missing export is reported as complete.
- `tests/art-invariants.py`, run with Blender against the local before/after working files: **262 architectural and attached furnishing objects** had identical geometry/transform fingerprints. Randomized flower details are explicitly excluded. This was a one-time comparison against the pre-expansion `.blend1` backup, not a portable regression fixture.
- TypeScript checking passed. The multi-entry production build passed, validated the sample town and included all five model/metadata pairs and reference PNGs. The existing shared Three.js chunk still triggers Vite's 500 kB advisory.
- `tests/visual-check.cjs`: existing camera/light/quality/language/PNG/mobile-overflow checks passed for the expanded final courtyard, with no failed responses or browser errors.
- `tests/stages-check.cjs`: all five actual GLBs loaded; tile/sign measurements, matching references, translated stage copy, delayed-load ordering, deliberate 503 failure/retry, sign close-up and mobile stage selection/overflow checks passed. The deliberately failed response was distinguished from unexpected errors.
- Actual browser screenshots of all stages and the large sign were inspected. This establishes rendered output and successful controls, not automatic acceptance of the revised art.

## Reuse and remaining work

No new dependency or external model pack was added. This reuses Blender 4.5.10 LTS and Three.js 0.180.0 under the tool/license scopes documented in [the first prototype record](house-prototype.md). `stage_details.py` and the Blender comparison utility carry GPL-3.0-or-later SPDX headers; generated assets retain their CC0 dedication. All five human reference images remain separate from that dedication; their generation provenance is unknown.

The human accepted the preceding visual style; the enlarged courtyard and newly derived stages have not yet received final visual review. Dense-town LOD, physical-mobile GPU testing, town integration, walking and resident maps remain outside this art iteration. No remote push or hosted deployment performed.
