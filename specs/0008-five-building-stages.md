# Five building appearances and expanded courtyard

The human accepted the complete-house visual direction and requested a roomier final-stage courtyard with a larger visitor sign, followed by the other four appearances.

Implementation scope:

- Keep the completed house, roof, veranda and windmill geometry and placement unchanged. Enlarge the last tile from 7.25 × 6.9 to 9.4 × 9.4 model units (about 77% more ground area). Move perimeter fencing, trees and visitor furnishings outward. Preserve a clear entrance path and an unobstructed sign face.
- Enlarge the final sign from 1.30 × 0.52 to 2.15 × 1.00 units. Provide an editable browser label with project title, builder name and short description; no invented repository metrics.
- Produce empty land, stone foundation, timber/scaffold frame, blue-roof shell and cream-roof complete assets from one authoring source. Stages 1–4 retain the smaller land tile. The building origin/footprint stays fixed, so a later town layout must reserve space for the largest final tile instead of relocating projects on growth.
- Add bilingual stage selection to the existing visual studio. Load the selected GLB on demand, dispose replaced GPU resources, guard rapid async switches, and show the matching design reference. Keep camera distance stable across stage switches to make size changes visible; camera presets remain available.
- Preserve current scoring and snapshot schemas. This is an art/studio change; the main town renderer and paused walking/map functionality are not in scope.

Acceptance: inspect every stage in the browser; verify final house geometry invariance, larger tile/sign dimensions, reference and language switching, rapid stage switches, failure/retry handling, camera/PNG controls, mobile overflow, and production asset inclusion. Save incremental local commits and actual verification evidence. Asset fidelity and large-town/mobile GPU performance must not be described as fully accepted without review.
