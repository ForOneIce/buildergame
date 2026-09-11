import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Project, Snapshot, Stage } from './types';
import { houseModel } from './models';

const colors = { grass: '#a8c875', plot: '#c9cd8b', road: '#ddcf9e', wood: '#8a5942', trunk: '#896545', leaf: '#729d4d' };
const material = (color: THREE.ColorRepresentation) => new THREE.MeshStandardMaterial({ color, roughness: 0.92 });
function box(group: THREE.Group, w: number, h: number, d: number, x: number, y: number, z: number, color: THREE.ColorRepresentation) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color));
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh;
}
function tree(group: THREE.Group, x: number, z: number, size = 1) {
  box(group, .15, .8 * size, .15, x, .4 * size, z, colors.trunk);
  for(let i=0;i<3;i++) { const crown = new THREE.Mesh(new THREE.IcosahedronGeometry((.5-i*.045) * size, 1), material(i%2?'#8aab52':colors.leaf));
  crown.position.set(x+Math.sin(i*2)*.3*size, (1.12+i*.15)*size, z+Math.cos(i*2)*.24*size); crown.castShadow = true; group.add(crown); }
}
function disposeGroup(group: THREE.Group) {
  group.traverse(obj => { if (obj instanceof THREE.Mesh) { obj.geometry.dispose(); const mats = Array.isArray(obj.material) ? obj.material : [obj.material]; mats.forEach(m => { if ('map' in m) (m as THREE.MeshBasicMaterial).map?.dispose(); m.dispose(); }); } });
}

