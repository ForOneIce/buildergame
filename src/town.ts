import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { appearance, release, townAssets } from './town-assets';
import {createLandscape} from './terrain';
import { createMailboxDemo } from './mailbox-demo';
import type { Landscape, Project, Snapshot } from './types';
import './town.css';

export type TownOptions = { mailboxDemo?: boolean; onMailbox?: (id: string) => void };

export function createTown(host: HTMLElement, projects: Project[], select: (id: string, open: boolean) => void, landscape: Landscape = 'flat', options: TownOptions = {}) {
  const zh = document.documentElement.lang.startsWith('zh');
  const t = (en: string, cn: string) => zh ? cn : en;
  let disposed = false, dirty = true;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const scene = new THREE.Scene(); scene.background = new THREE.Color(landscape==='clouds'?'#bddbef':'#b8d9df');
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1; host.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', t('Interactive town. Drag to orbit, right-drag to pan, scroll to zoom. Projects are also available in the directory.', '交互小镇：拖动旋转，右键平移，滚轮缩放。也可使用项目列表。'));
  const status = document.createElement('div'); status.className = 'town-load'; status.setAttribute('role', 'status');
  const copy = document.createElement('span'), retry = document.createElement('button'); retry.textContent = t('Retry', '重试');
  status.append(copy, retry); host.append(status);
  const camera = new THREE.PerspectiveCamera(36, 1, .2, 3000);
  const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true;
  controls.minPolarAngle = .08; controls.maxPolarAngle = Math.PI * .475; controls.minDistance = 8;
  controls.addEventListener('change', () => { dirty = true; });
  scene.add(new THREE.HemisphereLight('#fff8e5', '#b5ae87', 1.25));
  const sun = new THREE.DirectionalLight('#ffeaca', 3.2); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.normalBias = .025; sun.shadow.bias = -.00015;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#e2ebff', 1.1); fill.position.set(6, 5, -4); scene.add(fill);
  const room = new RoomEnvironment(), pmrem = new THREE.PMREMGenerator(renderer), environment = pmrem.fromScene(room, .06);
  scene.environment = environment.texture; scene.environmentIntensity = .28; room.dispose(); pmrem.dispose();
  const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
  const ao = new GTAOPass(scene, camera, Math.max(1, host.clientWidth), Math.max(1, host.clientHeight));
  ao.updateGtaoMaterial({ radius: .35, thickness: 1, distanceExponent: 1.6, distanceFallOff: .9, samples: 8 });
  ao.blendIntensity = .78; composer.addPass(ao); const output = new OutputPass(); composer.addPass(output);
  const assets = townAssets(scene, projects.length, () => { dirty = true; }); retry.onclick = () => assets.retry();
  const layout=createLandscape(projects,landscape);
  const {center,width,depth}=layout;const terrain=layout.group;scene.add(terrain);
  host.dataset.landscape=landscape;
  const signGeometry = new THREE.PlaneGeometry(1, 1), hitGeometry = new THREE.BoxGeometry(4.8, 5.6, 4.6);
  const hitMaterial = new THREE.MeshBasicMaterial({ visible: false });
  const hitTargets: THREE.Object3D[] = [], avatars: HTMLImageElement[] = [];
  const buildings = new Map<string, { root: THREE.Group; sign: THREE.Mesh; marker: THREE.Mesh; stage: number; progress: number }>();
  for (const p of projects) {
    const root = new THREE.Group(); const pos=layout.positions.get(p.id)!;root.position.set(pos.x,pos.y,pos.z); scene.add(root);
    const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 320;
    const ctx = canvas.getContext('2d')!, texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const drawSign = (avatar?: HTMLImageElement) => {
      ctx.clearRect(0, 0, 768, 320); ctx.fillStyle = '#6c7d49'; ctx.beginPath(); ctx.arc(76, 84, 49, 0, Math.PI * 2); ctx.fill();
      if (avatar) { ctx.save(); ctx.clip(); ctx.drawImage(avatar, 27, 35, 98, 98); ctx.restore(); }
      else { ctx.fillStyle = '#fff6de'; ctx.font = 'bold 44px sans-serif'; ctx.fillText(p.builder.name.slice(0, 1).toUpperCase(), 60, 99); }
      ctx.fillStyle = '#513c25'; ctx.font = 'bold 47px Georgia'; ctx.fillText(p.name.slice(0, 21), 148, 84, 590);
      ctx.font = '27px sans-serif'; ctx.fillText(p.builder.name.slice(0, 32), 150, 126, 584);
      ctx.fillRect(28, 160, 710, 2); ctx.font = '26px sans-serif';
      const description = p.description || t('A place for something new.', '在这里创造新的可能。');
      ctx.fillText(description.slice(0, 48), 28, 212, 710); ctx.fillText(description.slice(48, 96), 28, 249, 710);
      ctx.font = '21px sans-serif'; ctx.fillText(t('MEET THE BUILDER  →', '认识开发者  →'), 28, 297); texture.needsUpdate = true;
    };
    drawSign();
    const sign = new THREE.Mesh(signGeometry, new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
    sign.userData = { id: p.id, action: 'details' }; root.add(sign); hitTargets.push(sign);
    if (p.builder.avatar) { const avatar = new Image(); avatar.crossOrigin = 'anonymous'; avatar.onload = () => { if (!disposed) drawSign(avatar); }; avatar.src = p.builder.avatar; avatars.push(avatar); }
    const hit = new THREE.Mesh(hitGeometry, hitMaterial); hit.position.set(-.5, 2.4, -.3);
    // Ray-only proxies stay outside the rendered scene (including AO overrides).
    hit.position.add(root.position); hit.updateMatrixWorld();
    hit.userData = { id: p.id, action: 'visit' }; hitTargets.push(hit);
    const marker = new THREE.Mesh(new THREE.BoxGeometry(7, .15, 6.7), new THREE.MeshStandardMaterial({ color: '#adb8b4', roughness: 1 }));
    marker.position.y = -.08; root.add(marker);
    buildings.set(p.id, { root, sign, marker, stage: 0, progress: 1 });
  }
  const mailboxes = options.mailboxDemo ? createMailboxDemo(scene, camera, renderer.domElement, projects.map(p => ({ id: p.id, ...layout.positions.get(p.id)! })), reducedMotion, options.onMailbox) : undefined;
  if (mailboxes) hitTargets.push(...mailboxes.hitTargets);
  const ring = new THREE.Mesh(new THREE.RingGeometry(6.6, 6.72, 4), new THREE.MeshBasicMaterial({ color: '#fff4c2', side: THREE.DoubleSide }));
  ring.rotation.set(-Math.PI / 2, 0, Math.PI / 4); ring.position.y = -.025; ring.visible = false; scene.add(ring);
  const ray = new THREE.Raycaster(), pointer = new THREE.Vector2(); let down: { x: number; y: number; pointerId: number; button: number } | undefined, dragged = false;
  const greeting=document.createElement('span');greeting.className='scene-greeting';greeting.textContent=t('Say hi','打个招呼');greeting.hidden=true;greeting.setAttribute('aria-hidden','true');host.append(greeting);
  renderer.domElement.dataset.cursor='walk';
  function clearHover() { greeting.hidden = true; renderer.domElement.dataset.cursor = 'walk'; }
  function tossCoin(id: string) { clearHover(); return mailboxes?.toss(id) ?? false; }
  const pick = (e: PointerEvent) => {
    const bounds = renderer.domElement.getBoundingClientRect(); pointer.set((e.clientX - bounds.left) / bounds.width * 2 - 1, -(e.clientY - bounds.top) / bounds.height * 2 + 1);
    camera.updateMatrixWorld(); ray.setFromCamera(pointer, camera); return ray.intersectObjects(hitTargets.filter(o => o.visible), false)[0]?.object.userData;
  };
  renderer.domElement.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, pointerId: e.pointerId, button: e.button }; dragged = false;renderer.domElement.dataset.cursor='grabbing';greeting.hidden=true; });
  renderer.domElement.addEventListener('pointermove', e => {
    if(e.buttons&&down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>6)dragged=true;
    const hit=pick(e), mailbox=hit?.action==='mailbox';renderer.domElement.dataset.cursor=e.buttons?'grabbing':mailbox?'coin':hit?.action==='visit'?'visit':hit?'grab':'walk';
    greeting.hidden=!!e.buttons||(!mailbox&&hit?.action!=='visit')||e.pointerType==='touch';
    greeting.textContent=mailbox?t('Drop a demo coin','投一枚演示金币'):t('Say hi','打个招呼');greeting.classList.toggle('mailbox-greeting',mailbox);
    if(!greeting.hidden){const bounds=host.getBoundingClientRect(),margin=greeting.offsetWidth/2+8;greeting.style.left=Math.min(Math.max(margin,e.clientX-bounds.left),Math.max(margin,bounds.width-margin))+'px';greeting.style.top=Math.max(44,e.clientY-bounds.top-18)+'px';}
  });
  renderer.domElement.addEventListener('pointerleave',clearHover);
  renderer.domElement.addEventListener('pointercancel',()=>{down=undefined;dragged=false;clearHover();});
  renderer.domElement.addEventListener('pointerup', e => {
    const press=down;down=undefined;clearHover();
    if (!press || press.pointerId!==e.pointerId || press.button!==0 || dragged || e.button!==0 || Math.hypot(e.clientX-press.x,e.clientY-press.y)>6) return;
    const hit=pick(e);if(hit?.action==='mailbox'){tossCoin(hit.id);return;}if(hit)select(hit.id,hit.action==='visit');
  });

  function reset() {
    camera.aspect = Math.max(1, host.clientWidth) / Math.max(1, host.clientHeight); camera.updateProjectionMatrix();
    const distance = Math.max((width + depth * .45) / camera.aspect, depth + width * .42) / (2 * Math.tan(THREE.MathUtils.degToRad(18))) * (camera.aspect < .8 ? .94 : .84);
    controls.target.copy(center); camera.position.copy(center).add(new THREE.Vector3(.6, .88, 1).normalize().multiplyScalar(distance));
    controls.maxDistance = Math.max(80, distance * 2); controls.update(); dirty = true;
  }
  function resize() {
    const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight);
    renderer.setSize(w, h); composer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = true;
  }
  const observer = new ResizeObserver(resize); observer.observe(host); resize(); reset();
  const matrix = new THREE.Matrix4(), transform = new THREE.Matrix4();
  let last = performance.now(), lastBatch = 0;
  let preview: ((data:string)=>void)|undefined;
  function batches() {
    dirty = false;
    const near = new Set([...buildings.values()].filter(b => camera.position.distanceTo(b.root.position) < 38)
      .sort((a, b) => camera.position.distanceToSquared(a.root.position) - camera.position.distanceToSquared(b.root.position)).slice(0, 6));
    for (const a of assets.ready.values()) for (const p of a.parts) p.mesh.count = 0;
    let unknown = 0, highCount = 0;
    const wanted = new Set<string>();
    for (const [id, b] of buildings) {
      if (b.stage) { wanted.add(`${b.stage}-low`); assets.request(b.stage, 'low'); }
      if (b.stage && near.has(b)) { wanted.add(`${b.stage}-high`); assets.request(b.stage, 'high'); }
      const high = near.has(b) && assets.ready.get(`${b.stage}-high`);
      const asset = high || assets.ready.get(`${b.stage}-low`);
      mailboxes?.available(id, Boolean(asset) && b.stage === 5 && b.progress >= 1);
      b.marker.visible = !asset; if (!b.stage) unknown++; if (high) highCount++;
      b.sign.visible = !!asset;
      if (!asset) continue;
      b.sign.position.fromArray(asset.sign.position); b.sign.scale.set(asset.sign.size[0], asset.sign.size[1], 1);
      const scale = reducedMotion.matches ? 1 : .88 + .12 * b.progress;
      transform.makeScale(1, scale, 1); transform.setPosition(b.root.position);
      for (const part of asset.parts) { matrix.multiplyMatrices(transform, part.local); part.mesh.setMatrixAt(part.mesh.count++, matrix); }
    }
    for (const a of assets.ready.values()) for (const p of a.parts) { p.mesh.visible = p.mesh.count > 0; p.mesh.instanceMatrix.needsUpdate = true; if (p.mesh.count) p.mesh.computeBoundingSphere(); }
    const failed = [...wanted].some(k => assets.failed.has(k)), loading = [...wanted].some(k => assets.pending.has(k));
    status.hidden = !failed && !loading && !unknown; retry.hidden = !failed;
    copy.textContent = failed ? t('Some buildings could not load.', '部分建筑加载失败。') : loading ? t('Building the neighborhood…', '正在搭建街区…') : t(`${unknown} plots awaiting data`, `${unknown} 个地块等待数据`);
    host.dataset.townReady = failed ? 'error' : loading ? 'loading' : 'true';
    host.dataset.highDetail = String(highCount); host.dataset.stages = [...buildings.values()].map(b => b.stage).join(',');
    // Keep shadow texels useful between the whole town and one yard.
    const extent = Math.min(65, Math.max(12, camera.position.distanceTo(controls.target) * .45));
    sun.target.position.copy(controls.target); sun.position.copy(controls.target).add(new THREE.Vector3(-30, 100, 70));
    Object.assign(sun.shadow.camera, { left: -extent, right: extent, top: extent, bottom: -extent, near: 1, far: 250 });
    sun.shadow.camera.updateProjectionMatrix(); ao.enabled = camera.position.distanceTo(controls.target) < (landscape==='clouds'?180:110);
  }
  renderer.setAnimationLoop(now => {
    const delta = Math.min((now - last) / 1000, .06); last = now; if (document.hidden) return;
    for (const b of buildings.values()) if (b.progress < 1) { b.progress = Math.min(1, b.progress + delta * 2); dirty = true; }
    controls.update(); if (dirty && now - lastBatch > 80) { batches(); lastBatch = now; }
    mailboxes?.update(delta);
    renderer.info.autoReset = false; renderer.info.reset(); composer.render();
    host.dataset.drawCalls = String(renderer.info.render.calls); host.dataset.triangles = String(renderer.info.render.triangles);
    if(preview){const done=preview;preview=undefined;const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const side=Math.min(renderer.domElement.width,renderer.domElement.height)*.67;canvas.getContext('2d')!.drawImage(renderer.domElement,(renderer.domElement.width-side)/2,(renderer.domElement.height-side)/2,side,side,0,0,256,256);done(canvas.toDataURL('image/png'));}
  });
  return {
    reset,
    tossCoin,
    mailboxPoints() { return mailboxes?.points() ?? []; },
    focusMailbox(id: string) {
      const target=mailboxes?.target(id);if(!target||disposed)return false;
      clearHover();controls.target.copy(target);camera.position.copy(target).add(new THREE.Vector3(4.1,3.6,6.4));
      controls.update();camera.updateMatrixWorld();dirty=true;return true;
    },
    capturePreview(callback:(data:string)=>void){preview=callback;},
    mapPoints: projects.map(p=>({id:p.id,...layout.positions.get(p.id)!})),
    focus(id: string) {
      const b = buildings.get(id); if (!b) return;
      ring.visible = true; ring.position.x = b.root.position.x; ring.position.z = b.root.position.z; ring.position.y=b.root.position.y-.025;
      controls.target.copy(b.root.position).add(new THREE.Vector3(0, 1.4, 0));
      camera.position.copy(controls.target).add(new THREE.Vector3(10, 11, 16)); controls.update(); dirty = true;
    },
    update(snapshot: Snapshot) {
      mailboxes?.reset();clearHover();down=undefined;
      const states = new Map(snapshot.projects.map(r => [r.projectId, appearance(r.stage)]));
      for (const [id, b] of buildings) { const next = states.get(id) ?? 0; if (next !== b.stage) { b.stage = next; b.progress = 0; } }
      host.dataset.snapshot = snapshot.id; dirty = true;
    },
    zoom(direction: number) {
      const offset = camera.position.clone().sub(controls.target);
      offset.setLength(THREE.MathUtils.clamp(offset.length() * (direction > 0 ? .8 : 1.25), controls.minDistance, controls.maxDistance));
      camera.position.copy(controls.target).add(offset); controls.update(); dirty = true;
    },
    dispose() {
      disposed = true; renderer.setAnimationLoop(null); observer.disconnect(); controls.dispose();
      mailboxes?.dispose();clearHover();
      avatars.forEach(a => { a.onload = null; a.onerror = null; }); assets.dispose();
      release([terrain, ring, ...[...buildings.values()].map(b => b.root)]);
      signGeometry.dispose(); hitGeometry.dispose(); hitMaterial.dispose(); sun.shadow.dispose();
      ao.dispose(); output.dispose(); composer.dispose(); environment.dispose(); renderer.dispose(); renderer.domElement.remove(); status.remove();greeting.remove();
    },
  };
}
