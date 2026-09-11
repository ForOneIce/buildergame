import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Project, Snapshot, Stage } from './types';

const colors = { grass: '#b8cd91', plot: '#dfd7ab', road: '#f1e4c8', wood: '#8a5942', trunk: '#896545', leaf: '#628b64' };
const material = (color: THREE.ColorRepresentation) => new THREE.MeshStandardMaterial({ color, roughness: 0.92 });
function box(group: THREE.Group, w: number, h: number, d: number, x: number, y: number, z: number, color: THREE.ColorRepresentation) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color));
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh;
}
function tree(group: THREE.Group, x: number, z: number, size = 1) {
  box(group, .15, .8 * size, .15, x, .4 * size, z, colors.trunk);
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(.66 * size, 0), material(colors.leaf));
  crown.position.set(x, 1.05 * size, z); crown.castShadow = true; group.add(crown);
}
// Replace this factory when final visual references arrive. 中文：模型与数据规则分离。
export function buildHouse(stage: Stage | null, color: string): THREE.Group {
  const g = new THREE.Group();
  if (!stage) {
    for (let i = 0; i < 4; i++) box(g, .35, .1, .35, (i % 2) * .7 - .35, .05, Math.floor(i / 2) * .7 - .35, '#b0b6aa');
    return g;
  }
  if (stage === 'land') {
    for (let i = 0; i < 4; i++) box(g, 1.4, .04, .12, 0, .035, -.5 + i * .32, '#b5a681');
    return g;
  }
  box(g, 1.75, .2, 1.5, 0, .1, 0, '#a8a795');
  if (stage === 'foundation') {
    box(g, 1.5, .17, .18, 0, .27, -.58, '#b9b5a3'); box(g, .18, .17, 1.2, -.67, .27, 0, '#b9b5a3');
    box(g, .6, .13, .3, .35, .27, .3, colors.wood); return g;
  }
  if (stage === 'frame') {
    for (const x of [-.68, .68]) for (const z of [-.55, .55]) box(g, .12, 1.2, .12, x, .8, z, colors.wood);
    for (const z of [-.55, .55]) box(g, 1.5, .12, .12, 0, 1.37, z, colors.wood);
    box(g, .12, .12, 1.2, -.68, 1.37, 0, colors.wood); box(g, .12, .12, 1.2, .68, 1.37, 0, colors.wood);
    return g;
  }
  const tall = stage === 'townhouse' || stage === 'decorated';
  const height = tall ? 1.9 : 1.15;
  box(g, 1.5, height, 1.25, 0, .2 + height / 2, 0, '#f7ebce');
  const shape = new THREE.Shape(); shape.moveTo(-.92, 0); shape.lineTo(0, .8); shape.lineTo(.92, 0); shape.closePath();
  const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 1.65, bevelEnabled: false }), material(color));
  roof.position.set(0, height + .2, -.825); roof.castShadow = true; g.add(roof);
  box(g, .33, .65, .06, 0, .52, .65, colors.wood);
  for (const x of [-.48, .48]) {
    box(g, .3, .33, .05, x, .83, .65, '#86abad');
    if (tall) box(g, .3, .35, .05, x, 1.63, .65, '#86abad');
  }
  box(g, .25, .65, .25, .45, height + .63, -.2, '#b77c65');
  if (stage === 'decorated') {
    box(g, 1.85, .14, .35, 0, 1.16, .83, color);
    for (const x of [-1.08, 1.08]) {
      box(g, .2, .22, .25, x, .14, .5, '#b47d59');
      const flower = new THREE.Mesh(new THREE.IcosahedronGeometry(.22, 0), material('#e8b27c'));
      flower.position.set(x, .42, .5); g.add(flower);
    }
    box(g, .05, .75, .05, -.8, height + .95, 0, colors.wood);
    box(g, .37, .23, .025, -.6, height + 1.16, 0, '#e9ba61');
  }
  return g;
}
function disposeGroup(group: THREE.Group) {
  group.traverse(obj => { if (obj instanceof THREE.Mesh) { obj.geometry.dispose(); const mats = Array.isArray(obj.material) ? obj.material : [obj.material]; mats.forEach(m => { if ('map' in m) (m as THREE.MeshBasicMaterial).map?.dispose(); m.dispose(); }); } });
}

export function createTown(host: HTMLElement, projects: Project[], select: (id: string, open: boolean) => void) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#e9eddf');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace;
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
  box(terrain, width, .65, depth, center.x, -.48, center.z, '#9db180');
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
    for (const x of [-1.45, 1.45]) box(root, .055, .3, 2.65, x, .25, -.12, '#c5b887');
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
    distance = Math.max(width, depth) * (host.clientWidth < 650 ? 2.2 : 1.45);
    controls.target.copy(center); camera.position.copy(center).add(new THREE.Vector3(distance * .66, distance * .82, distance));
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
        item.house = buildHouse(record.stage, projects.find(p => p.id === record.projectId)!.color || '#688d87');
        item.root.add(item.house); item.stage = record.stage; item.progress = 0;
      }
      if (highlighted) this.focus(highlighted);
    },
  };
}
