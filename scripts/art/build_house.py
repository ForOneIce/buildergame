# SPDX-License-Identifier: GPL-3.0-or-later
"""Author a rounded miniature cottage and export a real GLB for visual review."""
import bpy
import math
import random
import json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public' / 'models'
WORK = ROOT / 'private' / 'art'
OUT.mkdir(parents=True, exist_ok=True)
WORK.mkdir(parents=True, exist_ok=True)
random.seed(49)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def linear(v):
    return v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4

def rgb(code):
    return tuple(linear(int(code[i:i+2], 16) / 255) for i in (0, 2, 4))

def material(name, color, rough=.82, metallic=0, emit=0, texture=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    c = rgb(color)
    bs.inputs['Base Color'].default_value = (*c, 1)
    bs.inputs['Roughness'].default_value = rough
    bs.inputs['Metallic'].default_value = metallic
    if emit:
        bs.inputs['Emission Color'].default_value = (*c, 1)
        bs.inputs['Emission Strength'].default_value = emit
    if name.startswith('Felt'):
        bs.inputs['Sheen Weight'].default_value = .55
        bs.inputs['Sheen Roughness'].default_value = .85
        bs.inputs['Sheen Tint'].default_value = (*rgb('fff0d0'), 1)
    if texture:
        tex = m.node_tree.nodes.new('ShaderNodeTexImage')
        tex.image = texture
        m.node_tree.links.new(tex.outputs['Color'], bs.inputs['Base Color'])
    return m

def textile_image(name, code, kind):
    size = 256
    image = bpy.data.images.new(name, size, size)
    base = [int(code[i:i+2], 16) / 255 for i in (0,2,4)]
    values = []
    for y in range(size):
        for x in range(size):
            grain = random.uniform(-.065, .065)
            if kind == 'wood':
                grain += .043*math.sin(x*.53 + math.sin(y*.07)*2.8) + .023*math.sin(x*1.7+y*.012)
            elif kind == 'felt':
                grain += .025*math.sin(x*2.5+y*.7)*math.cos(y*1.3)
            else:
                grain += .025*math.sin(x*.16)*math.cos(y*.16)
            values.extend([max(0,min(1,c+grain)) for c in base] + [1])
    image.pixels = values
    image.filepath_raw = str(WORK / (name+'.png'))
    image.file_format = 'PNG'
    image.save()
    image.pack()
    return image

wood = material('Honey wood', 'b7793e', texture=textile_image('wood-grain','b7793e','wood'))
trim = material('Golden end grain', 'ce9955', texture=textile_image('warm-wood','ce9955','wood'))
dark = material('Deep timber', '704827')
plaster = material('Warm lime plaster', 'edd8ae', texture=textile_image('plaster','edd8ae','stone'))
roof = material('Felt cream', 'efd7aa', texture=textile_image('felt-cream','efd7aa','felt'))
roof_light = material('Felt highlight', 'f6e4c3', texture=textile_image('felt-light','f6e4c3','felt'))
earth = material('Ochre earth', '927047', texture=textile_image('soil','927047','stone'))
dirt = material('Garden soil', 'b59161')
grass = material('Moss lawn', '81934b', texture=textile_image('grass','81934b','felt'))
leaves = [material('Foliage '+str(i), c) for i,c in enumerate(['75823e','8d9846','a2a751','bd873a'])]
stone = [material('Stone '+str(i),c, texture=textile_image('stone-'+str(i),c,'stone')) for i,c in enumerate(['b7aa8b','c9bfa3','a69c87'])]
terracotta = material('Terracotta', 'b67747')
bronze = material('Lantern bronze', '6f5734', .56, .3)
glass = material('Warm window', 'ffe0a0', .42, emit=.5)
pink = material('Petal blush', 'd9898c')
white = material('Petal ivory', 'fff0cf')
yellow = material('Petal marigold', 'efb448')

def finish(obj, name, mat, smooth=True):
    obj.name = name
    if mat: obj.data.materials.append(mat)
    if smooth and obj.type == 'MESH':
        for p in obj.data.polygons: p.use_smooth = True
    return obj

def cube(name, loc, scale, mat, bevel=.06, segments=3):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o=bpy.context.object
    o.dimensions=scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod=o.modifiers.new('Soft handcrafted edges','BEVEL')
        mod.width=bevel; mod.segments=segments
        bpy.ops.object.modifier_apply(modifier=mod.name)
        mod=o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return finish(o,name,mat)

def sphere(name, loc, scale, mat, segments=12, rings=8):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, radius=1, location=loc)
    o=bpy.context.object; o.scale=scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(o,name,mat)

