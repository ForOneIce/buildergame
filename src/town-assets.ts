import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { Stage } from './types';

export const PLOT_SPACING = 12;
export const appearance = (stage: Stage | null | undefined): number => {
  const map: Partial<Record<Stage, number>> = { land: 1, foundation: 2, frame: 3, cottage: 4, townhouse: 5, decorated: 5 };
  return stage ? map[stage] ?? 0 : 0;
};
const stems = ['', 'stage-1', 'stage-2', 'stage-3', 'stage-4', 'cozy-house'];
export type TownAsset = { source: THREE.Group; parts: { mesh: THREE.InstancedMesh; local: THREE.Matrix4 }[];
  sign: { position: number[]; size: number[] } };

// Release shared resources once, including decoded image bitmaps.
export function release(objects: THREE.Object3D[]) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
  for (const root of objects) root.traverse(o => {
    if (!(o instanceof THREE.Mesh)) return;
    if (o instanceof THREE.InstancedMesh) o.dispose();
    geometries.add(o.geometry);
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) materials.add(m);
  });
  for (const m of materials) { for (const value of Object.values(m)) if (value instanceof THREE.Texture) textures.add(value); m.dispose(); }
  geometries.forEach(g => g.dispose());
  textures.forEach(t => { t.dispose(); if (typeof ImageBitmap !== 'undefined' && t.image instanceof ImageBitmap) t.image.close(); });
}

export function townAssets(scene: THREE.Scene, capacity: number, changed: () => void) {
  const ready = new Map<string, TownAsset>(), pending = new Set<string>(), failed = new Set<string>();
  const loader = new GLTFLoader(); let disposed = false;
  const fiberCanvas = document.createElement('canvas'); fiberCanvas.width = fiberCanvas.height = 256;
  const ctx = fiberCanvas.getContext('2d')!; ctx.fillStyle = '#888'; ctx.fillRect(0, 0, 256, 256);
  let seed = 913;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 14000; i++) { const v = 90 + Math.floor(random() * 85); ctx.strokeStyle = `rgb(${v},${v},${v})`;
    const x = random() * 256, y = random() * 256; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + random() * 3 - 1.5, y + random() * 4); ctx.stroke(); }
  const fiber = new THREE.CanvasTexture(fiberCanvas); fiber.wrapS = fiber.wrapT = THREE.RepeatWrapping; fiber.repeat.set(3, 3);
  return {
    ready, pending, failed,
    request(stage: number, detail: 'low' | 'high') {
      const key = `${stage}-${detail}`;
      if (!stage || disposed || ready.has(key) || pending.has(key) || failed.has(key)) return;
      pending.add(key); changed();
      const base = `${import.meta.env.BASE_URL}models/${stems[stage]}`;
      void (async () => {
        try {
          const response = await fetch(`${base}.stats.json`); if (!response.ok) throw new Error('Asset metadata unavailable');
          const stats = await response.json(); if (disposed) return;
          const { scene: source } = await loader.loadAsync(`${base}${detail === 'low' ? '-low' : ''}.glb`);
          if (disposed) { release([source]); return; }
          source.updateMatrixWorld(true);
          const parts: TownAsset['parts'] = [];
          source.traverse(o => {
            if (!(o instanceof THREE.Mesh)) return;
            for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
              if (m instanceof THREE.MeshStandardMaterial) m.envMapIntensity = .45;
              if (detail === 'high' && m instanceof THREE.MeshPhysicalMaterial && m.name.startsWith('Felt')) {
                m.bumpMap = fiber; m.bumpScale = .023; m.sheen = .6; m.sheenRoughness = .9;
              }
            }
            const mesh = new THREE.InstancedMesh(o.geometry, o.material, Math.max(1, capacity));
            mesh.count = 0; mesh.castShadow = mesh.receiveShadow = true;
            mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(mesh);
            parts.push({ mesh, local: o.matrixWorld.clone() });
          });
          ready.set(key, { source, parts, sign: stats.sign });
        } catch { if (!disposed) failed.add(key); }
        finally { pending.delete(key); if (!disposed) changed(); }
      })();
    },
    retry() { failed.clear(); changed(); },
    dispose() {
      disposed = true;
      const objects: THREE.Object3D[] = [];
      for (const asset of ready.values()) { objects.push(asset.source); for (const p of asset.parts) { scene.remove(p.mesh); objects.push(p.mesh); } }
      release(objects); fiber.dispose(); ready.clear();
    },
  };
}
