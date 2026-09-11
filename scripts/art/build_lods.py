# SPDX-License-Identifier: GPL-3.0-or-later
"""Derive reproducible distant-view assets; never modify the source GLBs."""
import bpy
import json
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[2]
stems = ['stage-1', 'stage-2', 'stage-3', 'stage-4', 'cozy-house']
selected = int(sys.argv[sys.argv.index('--stage')+1]) if '--stage' in sys.argv else None
if selected is not None and selected not in range(1, 6): raise ValueError('Stage must be 1–5')
stats_path = root / 'public/models/lods.stats.json'
report = json.loads(stats_path.read_text()) if selected and stats_path.exists() else []
for stem in [stems[selected-1]] if selected else stems:
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
    report = [entry for entry in report if entry['file'] != target.name]
    report.append({'file': target.name, 'triangles': triangles, 'bytes': target.stat().st_size})
report.sort(key=lambda entry: stems.index(entry['file'].replace('-low.glb', '')))
stats_path.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))