def beam(name, a, b, radius, mat, square=False):
    v=Vector(b)-Vector(a)
    if square:
        o=cube(name, (Vector(a)+Vector(b))/2, (radius*2,radius*2,v.length),mat,radius*.3)
    else:
        bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=radius, depth=v.length, location=(Vector(a)+Vector(b))/2)
        o=finish(bpy.context.object,name,mat)
        mod=o.modifiers.new('Rounded beam ends','BEVEL'); mod.width=radius*.24; mod.segments=2
        bpy.ops.object.modifier_apply(modifier=mod.name)
    o.rotation_euler=v.to_track_quat('Z','Y').to_euler()
    return o

def curve(name, points, radius, mat, cyclic=False):
    data=bpy.data.curves.new(name,'CURVE'); data.dimensions='3D'; data.resolution_u=12
    data.bevel_depth=radius; data.bevel_resolution=3
    s=data.splines.new('POLY'); s.points.add(len(points)-1)
    for p, co in zip(s.points, points): p.co=(*co,1)
    s.use_cyclic_u=cyclic
    o=bpy.data.objects.new(name,data); bpy.context.collection.objects.link(o); data.materials.append(mat)
    return o

def arch(name, x, y, bottom, width, height, mat, depth=.09):
    r=width/2; shoulder=bottom+height-r
    outline=[(x-r,bottom),(x+r,bottom),(x+r,shoulder)]
    outline += [(x+r*math.cos(i*math.pi/20),shoulder+r*math.sin(i*math.pi/20)) for i in range(1,21)]
    n=len(outline)
    verts=[(px,y+off,pz) for off in (-depth/2,depth/2) for px,pz in outline]
    faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh=bpy.data.meshes.new(name); mesh.from_pydata(verts,[],faces); mesh.update()
    o=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(o); finish(o,name,mat,False)
    mod=o.modifiers.new('Soft arch edge','BEVEL'); mod.width=.035; mod.segments=3
    bpy.context.view_layer.objects.active=o; o.select_set(True)
    bpy.ops.object.modifier_apply(modifier=mod.name)
    o.select_set(False)
    return o

def arch_frame(name,x,y,bottom,width,height,mat,radius=.085):
    r=width/2; shoulder=bottom+height-r
    points=[(x-r,y,bottom),(x-r,y,shoulder)]
    points += [(x+r*math.cos(math.pi-i*math.pi/24),y,shoulder+r*math.sin(math.pi-i*math.pi/24)) for i in range(25)]
    points += [(x+r,y,bottom)]
    return curve(name,points,radius,mat)

def flower(x,y,z= .35,color=None,scale=1):
    color=color or random.choice([pink,white,yellow])
    h=random.uniform(.19,.36)*scale
    beam('Flower stem',(x,y,z),(x+.015,y,z+h),.016*scale,leaves[0])
    sphere('Leaf',(x+.07*scale,y,z+h*.4),(.11*scale,.04*scale,.035*scale),leaves[1])
    for i in range(5):
        a=i*math.tau/5
        sphere('Petal',(x+math.cos(a)*.065*scale,y+math.sin(a)*.065*scale,z+h),(.065*scale,.054*scale,.035*scale),color,8,6)
    sphere('Flower center',(x,y,z+h+.026*scale),(.035*scale,)*3,yellow,8,6)

def planter(x,y,z,width=.65):
    cube('Planter box',(x,y,z),(width,.34,.28),wood,.04)
    cube('Planter soil',(x,y,z+.145),(width-.06,.28,.025),earth,.015)
    for dx in [-width*.31,0,width*.31]:
        flower(x+dx,y,z+.16,pink,.75)