export function createTown(host: HTMLElement, projects: Project[], select: (id: string, open: boolean) => void) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#86bcd0'); scene.fog = new THREE.Fog('#add9e4', 75, 160);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  host.append(renderer.domElement); renderer.domElement.setAttribute('aria-label', 'Interactive 3D town. Use the project directory for keyboard access.');
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 500);
  const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.enablePan = true;
  controls.minPolarAngle = .25; controls.maxPolarAngle = Math.PI / 2.35;
  scene.add(new THREE.HemisphereLight('#fff7df', '#93a986', 2.5));
  const sun = new THREE.DirectionalLight('#fff6de', 3.1); sun.position.set(-12, 25, 16); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -40; sun.shadow.camera.right = 40; sun.shadow.camera.top = 40; sun.shadow.camera.bottom = -40;
  sun.shadow.normalBias = .04; scene.add(sun);
  const xs = projects.map(p => p.plot.x * 4), zs = projects.map(p => p.plot.z * 4);
  const center = new THREE.Vector3((Math.min(...xs) + Math.max(...xs)) / 2, 0, (Math.min(...zs) + Math.max(...zs)) / 2);
  const width = Math.max(...xs) - Math.min(...xs) + 7, depth = Math.max(...zs) - Math.min(...zs) + 7;
  const terrain = new THREE.Group(); scene.add(terrain);
  box(terrain, width, 1.8, depth, center.x, -1, center.z, '#a19f8a');
  // Irregular cliff skirt, with a soft sea underneath the island.
  for (let i=0;i<36;i++) { const angle=i/36*Math.PI*2;const cliff=new THREE.Mesh(new THREE.IcosahedronGeometry(1.45+(i%3)*.2,0),material(i%2?'#b2ae96':'#979c8a'));cliff.position.set(center.x+Math.cos(angle)*(width/2-.5),-2.8-(i%3)*.22,center.z+Math.sin(angle)*(depth/2-.5));cliff.scale.y=1.25;cliff.castShadow=true;terrain.add(cliff); }
  const sea=new THREE.Mesh(new THREE.PlaneGeometry(600,600),material('#68b5c9'));sea.rotation.x=-Math.PI/2;sea.position.y=-5;scene.add(sea);
  const scenery=new THREE.Group();scene.add(scenery);
  for(let i=0;i<18;i++) {const ripple=box(scenery,1.2+(i%3),.008,.05,center.x+Math.sin(i*2.4)*(width/2+3+i*.6),-4.98,center.z+Math.cos(i*2.4)*(depth/2+3+i*.5),'#acd5dd');ripple.rotation.y=i*.6;}
  // A small landing dock connects the town to the open water.
  for(let i=0;i<8;i++)box(scenery,1,.07,.23,center.x-2,.02,center.z+depth/2+i*.26,'#b89765');
  for(const x of [-2.55,-1.45])for(const z of [depth/2,depth/2+1.7]){box(scenery,.09,1.5,.09,center.x+x,-.3,center.z+z,'#8b7350');}
  for(let i=0;i<5;i++){const cloud=new THREE.Group();for(let j=0;j<4;j++){const puff=new THREE.Mesh(new THREE.IcosahedronGeometry(1.3-j*.13,1),new THREE.MeshStandardMaterial({color:'#eaf2e6',transparent:true,opacity:.68,roughness:1}));puff.position.set(j*1.1,Math.sin(j)*.3,0);cloud.add(puff);}cloud.position.set(center.x+(i%2?1:-1)*(width/2+7+i*2),-1.5,center.z+(i-2)*9);scenery.add(cloud);}
  box(terrain, width, .12, depth, center.x, -.095, center.z, colors.grass);
  for (const z of new Set(zs)) box(terrain, width - .5, .035, .72, center.x, 0, z + 1.85, colors.road);
  for (const x of new Set(xs)) box(terrain, .55, .035, depth - .5, x + 1.9, .006, center.z, colors.road);
  for (let x = center.x - width / 2 + .8; x < center.x + width / 2; x += 2.5) {
    tree(terrain, x, center.z - depth / 2 + .8, .85); tree(terrain, x, center.z + depth / 2 - .65, .65);
  }
  const buildings = new Map<string, { root: THREE.Group; house: THREE.Group; stage: Stage | null | undefined; progress: number }>();
  const hitTargets: THREE.Object3D[] = [];
  for (const p of projects) {
    const root = new THREE.Group(); root.position.set(p.plot.x * 4, 0, p.plot.z * 4); scene.add(root);
    box(root, 3.25, .065, 3.05, 0, .015, 0, colors.plot);
    box(root, .45, .025, .85, 0, .06, 1.18, colors.road);
    for (const x of [-1.45, 1.45]) { for(const z of [-1.2,0,1.2])box(root,.09,.48,.09,x,.3,z,'#ab8651');for(const y of [.24,.43])box(root,.055,.06,2.65,x,y,-.12,'#b49461'); }
    tree(root,-1.07,-.97,.58); tree(root,1.1,-.92,.45);
    for(let i=0;i<6;i++){const petal=new THREE.Mesh(new THREE.IcosahedronGeometry(.06,0),material(i%2?'#f8d576':'#f4e5b5'));petal.position.set(-1.25+(i%3)*.18,.14,-.55+Math.floor(i/3)*.18);root.add(petal);}
    const sign = new THREE.Group(); sign.position.set(-.83, 0, 1.27); root.add(sign);
    box(sign, .07, .65, .07, 0, .34, 0, colors.wood);
    box(sign, 1.15, .5, .08, 0, .66, 0, colors.wood);
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 224;
    const ctx = canvas.getContext('2d')!;
    const drawSign = (avatar?: HTMLImageElement) => {
      ctx.fillStyle = '#805a40'; ctx.fillRect(0, 0, 512, 224);
      ctx.fillStyle = '#f6e9cb'; ctx.font = 'bold 76px sans-serif';
      if (avatar) ctx.drawImage(avatar, 22, 48, 118, 118);
      else { ctx.fillStyle = p.color || '#63857b'; ctx.fillRect(22, 48, 118, 118); ctx.fillStyle = '#fff'; ctx.fillText(p.builder.name.slice(0, 1).toUpperCase(), 54, 135); }
      ctx.fillStyle = '#fff1d8'; ctx.font = 'bold 39px sans-serif'; ctx.fillText(p.name.slice(0, 13), 160, 98);
      ctx.font = '29px sans-serif'; ctx.fillText(p.builder.name.slice(0, 18), 160, 150);
    };
    drawSign(); const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.08, .46), new THREE.MeshBasicMaterial({ map: texture }));
    face.position.set(0, .66, .046); sign.add(face); sign.userData = { id: p.id, action: 'details' }; hitTargets.push(sign);
    if (p.builder.avatar) { const avatar = new Image(); avatar.crossOrigin = 'anonymous'; avatar.onload = () => { drawSign(avatar); texture.needsUpdate = true; }; avatar.src = p.builder.avatar; }
    const hit = new THREE.Mesh(new THREE.BoxGeometry(2.1, 3.8, 1.8), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = 1.7; hit.userData = { id: p.id, action: 'visit' }; root.add(hit); hitTargets.push(hit);
    const house = new THREE.Group(); root.add(house); buildings.set(p.id, { root, house, stage: undefined, progress: 1 });
  }
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.48, 1.57, 4), new THREE.MeshBasicMaterial({ color: '#f5fcdd', side: THREE.DoubleSide }));
  ring.rotation.set(-Math.PI / 2, 0, Math.PI / 4); ring.position.y = .07; ring.visible = false; scene.add(ring);
  let highlighted: string | null = null;
  const ray = new THREE.Raycaster(); const pointer = new THREE.Vector2(); let down = { x: 0, y: 0 }; let dragged = false;
  renderer.domElement.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; dragged = false; });
  const pick = (e: PointerEvent) => {
    const bounds = renderer.domElement.getBoundingClientRect(); pointer.set((e.clientX - bounds.left) / bounds.width * 2 - 1, -(e.clientY - bounds.top) / bounds.height * 2 + 1); ray.setFromCamera(pointer, camera);
    const result = ray.intersectObjects(hitTargets, true)[0]; if (!result) return null;
    let object: THREE.Object3D | null = result.object;
    while (object && !object.userData.id) object = object.parent;
    return object?.userData;
  };
  renderer.domElement.addEventListener('pointermove', e => { if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) dragged = true; renderer.domElement.style.cursor = pick(e) ? 'pointer' : 'grab'; });
  renderer.domElement.addEventListener('pointerup', e => { if (dragged || e.button !== 0) return; const hit = pick(e); if (hit) select(hit.id, hit.action === 'visit'); });
  let distance = 25;
  function reset() {
    camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();
    distance = Math.max(width, depth) / (2 * Math.tan(THREE.MathUtils.degToRad(18)) * Math.min(camera.aspect,1)) * 1.15;
    controls.target.copy(center); camera.position.copy(center).add(new THREE.Vector3(.66,.82,1).normalize().multiplyScalar(distance));
    controls.minDistance = 5; controls.maxDistance = distance * 3; controls.update();
  }
  const resize = new ResizeObserver(() => { const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }); resize.observe(host); reset();
  let last = performance.now();
  renderer.setAnimationLoop(now => {
    const delta = Math.min((now - last) / 1000, .06); last = now;
    if (document.hidden) return;
    for (const item of buildings.values()) {
      item.progress = Math.min(1, item.progress + delta * 1.8);
      item.house.scale.y = reducedMotion.matches ? 1 : Math.max(.015, 1 - Math.pow(1 - item.progress, 3));
    }
    controls.update(); renderer.render(scene, camera);
  });
  return {
    reset,
    focus(id: string) { highlighted = id; const item = buildings.get(id); if (item) { ring.visible = true; ring.position.x = item.root.position.x; ring.position.z = item.root.position.z; } },
    update(snapshot: Snapshot) {
      for (const record of snapshot.projects) {
        const item = buildings.get(record.projectId)!;
        if (item.stage === record.stage) continue;
        item.root.remove(item.house); disposeGroup(item.house);
        item.house = houseModel(record.stage, projects.find(p => p.id === record.projectId)!.color || '#477eae');
        item.root.add(item.house); item.stage = record.stage; item.progress = 0;
      }
      if (highlighted) this.focus(highlighted);
    },
    zoom(direction: number) { camera.position.sub(controls.target).multiplyScalar(direction > 0 ? .8 : 1.25).add(controls.target);controls.update(); },
    dispose() { renderer.setAnimationLoop(null);resize.disconnect();controls.dispose();disposeGroup(terrain);disposeGroup(scenery);for(const item of buildings.values())disposeGroup(item.root);ring.geometry.dispose();ring.material.dispose();sea.geometry.dispose();(sea.material as THREE.Material).dispose();sun.shadow.dispose();renderer.dispose();renderer.domElement.remove(); },
  };
}
