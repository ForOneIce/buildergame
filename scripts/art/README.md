# Five-stage building asset source

This directory contains the reproducible Blender authoring script for the stage-5 visual prototype. The script creates an original interpretation of the human-supplied construction reference, not an imported marketplace model.

Run with Blender 4.5 LTS from the repository root:

```powershell
blender --background --factory-startup --python scripts/art/build_house.py
```

The default is stage 5. To generate another appearance, append `-- --stage 1` (or 2, 3, 4). Each run writes the corresponding `stage-N.glb`, `stage-N.stats.json` and local `stage-N.blend`. `stage_details.py` supplies stage derivation and the shared garden layout; it executes inside the main script's authoring namespace. Stage 5 keeps the compatible `cozy-house` filename.

The final tile measures 9.4 × 9.4 units; stages 1–4 use 7.25 × 6.9. Flat and valley towns use 16-unit logical plot spacing; cloud districts use the deterministic transforms in `src/landscape.mjs`. Sign placement and face dimensions are in each statistics JSON, so the viewer does not duplicate layout constants.

The accepted five appearances and their distant derivatives are locked in `public/models/buildings.lock.json`. The commands below document reproducible authoring; visual iterations on roads, terrain and UI must keep these GLBs unchanged.

Stage 1 uses a green lichen lawn, incomplete fence sections and two small leafy saplings. It has no yellow clearing overlay. Stages 2–5 retain their construction surfaces and mature planting.

Generate distant-view derivatives with `blender --background --factory-startup --python scripts/art/build_lods.py`. Append `-- --stage 1` to update only one stage and its statistics. The full-detail source assets are never modified by decimation.

Outputs: `public/models/cozy-house.glb` (web asset), `private/art/cozy-house.blend` (editable local source), and `public/models/cozy-house.stats.json` (generation inventory). The source script is the tracked reproducible authoring source. The generated Blender working file and portable authoring tools remain local.

Coordinates in the authoring script use Blender Z-up and front toward -Y. GLB export converts to the browser's Y-up / +Z-front convention. Doors and the windmill rotor are named separately; other objects are batched by material at export. 中文注释：门与风车保留独立节点，便于后续交互。

The Python authoring script is licensed GPL-3.0-or-later to accommodate Blender's Python API policy. That script license does not relicense the rest of the application. The original generated mesh and texture assets are made available under CC0-1.0. No human reference-image ownership or license is asserted here. See `public/models/README.md` for asset scope and limitations.
