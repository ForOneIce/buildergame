import * as THREE from 'three';

type Plot = { id: string; x: number; y: number; z: number };
type Mailbox = { proxy: THREE.Mesh; center: THREE.Vector3; slot: THREE.Vector3; available: boolean };
type Flight = { id: string; elapsed: number; gentle: boolean; arrived: boolean; start: THREE.Vector3; control: THREE.Vector3; end: THREE.Vector3 };

/** Visual-only coins. The caller owns the fictional receipt; this helper has no wallet or persistence. */
export function createMailboxDemo(scene: THREE.Scene, camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement, plots: Plot[], reducedMotion: MediaQueryList, onArrival?: (id: string) => void) {
  // Locked stage_details.py: Blender (x,y,z) becomes Three (x,z,-y).
  // Mailbox body (.15,-3.35,1.13); front slot (.15,-3.58,1.15).
  const body = new THREE.Vector3(.15, 1.17, 3.4), slot = new THREE.Vector3(.15, 1.15, 3.59);
  // A centered sphere makes the small mailbox easier to select from every view.
  const proxyGeometry = new THREE.SphereGeometry(.82, 20, 12);
  const proxyMaterial = new THREE.MeshBasicMaterial({ visible: false });
  const boxes = new Map<string, Mailbox>();
  for (const plot of plots) {
    const origin = new THREE.Vector3(plot.x, plot.y, plot.z), center = body.clone().add(origin);
    const proxy = new THREE.Mesh(proxyGeometry, proxyMaterial);
    proxy.position.copy(center); proxy.updateMatrixWorld(); proxy.visible = false;
    proxy.userData = { id: plot.id, action: 'mailbox' };
    // Intentionally outside the scene: ray targets must never affect rendering or AO.
    boxes.set(plot.id, { proxy, center, slot: slot.clone().add(origin), available: false });
  }

  const effects = new THREE.Group(); effects.visible = false; scene.add(effects);
  const coinGeometry = new THREE.CylinderGeometry(.15, .15, .045, 20);
  const coinMaterial = new THREE.MeshStandardMaterial({ color: '#f3bf45', metalness: .65, roughness: .3, emissive: '#9b6718', emissiveIntensity: .15 });
  const coin = new THREE.Mesh(coinGeometry, coinMaterial); coin.castShadow = true; effects.add(coin);
  const rimGeometry = new THREE.TorusGeometry(.118, .012, 5, 24);
  const lightMaterial = new THREE.MeshBasicMaterial({ color: '#fff0a5', transparent: true, depthWrite: false, toneMapped: false });
  const rim = new THREE.Mesh(rimGeometry, lightMaterial); rim.rotation.x = Math.PI / 2; rim.position.y = .025; coin.add(rim);
  const sparkGeometry = new THREE.OctahedronGeometry(.06);
  const sparks = Array.from({ length: 8 }, () => { const mesh = new THREE.Mesh(sparkGeometry, lightMaterial); effects.add(mesh); return mesh; });
  const haloGeometry = new THREE.RingGeometry(.19, .235, 32);
  const haloMaterial = new THREE.MeshBasicMaterial({ color: '#f9dd81', transparent: true, opacity: .7, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const halo = new THREE.Mesh(haloGeometry, haloMaterial); effects.add(halo);
  let flight: Flight | undefined, disposed = false;

  function clear() { flight = undefined; effects.visible = false; }
  function target(id: string) { const box = boxes.get(id); return !disposed && box?.available ? box : undefined; }
  function update(delta: number) {
    if (!flight || disposed) return;
    const current = flight;
    if (!target(current.id)) { clear(); return; }
    current.elapsed += delta;
    const duration = current.gentle ? .24 : 1.18, arrival = current.gentle ? .04 : .86;
    const travel = THREE.MathUtils.clamp(current.elapsed / arrival, 0, 1);
    if (current.gentle) {
      coin.position.copy(current.end).add(new THREE.Vector3(0, .15, .06)); coin.rotation.set(Math.PI / 2, 0, 0); coin.scale.setScalar(.68);
    } else {
      coin.position.copy(current.start).multiplyScalar((1 - travel) ** 2).addScaledVector(current.control, 2 * (1 - travel) * travel).addScaledVector(current.end, travel ** 2);
      coin.rotation.set(Math.PI / 2, travel * Math.PI * 3, travel * .6);
      coin.scale.setScalar(1 - .58 * travel ** 3);
    }
    coin.visible = current.gentle || current.elapsed < arrival;
    const burst = THREE.MathUtils.clamp((current.elapsed - arrival) / (duration - arrival), 0, 1);
    lightMaterial.opacity = current.elapsed < arrival ? 1 : .9 * (1 - burst);
    halo.visible = current.elapsed >= arrival; halo.position.copy(current.end); halo.quaternion.copy(camera.quaternion);
    halo.scale.setScalar(current.gentle ? 1.2 : 1 + burst * 2.5); haloMaterial.opacity = .7 * (1 - burst);
    sparks.forEach((spark, index) => {
      const angle = index * Math.PI / 4;
      spark.visible = current.elapsed >= arrival && (!current.gentle || index % 2 === 0);
      const spread = current.gentle ? .32 : .14 + burst * .7;
      spark.position.copy(current.end).add(new THREE.Vector3(Math.cos(angle) * spread, Math.sin(angle) * spread + .12, .12));
      spark.rotation.z = current.gentle ? angle : angle + burst; spark.scale.setScalar((current.gentle ? .8 : 1) * (1 - burst * .7));
    });
    if (!current.arrived && current.elapsed >= arrival) {
      current.arrived = true; onArrival?.(current.id);
      if (flight !== current || disposed) return;
    }
    if (current.elapsed >= duration) clear();
  }
  return {
    get activeId() { return flight?.id; },
    hitTargets: [...boxes.values()].map(box => box.proxy),
    target(id: string) { return target(id)?.center.clone(); },
    available(id: string, available: boolean) {
      const box = boxes.get(id); if (!box) return;
      box.available = !disposed && available; box.proxy.visible = box.available;
      if (!box.available && flight?.id === id) clear();
    },
    toss(id: string) {
      const box = target(id); if (!box || flight) return false;
      flight = { id, elapsed: 0, gentle: reducedMotion.matches, arrived: false, start: box.slot.clone().add(new THREE.Vector3(.7, 1.15, 1.15)), control: box.slot.clone().add(new THREE.Vector3(.2, 2.2, .7)), end: box.slot.clone() };
      effects.visible = true; update(0); return true;
    },
    points() {
      camera.updateMatrixWorld(); const bounds = canvas.getBoundingClientRect();
      return [...boxes].map(([id, box]) => {
        const point = box.center.clone().project(camera);
        return { id, x: bounds.left + (point.x + 1) * bounds.width / 2, y: bounds.top + (1 - point.y) * bounds.height / 2, visible: !disposed && box.available && point.z >= -1 && point.z <= 1 && Math.abs(point.x) <= 1 && Math.abs(point.y) <= 1 };
      });
    },
    update,
    reset() { clear(); for (const box of boxes.values()) { box.available = false; box.proxy.visible = false; } },
    dispose() {
      if (disposed) return; disposed = true; clear(); scene.remove(effects);
      for (const geometry of [proxyGeometry, coinGeometry, rimGeometry, sparkGeometry, haloGeometry]) geometry.dispose();
      for (const material of [proxyMaterial, coinMaterial, lightMaterial, haloMaterial]) material.dispose();
      boxes.clear();
    },
  };
}
