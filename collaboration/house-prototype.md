# Complete-house visual prototype record

- Date: 2026-09-11.
- Phase: stage-5 visual sample, following the visual-first scope in [prompt 0015](../prompts/0015-house-visual-prototype.md).
- Human contribution: supplied the construction-stage reference images and instructed continuation of the proposed single-house prototype. Final appearance has not been accepted.
- AI contribution: authored a reproducible Blender scene-generation script, generated a GLB and embedded original procedural textures, built a bilingual standalone Three.js viewer, and reviewed actual browser screenshots from front/side/top/close/hero viewpoints.

## Implementation and reuse

The [authoring source](../scripts/art/build_house.py) generates rounded roof cushions, timber/plaster walls, an arched door and windows, a stone foundation, a veranda with furniture, windmill, signs, lamps, fences, trees and flower groups. The editable Blender working file is generated locally; the tracked script reconstructs the scene. Blender's scene-linear image-buffer convention was corrected after the first browser review. Later review corrected porch posts crossing the roof and unsupported windmill-platform placement.

The [viewer](../src/visual.ts), [styles](../src/visual.css) and [entry page](../visual.html) add environment lighting, contact shadows, a subtle procedural fabric bump texture, camera presets, a reference panel, daylight/evening controls, optional windmill motion, lightweight render mode and PNG export. The town demo's existing building renderer is not replaced pending human review.

Actual tool/reuse register:

| Tool or source | Version / license | Use |
| --- | --- | --- |
| [Blender](https://download.blender.org/release/Blender4.5/) | 4.5.10 LTS, GPL application | Official portable archive downloaded and verified against its published SHA-256 list; generated original assets and GLB. Portable runtime is not part of the repository. |
| [Three.js](https://github.com/mrdoob/three.js) | Existing 0.180.0, MIT | GLTFLoader, OrbitControls, RoomEnvironment, EffectComposer, GTAOPass and OutputPass from the installed package. No new runtime package installed. |
| Original generated mesh/textures | CC0-1.0 asset dedication | [Asset notes](../public/models/README.md). No external model pack imported. The reference image is not included in this dedication. |
| Authoring Python script | GPL-3.0-or-later | Script-specific SPDX declaration; does not change the application license. |
| Human reference | Stage-5 three-view PNG, provenance not supplied | Visual guide and user-openable comparison image in the sample; no image generator attribution inferred. |
| Google Fonts | DM Sans / Manrope, SIL Open Font License | Same font families used by the existing project, requested by CSS; system fallback available. |
| Codex / Playwright / Chrome | Session tools / bundled Playwright / installed Chrome | Code assistance and actual browser checks; no image-generation service used. |

## Executed verification

- Blender 4.5.10 LTS export succeeded. Final GLB: **6,369,708 bytes**, **191,960 triangles**, **40 mesh nodes** (42 exported objects including anchors). Embedded images have no external image URLs. Exact generation stats are in [cozy-house.stats.json](../public/models/cozy-house.stats.json).
- `node --test tests/*.test.mjs`: **14 tests passed** in the working tree, including previously unfinished exploration data tests. This does not claim those broader features are present in the UI.
- `node node_modules/typescript/bin/tsc --noEmit`: passed.
- `node tests/visual-check.cjs` using the configured bundled Playwright path and Chrome binary: GLB load, five camera views, reference toggle/Escape dismissal, lighting preset, lightweight quality setting, language switch, real PNG download, and 390 × 844 CSS viewport overflow checks passed. Final run reported no page/console errors and no failed HTTP responses.
- Earlier software-rendered browser pass completed functionally but was slow (~2 fps); final default-backend run identified **ANGLE / NVIDIA GeForce RTX 4060 Laptop GPU / D3D11**, with a short-window reading of **40.9 fps / 24.4 ms** at the time sampled. This is diagnostic data from a short automated desktop session, not a sustained benchmark, guarantee or physical-phone test. The software and default GPU runs must not be compared as equivalent hardware.
- `npm run build` via the installed npm CLI: passed, including TypeScript, sample-bundle validation and both HTML entry points. Vite reported a shared Three.js chunk above its 500 kB warning threshold. The GLB and stage-5 reference are included in output.
- Browser captures were visually reviewed and used to fix material brightness, roof/post intersections, framing and garden density. Captures are local QA outputs; tests do not establish aesthetic acceptance.

## Open visual work

The sample remains a stylized interpretation. Textile response approximates the reference; no dense fur-strand simulation or baked global illumination is implemented. The asset exceeds the earlier provisional near-house triangle budget; a simplified LOD and shared-instance strategy are required before using many copies in a town. Real mobile GPU behavior is untested. Remaining four appearances, street composition and paused interaction/map features await the visual review sequence.

Local development was split into an initial authored-asset commit and a subsequent viewer/refinement commit. No remote push or hosted deployment performed.
