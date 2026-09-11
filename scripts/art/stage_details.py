# SPDX-License-Identifier: GPL-3.0-or-later
"""Executed by build_house.py in its authoring namespace; no standalone entry."""

# Derive appearances from one invariant completed-house structure.
keep = {
    1: {'land'},
    2: {'land','foundation'},
    3: {'land','foundation'},
    4: {'land','foundation','body','details','roof','dormer','chimney'},
    5: {'land','foundation','body','details','roof','dormer','chimney','porch','windmill'},
}[STAGE]
for obj in list(bpy.data.objects):
    if obj.get('part') not in keep:
        bpy.data.objects.remove(obj,do_unlink=True)

PART='construction'
if STAGE==1:
    # 空地保留绿色地衣，不覆盖黄色施工清理面。
    bpy.data.objects.remove(bpy.data.objects['House clearing'],do_unlink=True)
    for i in range(60):
        sphere('Lichen cushion',(random.uniform(-2.7,2.3),random.uniform(-1.9,2.15),.29),
               (random.uniform(.08,.22),random.uniform(.08,.19),random.uniform(.015,.04)),leaves[i%3],10,6)
    for i in range(9):
        sphere('Small meadow pebble',(random.uniform(-2.7,2.3),random.uniform(-1.9,2.15),.31),(.045,.035,.025),stone[i%3],8,5)

