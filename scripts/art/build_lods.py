# SPDX-License-Identifier: GPL-3.0-or-later
"""Derive reproducible distant-view assets; never modify the source GLBs."""
import bpy
import json
from pathlib import Path

root = Path(__file__).resolve().parents[2]
report = []
for stem in ['stage-1', 'stage-2', 'stage-3', 'stage-4', 'cozy-house']:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(root / 'public/models' / (stem + '.glb')))
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    for obj in meshes:
        bpy.context.view_layer.objects.active = obj
        modifier = obj.modifiers.new('Distant silhouette', 'DECIMATE')
        modifier.ratio = 0.12
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    target = root / 'public/models' / (stem + '-low.glb')
    bpy.ops.export_scene.gltf(filepath=str(target), export_format='GLB', export_yup=True)
    triangles = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in meshes)
    report.append({'file': target.name, 'triangles': triangles, 'bytes': target.stat().st_size})
(root / 'public/models/lods.stats.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))