def lantern(x,y,z,standing=False):
    if standing:
        beam('Lantern post',(x,y,.25),(x,y,z-.13),.065,dark)
        cube('Lamp footing',(x,y,.38),(.24,.24,.22),wood,.04)
    cube('Lantern light',(x,y,z),(.22,.22,.31),glass,.055)
    for dx in [-.13,.13]:
        for dy in [-.13,.13]: beam('Lantern cage',(x+dx,y+dy,z-.17),(x+dx*.8,y+dy*.8,z+.17),.018,bronze)
    cube('Lantern base',(x,y,z-.2),(.32,.32,.08),bronze,.025)
    bpy.ops.mesh.primitive_cone_add(vertices=8,radius1=.25,radius2=.06,depth=.2,location=(x,y,z+.27))
    finish(bpy.context.object,'Lantern cap',bronze)
    sphere('Lantern finial',(x,y,z+.4),(.045,.045,.06),bronze)

def tree(x,y,h,autumn=False):
    beam('Tree trunk',(x,y,.3),(x,y,h*.8),.105,wood)
    for tier in range(3):
        z=.55+h*.28+tier*h*.2
        radius=h*(.22-tier*.025)
        for j in range(5):
            a=j*math.tau/5+tier
            sphere('Soft tree crown',(x+math.cos(a)*radius*.35,y+math.sin(a)*radius*.35,z),(radius*.72,radius*.7,h*.21),leaves[3] if autumn else leaves[tier%3],12,8)
    sphere('Tree tip',(x,y,h+.22),(h*.11,h*.11,h*.21),leaves[3] if autumn else leaves[1])

# Thin, rounded soil tile and scalloped planted border.
cube('Earth tile',(0,0,0),(7.25,6.9,.35),earth,.23,5)
cube('Soft lawn',(0,0,.18),(7.18,6.83,.22),grass,.22,5)
cube('House clearing',(-.6,.3,.3),(4,3.85,.09),dirt,.22)
for i in range(100):
    side=i%4; t=random.uniform(-3.1,3.1)
    x,y=((t,-3.22) if side==0 else (t,3.22) if side==1 else (-3.4,t) if side==2 else (3.4,t))
    if y < -3 and -.9<x<.2: continue
    sphere('Moss edge',(x,y,.31),(random.uniform(.17,.32),random.uniform(.16,.28),.13),random.choice(leaves[:3]),10,6)

# Multi-course foundation and honey-colored structural timber.
for row in range(2):
    for i in range(7):
        for y in [-1.28,1.95]:
            cube('Foundation stone',(-2.14+i*.46,y,.39+row*.19),(.44,.34,.21),stone[(i+row)%3],.055)
    for i in range(6):
        for x in [-2.25,.94]:
            cube('Foundation stone',(x,-.96+i*.52,.39+row*.19),(.32,.5,.21),stone[(i+row)%3],.05)
cube('Plaster house',(-.65,.33,1.98),(3.12,3.16,2.74),plaster,.10)
for x in [-2.19,.9]:
    for y in [-1.25,1.91]:
        cube('Main timber post',(x,y,1.98),(.23,.24,2.88),wood,.075)
for z in [.73,3.18]:
    cube('Front lintel',(-.65,-1.32,z),(3.38,.2,.22),trim,.065)
    cube('Rear lintel',(-.65,1.99,z),(3.38,.2,.22),wood,.065)
    cube('Side lintel',(.98,.33,z),(.18,3.27,.21),wood,.05)

# Gable triangles have real depth, not billboards.
for y in [-1.3,1.96]:
    mesh=bpy.data.meshes.new('Gable')
    mesh.from_pydata([(-2.2,y,3.17),(.91,y,3.17),(-.65,y,4.9)],[],[(0,1,2)])
    mesh.update(); o=bpy.data.objects.new('Plaster gable',mesh); bpy.context.collection.objects.link(o); finish(o,'Plaster gable',plaster,False)
    mod=o.modifiers.new('Solid gable','SOLIDIFY'); mod.thickness=.14
    bpy.context.view_layer.objects.active=o; bpy.ops.object.modifier_apply(modifier=mod.name)
    for side in [-1,1]: beam('Gable fascia',(-.65+side*1.68,y-.03,3.18),(-.65,y-.03,4.99),.12,trim,True)

# Front door, individually grooved boards, and round attic window.
door=arch('Door',-1.25,-1.466,.67,.89,1.82,dark,.12)
arch_frame('Door surround',-1.25,-1.51,.67,1.05,1.98,terracotta,.145)
for i in range(7):
    dx=(i-3)*.115; top=2.01+math.sqrt(max(0,.445**2-dx**2))
    cube('Door plank',(-1.25+dx,-1.54,(top+.72)/2),(.106,.065,top-.72),trim if i%3 else wood,.026)