if STAGE in (2,3):
    # The existing foundation is raised into three clear stone courses.
    for row in range(3):
        for i in range(6):
            for y in [-1.28,1.95]:
                cube('Raised foundation',(-1.99+i*.53,y,.70+row*.22),(.50,.38,.23),stone[(i+row)%3],.055)
        for i in range(5):
            for x in [-2.25,.94]:
                cube('Raised side foundation',(x,-.90+i*.56,.70+row*.22),(.38,.53,.23),stone[(i+row)%3],.055)
    for x in [-2.15,.83]:
        for y in [-1.15,1.82]:
            beam('Corner upright',(x,y,.55),(x,y,1.77 if STAGE==2 else 3.28),.115,wood,True)
    for i in range(3):
        cube('Work entry step',(-1.2,-1.65-i*.22,.81-i*.16),(1.20+i*.12,.35,.17),trim,.055)
    # Crate, stacked logs and spare stones outside the structure.
    cube('Supply crate',(1.85,.5,.57),(.65,.65,.49),wood,.045)
    cube('Crate contents',(1.85,.5,.84),(.55,.54,.04),earth,.015)
    for i in range(5): sphere('Crate stone',(1.72+(i%2)*.24,.33+(i//2)*.15,.86),(.12,.11,.1),stone[i%3])
    for i in range(4):
        beam('Stacked log',(1.5+(i%2)*.24,1.15,.44+(i//2)*.21),(1.5+(i%2)*.24,2.15,.44+(i//2)*.21),.12,wood)
    for i in range(4): cube('Spare stone',(-2.80,.1+i*.28,.39),(.35,.26,.2),stone[i%3],.045)

if STAGE==3:
    for y in [-1.23,.32,1.91]:
        beam('Roof tie',(-2.2,y,3.20),(.9,y,3.20),.11,trim,True)
        for side in [-1,1]:
            beam('Exposed rafter',(-.65+side*1.68,y,3.18),(-.65,y,4.99),.12,wood,True)
    beam('Exposed ridge',(-.65,-1.44,4.99),(-.65,2.08,4.99),.12,trim,True)
    for x in [-2.2,.9]: beam('Wall plate',(x,-1.30,3.22),(x,1.97,3.22),.12,wood,True)
    for row in range(3):
        for i in range(5-row):
            cube('Partial side wall',(.93,-.75+i*.52,1.36+row*.28),(.34,.50,.27),stone[(row+i)%3],.045)
    arch_frame('Unfinished door arch',-1.25,-1.48,.69,1.08,2.0,terracotta,.145)
    # External scaffold, brace ropes and boards.
    for x in [-2.65,1.37]:
        for y in [-1.45,.25,2.08]:
            beam('Scaffold pole',(x,y,.33),(x,y,3.40),.065,wood)
        for z in [1.50,2.82]:
            beam('Scaffold rail',(x,-1.6,z),(x,2.22,z),.055,trim)
            for y in [-1.45,.25,2.08]:
                for offset in [-.055,0,.055]:
                    curve('Rope joint',[(x+.08*math.cos(a*math.tau/12),y+.08*math.sin(a*math.tau/12),z+offset) for a in range(12)],.016,roof,True)
    for y in [-.9,-.55,-.2,.15,.5,.85,1.2,1.55,1.9]:
        cube('Scaffold plank',(1.25,y,2.76),(.65,.32,.065),trim,.025)
    beam('Scaffold brace',(1.37,-1.4,.6),(1.37,2.05,2.78),.045,wood)
    for x in [1.3,1.75]: beam('Ladder side',(x,-2.15,.32),(x,-1.55,2.8),.042,trim)
    for i in range(8):
        t=i/7
        beam('Ladder rung',(1.28,-2.15+.6*t,.40+2.33*t),(1.78,-2.15+.6*t,.40+2.33*t),.035,wood)
    blueprint=material('Blueprint blue','456e92')
    cube('Blueprint stand',(2.35,-1.60,.98),(.87,.10,.67),blueprint,.03)
    for x in [1.89,2.81]: beam('Blueprint frame',(x,-1.66,.60),(x,-1.66,1.36),.035,trim)
    for z in [.61,1.35]: beam('Blueprint frame',(1.9,-1.66,z),(2.8,-1.66,z),.035,trim)
    for x in [2.10,2.62]: beam('Blueprint drawing',(x,-1.663,.78),(x,-1.663,1.08),.009,white)
    curve('Blueprint roof',[(2.05,-1.663,1.07),(2.36,-1.663,1.25),(2.67,-1.663,1.07)],.01,white)

if STAGE==4:
    blue=material('Felt blue','6288ba',texture=textile_image('felt-blue','6288ba','felt'))
    blue_light=material('Felt blue highlight','7599c9',texture=textile_image('felt-blue-light','7599c9','felt'))
    for obj in bpy.data.objects:
        if obj.type=='MESH' or obj.type=='CURVE':
            for slot in obj.material_slots:
                if slot.material==roof: slot.material=blue
                elif slot.material==roof_light: slot.material=blue_light
    # Side windows previously belonged to the complete-stage veranda collection.
    for y in [-.62,.92]:
        cube('Shell side frame',(1.0,y,1.91),(.12,.82,1.06),wood,.10)
        cube('Shell side light',(1.075,y,1.91),(.06,.65,.88),glass,.10)
        cube('Shell mullion',(1.12,y,1.91),(.05,.045,.91),trim,.012)
        cube('Shell crossbar',(1.12,y,1.91),(.05,.68,.045),trim,.012)

PART='garden'
fx,fy=WIDTH/2-.50,DEPTH/2-.55
if STAGE>=4:
    for i in range(9 if STAGE==5 else 6):
        t=i/(8 if STAGE==5 else 5)
        x=-1.13+.18*math.sin(t*math.pi*2)
        sphere('Stepping stone',(x,-1.80-t*(fy-1.60),.36),(.30,.21,.085),stone[i%3],12,6)
    for i in range(3): cube('Door step',(-1.24,-1.42-i*.16,.60-i*.105),(1.04+i*.14,.34,.14),stone[1],.07)

# Perimeter rails stay outside the visitor area, with a broad front entrance.
for x in [-fx,fx]:
    for i in range(7):
        y=-fy+i*fy/3
        cube('Fence post',(x,y,.75),(.14,.16,.94),trim,.045)
    for z in [.64,.98]: beam('Fence rail',(x,-fy,z),(x,fy,z),.055,wood,True)
for i in range(7): cube('Back fence post',(-fx+i*fx/3,fy,.75),(.14,.16,.94),trim,.045)
for z in [.64,.98]: beam('Back fence rail',(-fx,fy,z),(fx,fy,z),.055,wood,True)
if STAGE==1:
    # Replace complete rails with separate remnants and visible open gaps.
    for obj in list(bpy.data.objects):
        if obj.name.startswith(('Fence post','Fence rail','Back fence')):
            bpy.data.objects.remove(obj,do_unlink=True)
    for side,segments in [(-1,[(-fy,-fy+.95),(.35,1.40)]),(1,[(-.55,.50),(fy-.70,fy)])]:
        x=side*fx
        for index,(a,b) in enumerate(segments):
            for y in [a,b]:
                post=cube('Weathered fence post',(x,y,.61),(.13,.14,.66),wood,.035)
                post.rotation_euler.y=side*.07
            beam('Remaining fence rail',(x,a,.66),(x,b,.71),.05,trim,True)
            if index==0:
                beam('Short broken rail',(x,a,.88),(x,a+(b-a)*.55,.83),.045,wood,True)
    for x in [-fx,-fx+1.15,.65,fx]:
        cube('Back fence remnant',(x,fy,.61),(.13,.14,.66),wood,.035)
    beam('Back rail remnant',(-fx,fy,.70),(-fx+1.15,fy,.66),.05,trim,True)
    beam('Back rail remnant',(.65,fy,.66),(1.50,fy,.61),.045,wood,True)
    beam('Leaning broken rail',(fx,1.48,.31),(fx,2.12,.58),.045,wood,True)
if STAGE==5:
    for x in [.45,1.7,2.95,fx]: cube('Front fence post',(x,-fy,.73),(.15,.15,.91),trim,.04)
    for z in [.61,.96]: beam('Front fence rail',(.45,-fy,z),(fx,-fy,z),.052,wood,True)
    cube('Garden bench seat',(2.45,-2.75,.76),(1.12,.44,.13),trim,.05)
    for x in [2.03,2.87]:
        beam('Bench leg',(x,-2.75,.29),(x,-2.75,.79),.05,wood)
        beam('Bench back post',(x,-2.55,.69),(x,-2.55,1.28),.05,wood)
    for z in [1.02,1.21]: cube('Bench back',(2.45,-2.55,z),(1.17,.08,.15),trim,.045)
    beam('Mailbox post',(.15,-3.35,.3),(.15,-3.35,1.05),.06,wood)
    cube('Mailbox',(.15,-3.35,1.13),(.36,.44,.27),terracotta,.10)
    cube('Mailbox slot',(.15,-3.58,1.15),(.19,.018,.04),dark,.01)
    lantern(-2.0,-2.65,1.12,True)
    lantern(.2,-2.40,.97,True)

sx,sy,sw,sh=(-2.80,-3.65,2.15,1.0) if STAGE==5 else (-2.32,-2.60,1.40,.62)
sz=1.30 if STAGE==5 else 1.13
for x in [sx-sw*.40,sx+sw*.40]: beam('Sign post',(x,sy,.25),(x,sy,sz+sh*.6),.075,wood)
cube('Sign backing',(sx,sy,sz),(sw,.16,sh),trim,.085)
for z in [sz-sh/2+.07,sz+sh/2-.07]: cube('Sign border',(sx,sy-.07,z),(sw+.07,.08,.10),wood,.035)
anchor=bpy.data.objects.new('SignAnchor',None); bpy.context.collection.objects.link(anchor);anchor.location=(sx,sy-.091,sz)
sign_info={'position':[sx,sz,-sy+.095],'size':[sw-.16,sh-.18]}

# Planting follows the expanded perimeter rather than filling the visitor path.
if STAGE==1:
    for x,y,h in [(-fx+.45,fy-.62,.66),(fx-.42,fy-.57,.50)]:
        beam('Sapling stem',(x,y,.29),(x+.025,y,.29+h),.023,wood)
        for j in range(4):
            side=1 if j%2 else -1
            z=.45+j*h*.16
            beam('Sapling twig',(x,y,z),(x+side*.12,y+.02,z+.08),.012,wood)
            leaf=sphere('Sapling leaf',(x+side*.14,y+.02,z+.11),(.13,.055,.075),leaves[j%3],10,6)
            leaf.rotation_euler.y=-side*.45
        sphere('Sapling new bud',(x+.025,y,.31+h),(.048,.04,.075),leaves[1],10,6)
else:
    tree(-fx+.30,fy-.55,2.9 if STAGE==5 else 1.8,STAGE==5)
    tree(fx-.26,fy-.5,2.6 if STAGE==5 else 1.6)
if STAGE==5: tree(-fx+.25,.65,2.15)
clusters=[(-fx+.2,-fy+.35),(fx-.3,-fy+.45),(fx-.25,-1.5),(-fx+.23,.4),(.85,fy-.3)]
if STAGE==5: clusters += [(1.28,-3.55),(3.5,1.6),(-3.7,2.55)]
for x,y in clusters:
    for i in range(5):
        flower(x+random.uniform(-.23,.23),y+random.uniform(-.19,.19),.36,scale=random.uniform(.8,1.4))
    for i in range(5):
        a=i*math.tau/5
        leaf=sphere('Garden blade',(x+.12*math.cos(a),y+.12*math.sin(a),.49),(.055,.09,.24),leaves[i%3],8,6)
        leaf.rotation_euler=(.4*math.cos(a),.4*math.sin(a),a)
for i in range(160):
    side=i%4;t=random.uniform(-1,1)
    x,y=((t*(WIDTH/2-.25),-DEPTH/2+.22) if side==0 else (t*(WIDTH/2-.25),DEPTH/2-.22) if side==1 else (-WIDTH/2+.22,t*(DEPTH/2-.25)) if side==2 else (WIDTH/2-.22,t*(DEPTH/2-.25)))
    if y< -fy and -1.6<x<-.5: continue
    leaf=sphere('Moss tuft',(x,y,.38),(.025,.055,random.uniform(.1,.19)),leaves[i%3],6,4)
    leaf.rotation_euler.y=random.uniform(-.4,.4)
for x,y in [(-fx+.2,-.9),(fx-.2,-.4),(-fx+.2,fy-.3),(.82,fy-.3)]:
    sphere('Garden rock',(x,y,.4),(.25,.18,.18),random.choice(stone))
    for j in range(3): sphere('Low shrub',(x+.19*math.cos(j*2),y+.19*math.sin(j*2),.40),(.19,.16,.18),leaves[j])
