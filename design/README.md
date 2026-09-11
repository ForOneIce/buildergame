# Visual references and procedural interpretation

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