sphere('Door knob',(-1.5,-1.63,1.39),(.063,.055,.063),yellow)
for z in [.82,1.81]: cube('Door hinge',(-.92,-1.59,z),(.18,.034,.055),bronze,.015)
lantern(-.56,-1.61,2.1)
beam('Lamp bracket',(-.56,-1.32,2.53),(-.56,-1.65,2.53),.035,bronze)

def front_window(x,y,z,width=.69,height=1.09):
    arch('Window glow',x,y,z,width,height,glass,.06)
    arch_frame('Arched window frame',x,y-.065,z,width+.06,height+.04,trim,.065)
    cube('Window sill',(x,y-.12,z),(width+.25,.22,.12),trim,.045)
    cube('Window mullion',(x,y-.075,z+height*.47),(.055,.07,height*.91),wood,.012)
    cube('Window crossbar',(x,y-.083,z+height*.49),(width,.065,.055),wood,.015)

front_window(.18,-1.45,1.25,.66,1.12)
planter(.18,-1.59,1.11,.85)
for y in [-1.43,2.08]:
    sphere('Round attic glass',(-.65,y,3.86),(.39,.045,.43),glass,24,12)
    curve('Round attic rim',[(-.65+.44*math.cos(i*math.tau/48),y-.06,3.86+.47*math.sin(i*math.tau/48)) for i in range(48)],.055,trim,True)
    cube('Attic mullion',(-.65,y-.075,3.86),(.055,.06,.84),wood,.015)
    cube('Attic crossbar',(-.65,y-.075,3.86),(.8,.06,.055),wood,.015)
front_window(-1.3,2.05,1.35,.8,1.05)

# Quilted roof: broad, overlapping cushions follow a gently bowed roof profile.
for side in [-1,1]:
    for row in range(5):
        t=(row+.42)/5
        x=-.65+side*t*1.99
        z=5.04-1.72*t+.12*math.sin(math.pi*t)
        angle=side*math.atan((1.72-.12*math.pi*math.cos(math.pi*t))/1.99)
        for col in range(7):
            y=-1.60+col*.60
            pillow=cube('Felt roof cushion',(x,y,z+.025*math.cos(col*1.7+row)),(.70,.73,.30),roof_light if (row+col)%5==0 else roof,.145,5)
            pillow.rotation_euler.y=angle
    # Continuous curled eave hides the tile undersides.
    curve('Thick felt eave',[(-.65+side*1.92,-1.82+i*.12,3.38+.035*math.sin(i*.5)) for i in range(36)],.18,roof)
for i in range(8):
    cube('Soft ridge cap',(-.65,-1.7+i*.55,5.12),(.44,.68,.33),roof_light,.16,5)

# Front dormer on the right slope.
cube('Dormer body',(.43,-.54,4.2),(.72,.77,.75),plaster,.06)
front_window(.43,-.966,3.91,.48,.72)
for side in [-1,1]:
    o=cube('Dormer felt roof',(.43+side*.25,-.56,4.78),(.70,1.06,.23),roof_light,.11,4)
    o.rotation_euler.y=side*.52

# Tall stone chimney, with a visible dark opening.
cube('Chimney shaft',(-1.43,1.14,4.7),(.56,.55,1.35),terracotta,.065)
for row in range(4):
    cube('Chimney course',(-1.43,1.14,4.2+row*.29),(.61,.60,.07),wood,.025)
cube('Chimney crown',(-1.43,1.14,5.38),(.76,.75,.2),terracotta,.07)
cube('Chimney dark opening',(-1.43,1.14,5.491),(.46,.44,.025),dark,.06)

# Side veranda with planks, posts, lean-to roof, chairs and a table.
for i in range(11):
    cube('Porch plank',(1.89,-1.14+i*.27,.51),(1.88,.25,.15),trim if i%3 else wood,.038)
for y in [-1.1,.25,1.56]:
    beam('Porch column',(2.68,y,.58),(2.68,y,2.92),.085,wood)
    beam('Porch angled brace',(2.68,y,2.35),(2.34,y,2.96),.055,trim)
for i in range(7):
    for row in range(3):
        o=cube('Veranda felt', (1.16+row*.60,-1.32+i*.49,3.18-row*.18),(.85,.64,.23),roof,.11,4)
        o.rotation_euler.y=.3
