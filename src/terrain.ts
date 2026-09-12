import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {groundHeight,plotPosition} from './landscape.mjs';
import type {Project,Landscape} from './types';

export function createLandscape(projects:Project[],mode:Landscape) {
  const group=new THREE.Group(), positions=new Map(projects.map(p=>[p.id,plotPosition(p.plot,mode)]));
  const points=[...positions.values()];if(!points.length)points.push({x:0,y:0,z:0});
  const minX=Math.min(...points.map(p=>p.x))-10,maxX=Math.max(...points.map(p=>p.x))+10;
  const minZ=Math.min(...points.map(p=>p.z))-10,maxZ=Math.max(...points.map(p=>p.z))+10;
  const width=maxX-minX,depth=maxZ-minZ,cx=(minX+maxX)/2,cz=(minZ+maxZ)/2;
  const materials=new Map<string,THREE.MeshStandardMaterial>();
  const mat=(color:string)=>{if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.9}));return materials.get(color)!;};
  function add(geo:THREE.BufferGeometry,color:string,x:number,y:number,z:number,sx=1,sy=1,sz=1) {
    const m=new THREE.Mesh(geo,mat(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=m.receiveShadow=true;group.add(m);return m;
  }
  const ball=(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string)=>add(new THREE.SphereGeometry(1,10,7),color,x,y,z,sx,sy,sz);
  const box=(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string)=>add(new THREE.BoxGeometry(1,1,1),color,x,y,z,sx,sy,sz);
  function tree(x:number,y:number,z:number,h:number,seed:number) {
    box(x,y+h*.35,z,.16,h*.7,.16,'#876746');
    const colors=['#6f9254','#87a75c','#a4b877'];
    for(let i=0;i<3;i++)ball(x+Math.sin(seed+i)*.22,y+h*(.57+i*.16),z+Math.cos(i+seed)*.22,h*(.32-i*.055),h*.30,h*(.29-i*.05),colors[i]);
  }
  const roadNodes=new Map<string,THREE.Vector3>();
  const route=(a:THREE.Vector3,b:THREE.Vector3,cloud=false)=>{
    const length=a.distanceTo(b),steps=Math.max(2,Math.ceil(length/(cloud?1.25:.65)));
    if(cloud){for(let i=0;i<=steps;i++){const p=a.clone().lerp(b,i/steps);ball(p.x,p.y-.28,p.z,.85,.30,.67,'#f6faff');}return;}
    const verts:number[]=[],uvs:number[]=[],indices:number[]=[];
    const perpendicular=new THREE.Vector3(-(b.z-a.z),0,b.x-a.x).normalize().multiplyScalar(1.05);
    for(let i=0;i<=steps;i++){
      const p=a.clone().lerp(b,i/steps);
      for(const side of [-1,1]){const x=p.x+perpendicular.x*side,z=p.z+perpendicular.z*side;verts.push(x,groundHeight(x,z,mode)-.105,z);uvs.push(side===-1?0:1,i/steps);}
      if(i<steps){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}
      if(mode==='valley' && i%2===0)for(const side of [-1,1]){
        const x=p.x+perpendicular.x*side*.82,z=p.z+perpendicular.z*side*.82;
        ball(x,groundHeight(x,z,mode)-.07,z,.13,.055,.09,i%3?'#c5baa0':'#e2d6b9');
      }
      if(mode==='flat' && i%5===0){const edge=box(p.x, -.085,p.z,2,.025,.045,'#a3b1b2');edge.rotation.y=Math.atan2(perpendicular.z,perpendicular.x)*-1;}
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();add(geo,mode==='flat'?'#c4cdd0':'#b9a47b',0,0,0);
  };
  if(mode==='clouds') {
    type CloudPlot={x:number;y:number;z:number};
    const districts=new Map<string,CloudPlot[]>();
    for(const p of projects){
      const key=`${Math.floor(p.plot.x/2)},${Math.floor(p.plot.z/2)}`;
      if(!districts.has(key))districts.set(key,[]);
      districts.get(key)!.push(positions.get(p.id)!);
    }
    const front=(p:CloudPlot)=>new THREE.Vector3(p.x-1.25,p.y,p.z+6.5);
    for(const [key,plots]of districts){
      // Cloud size follows fixed membership, never changing with growth or snapshot scores.
      const left=Math.min(...plots.map(p=>p.x))-6.1,right=Math.max(...plots.map(p=>p.x))+6.6;
      const back=Math.min(...plots.map(p=>p.z))-6.1,fore=Math.max(...plots.map(p=>p.z))+7.4;
      const x=(left+right)/2,z=(back+fore)/2,y=plots[0].y,w=right-left,h=fore-back,r=2.5;
      const shape=new THREE.Shape();
      shape.moveTo(-w/2+r,-h/2);shape.lineTo(w/2-r,-h/2);shape.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);
      shape.lineTo(w/2,h/2-r);shape.quadraticCurveTo(w/2,h/2,w/2-r,h/2);
      shape.lineTo(-w/2+r,h/2);shape.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);
      shape.lineTo(-w/2,-h/2+r);shape.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
      const cushion=new THREE.ExtrudeGeometry(shape,{depth:1.3,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.55,bevelThickness:.55,curveSegments:6});
      cushion.rotateX(-Math.PI/2);add(cushion,'#ecf3fb',x,y-2.1,z);
      // Flat tops remain below the earth tiles; low scallops soften the cloud perimeter.
      const outline=shape.getSpacedPoints(Math.ceil((w+h)*2/3));outline.pop();
      outline.forEach((p,i)=>ball(x+p.x,y-1.65,z-p.y,1.7,1.38,1.7,i%2?'#f5f8fc':'#e7f1fc'));
      const [dx,dz]=key.split(',').map(Number);
      for(const axis of ['x','z'] as const){
        const neighbor=districts.get(axis==='x'?`${dx+1},${dz}`:`${dx},${dz+1}`);if(!neighbor)continue;
        const far=Math.max(...plots.map(p=>p[axis])),near=Math.min(...neighbor.map(p=>p[axis]));
        const candidates=plots.filter(p=>p[axis]===far).flatMap(a=>neighbor.filter(p=>p[axis]===near).map(b=>({a,b,distance:front(a).distanceTo(front(b))})));
        candidates.sort((a,b)=>a.distance-b.distance||a.a.x-b.a.x||a.a.z-b.a.z||a.b.x-b.b.x||a.b.z-b.b.z);
        const {a,b}=candidates[0];
        if(axis==='x'){
          const exit=new THREE.Vector3(a.x+6.15,a.y,a.z+6.5),entry=new THREE.Vector3(b.x-6.15,b.y,b.z+6.5);
          route(front(a),exit,true);route(exit,entry,true);route(entry,front(b),true);
        }else{
          // Arrive beside the next courtyard instead of through the back of a house.
          const entry=new THREE.Vector3(b.x+6.15,b.y,b.z-6.15),turn=new THREE.Vector3(b.x+6.15,b.y,b.z+6.5);
          route(front(a),entry,true);route(entry,turn,true);route(turn,front(b),true);
        }
      }
    }
  } else {
    // A rounded, irregular shoreline softens the rectangular logical assignment.
    const sx=Math.min(220,Math.ceil((width+18)/.7)),sz=Math.min(220,Math.ceil((depth+18)/.7));
    const geo=new THREE.PlaneGeometry(width+18,depth+18,sx,sz);geo.rotateX(-Math.PI/2);
    const attr=geo.attributes.position,colors:number[]=[];
    const low=new THREE.Color('#7f9b59'),high=new THREE.Color('#a2b76e'),sand=new THREE.Color('#c9bc92');
    for(let i=0;i<attr.count;i++){
      const x=attr.getX(i)+cx,z=attr.getZ(i)+cz;
      const edge=Math.pow(Math.pow(Math.abs((x-cx)/(width/2+7)),6)+Math.pow(Math.abs((z-cz)/(depth/2+7)),6),1/6);
      const shore=THREE.MathUtils.smoothstep(edge,.84,1.05);
      const y=(groundHeight(x,z,mode)-.18)*(1-shore)+(-3)*shore;
      attr.setXYZ(i,x,y,z);const c=low.clone().lerp(high,.5+.3*Math.sin(x*.47)*Math.cos(z*.37)).lerp(sand,shore*.9);colors.push(c.r,c.g,c.b);
    }
    geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
    const grass=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1});const ground=new THREE.Mesh(geo,grass);ground.receiveShadow=true;group.add(ground);
    const water=add(new THREE.PlaneGeometry(width+250,depth+250),'#6aafbd',cx,-1.4,cz);water.rotation.x=-Math.PI/2;water.castShadow=false;
    if(mode==='valley')for(let i=0;i<6;i++){
      const x=minX-9-i%2*3,z=minZ+2+i*depth/6,h=7+(i%3)*2;
      add(new THREE.ConeGeometry(1,1,9,3),i%2?'#79937a':'#91a381',x,h/2-1,z,6,h,7);
      add(new THREE.IcosahedronGeometry(1,1),'#99a780',x+2,.3,z,4,2.4,5);
      tree(x+4,.1,z+1,2.1,i);tree(x+3,.1,z+3,1.7,i+1);
      ball(x-2,-.95,z+4,3,.08,4,'#82c5d0');
    }
    for(let i=0;i<32;i++){const a=i*Math.PI*2/32;const x=cx+Math.cos(a)*(width/2+5),z=cz+Math.sin(a)*(depth/2+5);ball(x,-1.35,z,.4+(i%3)*.2,.07,.16,'#b6dce0');}
  }
  for(const p of projects){
    const pos=positions.get(p.id)!;
    const node=new THREE.Vector3(pos.x-1.25,pos.y,pos.z+6.5);roadNodes.set(`${p.plot.x},${p.plot.z}`,node);
    route(new THREE.Vector3(pos.x-1.25,pos.y,pos.z+3.65),node,mode==='clouds');
    if(mode!=='clouds'){
      for(let i=0;i<3;i++){
        const x=pos.x-6.2,z=pos.z-4.5+i*4.1,y=groundHeight(x,z,mode)-.15;
        tree(x,y,z,1.8+i*.37,p.plot.x+i);
        for(let j=0;j<3;j++)ball(x+.35+j*.16,y+.16,z+.4,.17,.17,.15,['#96ad62','#779a52','#adc27d'][j]);
      }
      const x=pos.x+5.7,z=pos.z+5.65,y=groundHeight(x,z,mode);
      box(x,y+.65,z,.10,1.6,.10,'#725f49');box(x,y+1.45,z,.32,.4,.32,'#e8d69d');
    }
  }
  // Local street connections never cross a building's maximum courtyard.
  for(const p of projects){const a=roadNodes.get(`${p.plot.x},${p.plot.z}`)!;
    const right=roadNodes.get(`${p.plot.x+1},${p.plot.z}`),front=roadNodes.get(`${p.plot.x},${p.plot.z+1}`);
    if(right && (mode!=='clouds'||Math.floor(p.plot.x/2)===Math.floor((p.plot.x+1)/2)))route(a,right,mode==='clouds');
    if(front && (mode!=='clouds'||Math.floor(p.plot.z/2)===Math.floor((p.plot.z+1)/2))){
      const bend1=new THREE.Vector3(a.x+7.4,a.y,a.z),bend2=new THREE.Vector3(front.x+7.4,front.y,front.z);
      route(a,bend1,mode==='clouds');route(bend1,bend2,mode==='clouds');route(bend2,front,mode==='clouds');
    }
  }
  // Batch authored scenery by material; geometry detail does not multiply draw calls.
  const batches=new Map<string,{material:THREE.Material;castShadow:boolean;receiveShadow:boolean;geos:THREE.BufferGeometry[]}>();
  for(const o of [...group.children])if(o instanceof THREE.Mesh && !o.geometry.attributes.color){
    o.updateMatrix();const geometry=o.geometry.clone().applyMatrix4(o.matrix);geometry.deleteAttribute('uv');
    const material=o.material as THREE.Material,key=`${material.uuid}:${o.castShadow}:${o.receiveShadow}`;
    if(!batches.has(key))batches.set(key,{material,castShadow:o.castShadow,receiveShadow:o.receiveShadow,geos:[]});
    batches.get(key)!.geos.push(geometry);o.geometry.dispose();group.remove(o);
  }
  for(const {material,castShadow,receiveShadow,geos}of batches.values()){
    const flattened=geos.map(g=>g.index?g.toNonIndexed():g);const merged=mergeGeometries(flattened,false);
    if(merged){const mesh=new THREE.Mesh(merged,material);mesh.castShadow=castShadow;mesh.receiveShadow=receiveShadow;group.add(mesh);}
    new Set([...geos,...flattened]).forEach(g=>g.dispose());
  }
  return {group,positions,center:new THREE.Vector3(cx,points.reduce((s,p)=>s+p.y,0)/points.length,cz),width:width+8,depth:depth+8};
}
