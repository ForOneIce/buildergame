# Visual references and procedural interpretation

## Current visual priority

An initial stage-5 sample is now available at `/visual.html` when running the project. It loads the generated Blender GLB and provides orbit/zoom, five camera presets, reference comparison and lighting controls. See the [prototype record](../collaboration/house-prototype.md) for actual checks, measured limits and open art work. The existing town renderer still uses the earlier model pending review.

Five additional construction sheets (`建筑状态1` through `建筑状态5`) and `roads.jpg` now define the visual target. The original procedural demo described below has not met that target. See [visual pipeline evaluation](../specs/0007-visual-pipeline.md) for the gap analysis, researched tools/assets and proposed complete-house prototype. Feature expansion is paused until the visual sample is reviewed.

The new building sheets guide shape, surface and garden detail; the roads image guides block connectivity. No new asset has been generated or imported as part of the evaluation.

## Earlier demo interpretation

The human supplied six reference images for the welcome screen, town map and building stages. Their image-generation tool and exact prompts have not been supplied; no tool/model attribution is inferred.

The Demo uses an original procedural interpretation in [src/models.ts](../src/models.ts) and [src/town.ts](../src/town.ts), rather than displaying the map image as a simulated interactive scene.

| Reference feature | Demo implementation |
| --- | --- |
| Blue-roof timber houses | Merged shingle geometry, beams, plaster walls and glowing windows |
| Construction stages | Land, stone foundation, timber frame, cottage, townhouse and garden decorations |
| Floating island | Low-poly cliff skirt, grassy plots, paths, dock and surrounding water |
| Builder signs | Canvas textures with an avatar or initials and project/builder labels |
| Layered map interface | HTML town panels, project list, camera controls and recorded timeline |

Currency, tasks, inventory, leaderboard and character progression appearing in references are not implemented product requirements. Final art fidelity, broader device performance and asset licensing/provenance review remain part of further iteration.