cube('Porch front trim',(1.91,-1.42,2.99),(2.12,.15,.19),trim,.05)
for y in [-.62,.92]:
    cube('Side window frame',(1.0,y,1.91),(.12,.82,1.06),wood,.10)
    cube('Side window light',(1.075,y,1.91),(.06,.65,.88),glass,.10)
    cube('Side window mullion',(1.12,y,1.91),(.05,.045,.91),trim,.012)
    cube('Side window bar',(1.12,y,1.91),(.05,.68,.045),trim,.012)

def chair(x,y,angle=0):
    before=set(bpy.data.objects)
    cube('Chair seat',(0,0,.94),(.48,.48,.11),trim,.04)
    for dx in [-.18,.18]:
        for dy in [-.18,.18]: beam('Chair leg',(dx,dy,.57),(dx,dy,.92),.035,wood)
    for dx in [-.19,.19]: beam('Chair back post',(dx,.19,.85),(dx,.19,1.53),.037,wood)
    for z in [1.22,1.43]: cube('Chair back',(0,.19,z),(.47,.08,.15),trim,.04)
    new=set(bpy.data.objects)-before
    for o in new:
        # All chair elements were created around the same local origin.
        p=o.location.copy(); o.location=(x+p.x*math.cos(angle)-p.y*math.sin(angle),y+p.x*math.sin(angle)+p.y*math.cos(angle),p.z)
        o.rotation_euler.z+=angle
chair(1.72,.94)
chair(2.35,.35,math.pi/2)
beam('Table pedestal',(1.85,.31,.54),(1.85,.31,1.07),.07,wood)
cube('Tea table',(1.85,.31,1.10),(.53,.52,.08),trim,.07)
sphere('Tea cup',(1.82,.31,1.2),(.07,.07,.085),white)
lantern(2.65,-1.1,2.61)
planter(2.65,1.45,.87,.55)

# Windmill tower is an independent sculptural landmark.
for x in [2.06,2.64]:
    for y in [1.05,1.64]:
        beam('Windmill tower',(x,y,.63),(2.35+(x-2.35)*.4,1.35+(y-1.35)*.4,4.48),.065,wood)
for z in [1.5,2.5,3.4,4.16]:
    for y in [1.11,1.59]: beam('Tower rung',(2.12,y,z),(2.58,y,z),.047,trim)
cube('Windmill platform',(2.35,1.35,3.33),(.82,.87,.15),trim,.06)
rotor=bpy.data.objects.new('WindmillRotor',None); bpy.context.collection.objects.link(rotor); rotor.location=(2.35,1.0,4.40)
bpy.context.view_layer.update()
for i in range(8):
    a=i*math.tau/8
    r=.69
    o=cube('Windmill blade',(2.35+math.sin(a)*r,.98,4.40+math.cos(a)*r),(.20,.12,.73),roof_light if i%2 else trim,.065,3)
    o.rotation_euler.y=a
    o.parent=rotor; o.matrix_parent_inverse=rotor.matrix_world.inverted()
    o=beam('Windmill spoke',(2.35,1.0,4.40),(2.35+math.sin(a)*.65,1.0,4.40+math.cos(a)*.65),.035,wood)
    o.parent=rotor; o.matrix_parent_inverse=rotor.matrix_world.inverted()
o=sphere('Windmill hub',(2.35,.89,4.40),(.18,.12,.18),terracotta)
o.parent=rotor; o.matrix_parent_inverse=rotor.matrix_world.inverted()

# Front garden: irregular stepping stones, fences, bench, mailbox and sign.
for i in range(6):
    x=-1.13+.30*math.sin(i*.6)
    o=sphere('Stepping stone',(x,-1.70-i*.27,.32+i*.008),(.32,.22,.095),stone[i%3],12,6)
    o.rotation_euler.z=i*.6
for i in range(3):
    cube('Door step',(-1.24,-1.42-i*.16,.60-i*.105),(1.04+i*.14,.34,.14),stone[1],.07)
for x in [-3.13,3.13]:
    for y in [-2.5,-1.1,.3,1.7,2.75]:
        cube('Fence post',(x,y,.75),(.14,.16,.94),trim,.045)
    for z in [.64,.98]:
        beam('Fence rail',(x,-2.55,z),(x,2.79,z),.055,wood,True)
