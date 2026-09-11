# SPDX-License-Identifier: GPL-3.0-or-later
"""Verify the completed building was not scaled/moved by courtyard expansion."""
import bpy
import hashlib
import json
import struct
from pathlib import Path

root=Path(__file__).resolve().parents[1]
current=root/'private/art/cozy-house.blend'
previous=root/'private/art/cozy-house.blend1'
parts={'body','details','roof','dormer','chimney','porch','windmill'}

def fingerprint(obj):
    obj.data.update() if obj.type=='MESH' else None
    numbers=[v for row in obj.matrix_world for v in row]
    if obj.type=='MESH': numbers += [v for vertex in obj.data.vertices for v in vertex.co]
    elif obj.type=='CURVE':
        for spline in obj.data.splines: numbers += [v for point in spline.points for v in point.co]
    return hashlib.sha256(struct.pack('<'+'f'*len(numbers),*numbers)).hexdigest()

bpy.ops.wm.open_mainfile(filepath=str(current))
bpy.context.view_layer.update()
# Flower heights are seeded decoration; architectural meshes must be identical.
expected={o.name:fingerprint(o) for o in bpy.data.objects if o.get('part') in parts and not o.name.startswith(('Flower','Petal','Leaf'))}
assert len(expected)>100, 'Missing completed-house inventory'
bpy.ops.wm.open_mainfile(filepath=str(previous))
bpy.context.view_layer.update()
differences=[name for name,value in expected.items() if name not in bpy.data.objects or fingerprint(bpy.data.objects[name])!=value]
assert not differences, 'Changed house objects: '+str(differences)
stats=json.loads((root/'public/models/cozy-house.stats.json').read_text())
assert stats['tile']==[9.4,9.4]
assert stats['sign']['size'][0]>1.9
print(json.dumps({'unchangedHouseObjects':len(expected),'tileAreaIncreasePercent':round((9.4*9.4/(7.25*6.9)-1)*100,1),'result':'passed'}))
