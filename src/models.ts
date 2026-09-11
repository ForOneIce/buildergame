import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Stage } from './types';

// Human reference: design/building.png. Procedural low-poly interpretation.
export function houseModel(stage: Stage | null, roofColor = '#477eae') {
  const root = new THREE.Group(); const mats = new Map<string, THREE.MeshStandardMaterial>();
  const mat = (c: string) => { if (!mats.has(c)) mats.set(c, new THREE.MeshStandardMaterial({ color: c, roughness: .88, ...(c === '#ffdfa0' ? { emissive: c, emissiveIntensity: .45 } : {}) })); return mats.get(c)!; };
  const block = (w: number, h: number, d: number, x: number, y: number, z: number, c: string) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c)); m.position.set(x,y,z); root.add(m); return m;
  };
  const beam = (a: number[], b: number[], thickness = .09) => {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), delta = end.clone().sub(start);
    const m = block(thickness, delta.length(), thickness, 0, 0, 0, '#9a693e'); m.position.copy(start.add(end).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), delta.normalize());
  };
  const flower = (x:number,z:number) => {
    block(.26,.2,.26,x,.14,z,'#b97b4b');
    for(let i=0;i<3;i++) { const m=new THREE.Mesh(new THREE.IcosahedronGeometry(.13,0),mat(i%2?'#f3cb6a':'#f2a887')); m.position.set(x+(i-1)*.1,.35+Math.sin(i)*.06,z);root.add(m); }
  };
  if (stage === null) { for(let i=0;i<4;i++)block(.25,.13,.25,(i%2)*.5-.25,.1,Math.floor(i/2)*.5-.25,'#b0b7ad'); }
  else if(stage==='land') { for(let i=0;i<4;i++)block(1.5,.035,.08,0,.055,i*.27-.4,'#a89668'); }
  else {
    for (let i=0;i<5;i++) for(const z of [-.65,.65]) block(.36,.18,.23,(i-2)*.38,.15,z,i%2?'#b8b6a2':'#cfcdba');
    for (let i=0;i<3;i++) for(const x of [-.83,.83]) block(.23,.18,.35,x,.15,(i-1)*.37,'#c4c1ae');
    if(stage==='foundation') {block(.8,.08,.22,.3,.31,.1,'#bd9158');block(.8,.08,.22,.2,.4,.1,'#bd9158');}
    else {
      const tall = stage==='townhouse'||stage==='decorated', h = tall ? 1.95 : 1.2;
      for(const x of [-.73,.73])for(const z of [-.59,.59])beam([x,.2,z],[x,h+.22,z],.12);
      for(const z of [-.59,.59]) {
        beam([-.8,h+.2,z],[.8,h+.2,z],.13);beam([-.82,h+.2,z],[0,h+1,z],.12);beam([0,h+1,z],[.82,h+.2,z],.12);
        if(stage==='frame')beam([-.7,.25,z],[.7,h+.12,z],.07);
      }
      beam([0,h+1,-.7],[0,h+1,.7],.1);
      if(stage!=='frame') {
        block(1.4,h,1.16,0,.2+h/2,0,'#e8d5a4');
        for(const y of [.25,h+.18,...(tall?[1.3]:[])])block(1.52,.1,1.25,0,y,0,'#8b5b38');
        for(const x of [-.69,.69])block(.1,h,.06,x,.2+h/2,.61,'#8b5b38');
        // Overlapping blue shingles on both roof slopes.
        for(const side of [-1,1])for(let row=0;row<5;row++)for(let col=0;col<6;col++) {
          const x=side*(row*.185+.04), y=h+1-row*.177;
          const tile=block(.3,.065,.29,x,y,-.76+col*.29,roofColor);tile.rotation.z=-side*.76;
        }
        beam([-.96,h+.12,.88],[0,h+1.1,.88],.1);beam([0,h+1.1,.88],[.96,h+.12,.88],.1);
        block(.42,.73,.09,0,.58,.64,'#765039');block(.06,.06,.06,.12,.58,.71,'#d9ba63');
        for(const x of [-.47,.47])for(const y of tall?[.9,1.7]:[.9]) {
          block(.32,.4,.08,x,y,.62,'#765039');block(.24,.3,.09,x,y,.64,'#ffdfa0');block(.035,.32,.1,x,y,.67,'#8b5b38');block(.27,.035,.1,x,y,.67,'#8b5b38');
        }
        block(.3,.9,.3,.46,h+.66,-.26,'#b6a58d');block(.37,.12,.38,.46,h+1.08,-.26,'#ded6bb');
        for(let i=0;i<3;i++)block(.62-i*.05,.09,.17,0,.07+i*.08,1.05-i*.14,'#ae8554');
        if(tall) {
          const canopy=block(1.6,.09,.55,0,1.22,.96,roofColor);canopy.rotation.x=.15;
          for(const x of [-.72,.72])beam([x,.2,1.12],[x,1.27,1.12],.07);
          flower(-1.05,.65);flower(1.05,.65);
        }
        if(stage==='decorated') {
          flower(-.8,-.9);flower(.85,-.9);
          for(let i=0;i<4;i++) {const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry(.23,0),mat('#659447'));leaf.position.set(-.8,.7+i*.4,.3);root.add(leaf);}
          beam([.85,h+.7,0],[.85,h+1.55,0],.04);block(.36,.24,.02,1.01,h+1.4,0,'#e8bb5b');
          block(.65,.07,.5,1.05,.6,.1,'#95663e');for(const z of [-.08,.28])beam([.9,.1,z],[.9,.6,z],.07);
        }
      }
    }
  }
  // Merge each material to keep draw calls bounded as the town grows.
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();root.updateMatrixWorld(true);
  root.traverse(o => {if(o instanceof THREE.Mesh){const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);const list=batches.get(o.material)||[];list.push(geometry);batches.set(o.material,list);o.geometry.dispose();}});
  root.clear();for(const [material, geometries]of batches){const merged=mergeGeometries(geometries,false)!;geometries.forEach(g=>g.dispose());const mesh=new THREE.Mesh(merged,material);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);}
  return root;
}
