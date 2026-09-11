# Visual production pipeline evaluation

Status: research and proposed implementation sequence, 2026-09-11. No new render, asset import, dependency installation, or visual acceptance is claimed in this evaluation.

## Findings from the current implementation

The installed renderer is Three.js 0.180.0. `src/models.ts` creates mostly BoxGeometry components with flat colors, thin roof shingles, rectangular doors and simple foliage. Its initial comment still references the older building image. `src/town.ts` supplies simple direct/hemisphere lighting, an island slab and repeated plots. It has no environment map, baked surface detail, or ambient-occlusion postprocessing. Existing shadows and ACES tone mapping are already enabled, so merely turning on shadows is not a remedy.

This is primarily an asset/art-direction gap, not evidence that Three.js cannot render the intended style. Both modeling and rendering quality must change. Rewriting GitHub data, replacing the UI framework, or changing the engine alone would not create the missing shapes and materials.

## Reading the new references

The five construction sheets define a miniature handcrafted style: rounded earth tiles, irregular stone courses, heavy timber, thick soft roof forms, arched openings, restrained blue/cream/ochre colors, tactile surfaces and carefully grouped garden props. The roof and foliage have a visibly fuzzy textile quality. Smooth bevels alone would yield a rounded toy look, not the full textile effect.

`roads.jpg` demonstrates connected blocks, intersections, planted areas and a readable city silhouette. Its smooth saturated city style differs from the house sheets. Proposed interpretation: use the house sheets for material/shape direction and the roads reference for connectivity and composition; avoid importing its unrelated landmark designs.

The supplied views are visual references rather than dimensioned orthographic production drawings. A coherent 360-degree asset will require resolving perspective and small cross-view discrepancies. No image generator or asset license has been inferred.

## Recommended workflow

1. Author one complete house and its garden in Blender. Preserve an editable source, bevels, weighted/smooth normals, roof curves, separate doors and a separate windmill rotor. Scripting can help build repeated parts, but cannot replace visual review of proportions and material quality.
2. Export a GLB for Three.js. Bake procedural surface detail to UV textures where necessary; arbitrary Blender nodes, hair and offline lighting do not automatically become equivalent browser effects.
3. Use roughness/normal maps and restrained MeshPhysicalMaterial sheen for roof fabric. Sheen changes light response; it does not create fibers. Start with textured rounded geometry, then test a small near-view fiber treatment only if required. Full-town dense strands or many shell layers are an expensive first choice.
4. Bake local crevice occlusion into each reusable asset, preserving live scene shadows for its surroundings. Test environment lighting and either Three.js GTAO or N8AO, with a lower-cost setting for mobile. Do not stack multiple AO methods at full intensity or apply color conversion/tone mapping twice.
5. Use a gentle overhead camera for the miniature presentation and a perspective close-up to expose defects. A warm key light, broad fill and subtle window emission should preserve blue/cream hues without washing the scene out. Bloom is optional and restrained; depth-of-field must not obscure the interactive town.
6. After the complete sample is visually accepted, derive the other stages from a shared footprint and material kit. Then assemble a small street before optimizing a large town.

中文提示：先验收浏览器中的一栋样板房，再扩展五阶段与街区。

## Technology and reuse shortlist

Sources below were read during this evaluation. Candidate tools/assets have not been imported. A package being reusable does not mean it visually matches the supplied design or has been tested with this project.