for x in [1.0,1.75,2.5,3.13]: cube('Front fence post',(x,-2.78,.73),(.15,.15,.91),trim,.04)
for z in [.61,.96]: beam('Front fence rail',(.95,-2.78,z),(3.17,-2.78,z),.052,wood,True)
for y in [2.8]:
    for x in [-2.9,-1.5,0,1.5,2.9]: cube('Back fence post',(x,y,.77),(.14,.14,.94),trim,.04)
    for z in [.65,1.02]: beam('Back fence rail',(-3.12,y,z),(3.12,y,z),.05,wood,True)

cube('Garden bench seat',(1.05,-2.13,.76),(.91,.41,.13),trim,.05)
for x in [.72,1.38]:
    beam('Bench leg',(x,-2.13,.29),(x,-2.13,.79),.05,wood)
    beam('Bench back post',(x,-1.94,.69),(x,-1.94,1.28),.05,wood)
for z in [1.02,1.21]: cube('Bench back',(1.05,-1.94,z),(.95,.08,.15),trim,.045)
beam('Mailbox post',(.08,-2.60,.3),(.08,-2.60,1.05),.06,wood)
cube('Mailbox',(.08,-2.60,1.13),(.36,.44,.27),terracotta,.10)
cube('Mailbox slot',(.08,-2.83,1.15),(.19,.018,.04),dark,.01)
lantern(-2.57,-1.73,1.25,True)
lantern(.21,-1.87,.93,True)
for x in [-2.81,-1.78]: beam('Sign post',(x,-2.47,.25),(x,-2.47,1.45),.065,wood)
for z in [1.01,1.28]: cube('Sign board',(-2.3,-2.47,z),(1.30,.14,.25),trim,.07)
# Browser canvas label is mounted on this named anchor, not burned into the model.
anchor=bpy.data.objects.new('SignAnchor',None); bpy.context.collection.objects.link(anchor); anchor.location=(-2.3,-2.56,1.16)

tree(-2.7,1.91,2.9,True)
tree(-2.98,.61,2.1)
tree(2.98,2.15,2.47)
for i in range(52):
    x=random.uniform(-3.15,3.12); y=random.uniform(-3.0,2.98)
    if -2.55<x<2.85 and -1.7<y<2.18: continue
    if -1.6<x<-.55 and y< -1.5: continue
    flower(x,y,.32,scale=random.uniform(.8,1.35))
for x,y in [(-2.7,-.95),(-2.82,2.76),(2.94,-.43),(-2.4,-2.98),(.82,2.62)]:
    sphere('Garden rock',(x,y,.4),(.25,.18,.18),random.choice(stone))
    for j in range(3):
        sphere('Low shrub',(x+.19*math.cos(j*2),y+.19*math.sin(j*2),.40),(.19,.16,.18),leaves[j])

# Save a fully editable source before material batching for browser efficiency.
bpy.ops.wm.save_as_mainfile(filepath=str(WORK/'cozy-house.blend'))
source_objects=len(bpy.data.objects)
for obj in list(bpy.data.objects):
    if obj.type == 'CURVE':
        bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True); bpy.context.view_layer.objects.active=obj
        bpy.ops.object.convert(target='MESH')
groups={}
for obj in list(bpy.data.objects):
    if obj.type!='MESH' or obj.parent==rotor or obj.name=='Door': continue
    key=obj.data.materials[0].name if obj.data.materials else 'none'
    groups.setdefault(key,[]).append(obj)
for name,objects in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects: obj.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.object.join(); bpy.context.object.name='Surface_'+name

bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(OUT/'cozy-house.glb'), export_format='GLB', export_apply=True, export_yup=True, export_materials='EXPORT', export_extras=True)
triangles=0
for obj in bpy.data.objects:
    if obj.type=='MESH':
        obj.data.calc_loop_triangles(); triangles+=len(obj.data.loop_triangles)
stats={'generator':'Blender '+bpy.app.version_string,'sourceObjects':source_objects,'exportObjects':len(bpy.data.objects),'triangles':triangles,'bytes':(OUT/'cozy-house.glb').stat().st_size,'status':'visual prototype; not approved final art'}
(OUT/'cozy-house.stats.json').write_text(json.dumps(stats,indent=2)+'\n')
print('BUILDERGAME_ASSET '+json.dumps(stats))
