# Complete-house asset source

This directory contains the reproducible Blender authoring script for the stage-5 visual prototype. The script creates an original interpretation of the human-supplied construction reference, not an imported marketplace model.

Run with Blender 4.5 LTS from the repository root:

```powershell
blender --background --factory-startup --python scripts/art/build_house.py
```

Outputs: `public/models/cozy-house.glb` (web asset), `private/art/cozy-house.blend` (editable local source), and `public/models/cozy-house.stats.json` (generation inventory). The source script is the tracked reproducible authoring source. The generated Blender working file and portable authoring tools remain local.

Coordinates in the authoring script use Blender Z-up and front toward -Y. GLB export converts to the browser's Y-up / +Z-front convention. Doors and the windmill rotor are named separately; other objects are batched by material at export. 中文注释：门与风车保留独立节点，便于后续交互。

The Python authoring script is licensed GPL-3.0-or-later to accommodate Blender's Python API policy. That script license does not relicense the rest of the application. The original generated mesh and texture assets are made available under CC0-1.0. No human reference-image ownership or license is asserted here. See `public/models/README.md` for asset scope and limitations.