| Candidate | Role and fit | License / practical cost |
| --- | --- | --- |
| [Blender](https://www.blender.org/about/license/) | Recommended authoring tool for custom silhouettes, bevels, UVs and baking | GPL application, no software fee; official policy distinguishes artwork from the application license. Published bpy scripts need their own compatible licensing review. Main cost is production and iteration time. |
| [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html) | Load authored GLB assets, compressed geometry and textures | Already available in the installed MIT Three.js package. No engine migration required. |
| [MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html) | Fabric sheen and physically based surface response | Available locally; higher per-pixel cost than simpler materials. Apply selectively. |
| [N8AO](https://github.com/N8python/n8ao) | Contact/crevice depth with adjustable AO quality, including half-resolution mode | Repository labels CC0-1.0. Additional dependency and GPU cost; benchmark and pin compatible versions before adoption. |
| [postprocessing](https://github.com/pmndrs/postprocessing) | Optional bloom, anti-aliasing and color/effect pipeline | Zlib license; unnecessary if the built-in Three.js passes meet the target. Choose one coherent composer pipeline. |
| [Drei](https://github.com/pmndrs/drei) | Environment, ContactShadows, RoundedBox and model-loading helpers | MIT; designed for React Three Fiber. Current app is vanilla TypeScript. Do not migrate to React just for these helpers; it still renders with Three.js. |
| [Kenney Fantasy Town Kit](https://kenney.nl/assets/fantasy-town-kit) | 160 listed assets; candidate building/prop kit for adaptation | Page states CC0, free download. Not a verified match for the bespoke textile roof and five construction states. |
| [Kenney Nature Kit](https://kenney.nl/assets/nature-kit) | 330 listed assets; candidate trees, rocks and scenery | Page states CC0. May require reshaping and retexturing to match the houses. |
| [Quaternius Medieval Village](https://quaternius.com/packs/medievalvillage.html) | 44 listed models in FBX, OBJ and Blend; editable starting point | Page states CC0 and permits commercial projects. Needs asset inspection and GLB conversion; does not establish a ready-made five-stage house. |
| [glTF Transform](https://gltf-transform.dev/) | Deduplication, simplification, Meshopt/Draco and texture optimization after art validation | MIT tooling; extra toolchain/decoder setup. Compression reduces transfer size, not automatically draw calls or triangle count. |
| [Bruno Simon folio-2019](https://github.com/brunosimon/folio-2019) | Public interactive-world architecture reference, with source and 3D resources directories | Repository labels MIT. Not the target art style; no code/assets copied or runtime validation performed. |

Local source inspection confirmed sheen support in both MeshPhysicalMaterial and GLTFLoader's KHR_materials_sheen extension in installed r180. Current online docs can describe newer releases, so other features require version checks before use.

## Alternatives and tradeoffs

| Approach | Expected result / limitation | Assessment |
| --- | --- | --- |
| Continue simple procedural primitives | Quick stages and easy layout; weak control over the detailed handcrafted look unless the generator itself becomes a substantial art tool | Keep for roads, placement and repeated components, not as the sole final asset strategy |
| Blender-authored GLB + Three.js | Strong shape/material control, reusable modules, supports free camera and future walking | Recommended; requires actual model and texture production |
| Pre-rendered 2D sprites / PixiJS | Can closely preserve a chosen rendered view, lightweight interaction | Constrains arbitrary rotation and future first-person exploration; useful only as an explicitly different product direction |
| Babylon.js, Godot or Unity | Additional editor/game features may help other workflows | All still need high-quality assets; migration does not solve the present visual gap |
| Image-to-3D services/models | Can provide an initial shape or texture draft | Back sides, topology, material consistency and five-stage correspondence need repair; prices/licenses vary and were not verified in this research |

## Visual prototype contract and gates

The next implementation is a standalone visual lab with one stage-5 house and a neutral backdrop, not another full-town functional release. Proposed controls: orbit/zoom, front/side/top views, reference comparison, lighting/AO toggles and a performance readout. Exported PNGs are evidence from the real browser renderer, not substitutes for a working 3D scene.

Asset conventions: ground-centered origin, Y-up browser result, front toward +Z, stable footprint shared by all stages; named door/rotor/sign nodes; separate collision proxies later. Keep arbitrary project text outside baked textures. Stable plot coordinates and scores remain unchanged.

Acceptance sequence:

1. **Complete house:** compare silhouette, roof thickness/curvature, arched openings, porch/windmill, garden composition and readable wood/stone/fabric surfaces from matching angles. Inspect the back and a close-up. Require human visual review before describing the target as achieved.
2. **Five stages:** recognizable empty land, multi-course foundation, scaffold frame, blue roof shell and cream roof complete house, all aligned to the same plot. Historical scoring labels may retain compatibility aliases.
3. **Small street:** use roughly 6–12 plots to check street widths, garden boundaries, density and unobstructed signs at overview and close range.
4. **Scale:** only then test larger towns. Share meshes/textures; instance repeated vegetation; reduce distant geometry/material cost using LOD. Avoid giving every lamp a shadow-casting light.

Provisional budgets, to be revised from measured target-device results: a near-view house around 30–80k triangles, a substantially reduced distant representation, 1–2K shared texture atlases and a compressed sample download around 5 MB where feasible. Initial goals: smooth desktop interaction near 60 fps and a mobile low-quality path near 30 fps. These are engineering targets, not measured results or guarantees. Record device, resolution, visible houses, draw calls, triangles and frame-time distribution in each benchmark.

## Evaluation evidence and limitations

- Read all five new building sheets and roads.jpg, current models/town code, package version and the local material/loader implementation.
- Read the official/repository pages linked above. Google search returned a redirect-only page; Bing returned poor topical results, so conclusions rely on the directly read primary sources rather than search snippets.
- Two attempted Blender manual URLs returned 404; no exporter behavior was claimed as verified from those pages.
- Browser automation entry point failed to initialize in this evaluation. No fresh browser screenshot or GPU benchmark was obtained; current visual diagnosis uses source inspection and the reference images.
- Blender was not found on PATH or in the checked standard installation directory. This is not a complete installation inventory. Installing authoring software, obtaining an authored GLB, and verifying an export remain implementation work.
- No exact-match freely reusable five-stage asset was established. No paid service, download, package install, or remote publication occurred.
- Walking, resident maps and other feature expansion are paused by the latest instruction. Existing partial work is retained.
