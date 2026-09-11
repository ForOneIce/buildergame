import './visual.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const stages = [
  { name:['Land','空地'], title:['A fresh<br> beginning.','一切的<br>起点。'], intro:['A clearing, a sign, a little possibility.','一块空地，一面木牌，一点可能。'], file:'stage-1', reference:new URL('../design/建筑状态1-空地阶段-3视图.png',import.meta.url).href },
  { name:['Foundation','地基'], title:['Roots in<br> the ground.','稳稳的<br>地基。'], intro:['Stone by stone, a place takes shape.','一块块石头，让想法有了形状。'], file:'stage-2', reference:new URL('../design/建筑状态2-地基阶段-3视图.png',import.meta.url).href },
  { name:['Frame','框架'], title:['Room for<br> possibility.','撑起新的<br>可能。'], intro:['Timber, scaffolds, and a plan unfolding.','木梁、脚手架，与逐步成形的蓝图。'], file:'stage-3', reference:new URL('../design/建筑状态3-框架阶段-3视图.png',import.meta.url).href },
  { name:['Shell','主体'], title:['Under a<br> blue roof.','蓝色屋顶<br>之下。'], intro:['The first little house, ready to welcome.','第一座小屋，准备迎接来访。'], file:'stage-4', reference:new URL('../design/建筑状态4-主体阶段-3视图.png',import.meta.url).href },
  { name:['Complete','完整'], title:['The cozy<br> cottage.','温暖的<br>小小屋。'], intro:['A soft roof, a glowing window.<br>A spacious garden to welcome visitors.','柔软的屋顶，亮着灯的窗。<br>宽敞的庭院，欢迎来访。'], file:'cozy-house', reference:new URL('../design/建筑状态5-完整阶段-3视图.png',import.meta.url).href },
];
let activeStage = 5;
let refreshSign = () => {};
const reference = stages[4].reference;
const root = document.querySelector<HTMLDivElement>('#studio')!;
let lang: 'en' | 'zh' = localStorage.getItem('bg-language') === 'zh' ? 'zh' : 'en';
const t = (en: string, zh: string) => lang === 'en' ? en : zh;
root.innerHTML = `
  <header class="studio-header"><a class="studio-brand" href="./"><span class="brand-icon">⌂</span> buildergame<span class="brand-divider">/</span><span data-en="House studio" data-zh="房屋工作室"></span></a><div class="header-actions"><span class="prototype-tag" data-en="VISUAL PROTOTYPE · 01" data-zh="视觉样板 · 01"></span><button id="language" class="text-button"></button></div></header>
  <main class="studio-main">
    <aside class="studio-note">
      <div class="chapter"><span>05</span><span data-en="A PLACE TO GROW" data-zh="生长的地方"></span></div>
      <h1 data-en="The cozy<br> cottage." data-zh="温暖的<br>小小屋。"></h1>
      <p class="intro" data-en="A soft roof, a glowing window.<br>A little garden worth coming back to." data-zh="柔软的屋顶，亮着灯的窗。<br>一座让人想再回来的小院。"></p>
      <div class="stage-label"><i></i><span data-en="Complete · Stage 5" data-zh="完整建筑 · 第 5 阶段"></span></div>
      <label class="stage-picker"><span data-en="CONSTRUCTION STAGE" data-zh="建设阶段"></span><select id="stage">${stages.map((s,i)=>`<option value="${i+1}" ${i===4?'selected':''} data-en="0${i+1} · ${s.name[0]}" data-zh="0${i+1} · ${s.name[1]}"></option>`).join('')}</select></label>
      <div class="palette"><i style="--swatch:#e8cfa6"></i><i style="--swatch:#b9834b"></i><i style="--swatch:#849048"></i><i style="--swatch:#dd9997"></i><span data-en="Warm & handmade" data-zh="温暖 · 手作感"></span></div>
      <hr>
      <label class="setting-label" for="lighting" data-en="LIGHT & ATMOSPHERE" data-zh="光照与氛围"></label>
      <select id="lighting"><option value="day" data-en="Soft daylight" data-zh="柔和日光"></option><option value="evening" data-en="Golden evening" data-zh="金色傍晚"></option></select>
      <label class="switch-row"><span data-en="Contact shadows" data-zh="接触阴影"></span><input id="ao" type="checkbox" checked></label>
      <label class="switch-row"><span data-en="Windmill motion" data-zh="风车转动"></span><input id="motion" type="checkbox"></label>
      <label class="setting-label quality-label" for="quality" data-en="RENDER QUALITY" data-zh="渲染质量"></label>
      <select id="quality"><option value="high" data-en="Detail" data-zh="精细"></option><option value="low" data-en="Lightweight" data-zh="轻量"></option></select>
      <button id="reference-button" class="reference-button" aria-expanded="false"><span>▧</span><span data-en="Compare the reference" data-zh="对照设计参考图"></span><span>↗</span></button>
      <p class="note-caption" data-en="Five stages. One growing place.<br>Switch stages to compare at the same scale." data-zh="五个阶段，同一处生长的地方。<br>切换阶段，可在同一尺度下对照。"></p>
      <a class="back-link" href="./" data-en="← Back to the town demo" data-zh="← 返回小镇 Demo"></a>
    </aside>
    <section class="studio-viewport" aria-label="Interactive complete-house prototype">
      <div id="canvas-host"></div>
      <div id="load-state" class="load-state" role="status"><span class="spinner"></span><span id="load-copy"></span><button id="retry" hidden data-en="Retry" data-zh="重试"></button></div>
      <div class="scene-caption"><span class="small-dot"></span><span data-en="THE GARDEN COTTAGE" data-zh="花园小屋"></span><span class="scene-number">NO. 001</span></div>
      <div class="scene-help" data-en="Drag to orbit · Scroll to zoom · Right-drag to pan" data-zh="拖动旋转 · 滚轮缩放 · 右键拖动平移"></div>
      <div class="camera-dock" role="group" aria-label="Camera views"><button data-view="hero" aria-pressed="true" data-en="Garden view" data-zh="庭院视角"></button><button data-view="front" aria-pressed="false" data-en="Front" data-zh="正面"></button><button data-view="side" aria-pressed="false" data-en="Side" data-zh="侧面"></button><button data-view="top" aria-pressed="false" data-en="Above" data-zh="俯视"></button><button data-view="close" aria-pressed="false" data-en="Details" data-zh="近看"></button><button id="save" aria-label="Save a screenshot" title="Save a screenshot">↓</button></div>
      <output id="render-stats" class="render-stats"></output>
      <aside id="reference-panel" class="reference-panel" hidden><div><span data-en="DESIGN REFERENCE" data-zh="设计参考图"></span><button id="close-reference" aria-label="Close reference">×</button></div><img src="${reference}" alt="Human-supplied three-view complete cottage reference"><p data-en="Target: thick felt roof, honey-colored wood, a planted courtyard. Prototype fidelity is still under review." data-zh="目标：厚实毛毡屋顶、蜂蜜色木构与丰富庭院。当前样板仍待视觉评审。"></p></aside>
    </section>
  </main>`;
const signButton=document.createElement('button');signButton.dataset.view='sign';signButton.dataset.en='Sign';signButton.dataset.zh='立牌';signButton.setAttribute('aria-pressed','false');root.querySelector('#save')!.before(signButton);

function translate() {
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
  root.querySelectorAll<HTMLElement>('[data-en]').forEach(el => { el.innerHTML = el.dataset[lang]!; });
  root.querySelector('#language')!.textContent = lang === 'en' ? '中文' : 'EN';
  root.querySelector('#load-copy')!.textContent = t('Planting the last flowers…', '正在种下最后几朵花…');
  updateStageCopy();refreshSign();
}
function updateStageCopy() {
  const s=stages[activeStage-1],i=lang==='en'?0:1;
  root.querySelector('.chapter>span:first-child')!.textContent=`0${activeStage}`;
  root.querySelector('h1')!.innerHTML=s.title[i];root.querySelector('.intro')!.innerHTML=s.intro[i];
  root.querySelector('.stage-label span')!.textContent=`${s.name[i]} · ${t('Stage','阶段')} ${activeStage}`;
  const image=root.querySelector<HTMLImageElement>('#reference-panel img')!;image.src=s.reference;image.alt=`Stage ${activeStage} design reference`;
  root.querySelector('.scene-caption>[data-en]')!.textContent=t('THE GARDEN COTTAGE','花园小屋')+` / 0${activeStage}`;
}
translate();
root.querySelector('#language')!.addEventListener('click', () => { lang = lang === 'en' ? 'zh' : 'en'; localStorage.setItem('bg-language',lang); translate(); });
const panel = root.querySelector<HTMLElement>('#reference-panel')!;
const showReference = (show: boolean) => { panel.hidden = !show; root.querySelector('#reference-button')!.setAttribute('aria-expanded', String(show)); };
root.querySelector('#reference-button')!.addEventListener('click', () => showReference(panel.hidden));
root.querySelector('#close-reference')!.addEventListener('click', () => showReference(false));
document.addEventListener('keydown', e => { if(e.key === 'Escape') showReference(false); });

async function start() {
  const host = root.querySelector<HTMLDivElement>('#canvas-host')!;
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(host.clientWidth, host.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.domElement.setAttribute('aria-label', '3D cottage. Drag to orbit, scroll to zoom. Camera buttons are available below.');
  host.append(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#f4f0e7');
  const camera = new THREE.PerspectiveCamera(32, host.clientWidth/host.clientHeight, .1, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = .08; controls.minDistance = 4.5; controls.maxDistance = 35;
  controls.maxPolarAngle = Math.PI*.485; controls.minPolarAngle = .025; controls.target.set(0,1.85,0);
  const hemi = new THREE.HemisphereLight('#fff8e5','#b5ae87',1.25); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#ffeaca',3.2); sun.position.set(-3,10,7); sun.castShadow = true;
  sun.shadow.mapSize.set(1024,1024); sun.shadow.camera.left=-7; sun.shadow.camera.right=7; sun.shadow.camera.top=8; sun.shadow.camera.bottom=-7;
  sun.shadow.camera.near=.5; sun.shadow.camera.far=25; sun.shadow.normalBias=.025; sun.shadow.bias=-.00015; sun.shadow.radius=3; scene.add(sun);
  const fill = new THREE.DirectionalLight('#e2ebff',1.1); fill.position.set(6,5,-4); scene.add(fill);
  const environment = new RoomEnvironment(); const pmrem = new THREE.PMREMGenerator(renderer);
  const environmentTarget = pmrem.fromScene(environment,.06); scene.environment=environmentTarget.texture; scene.environmentIntensity=.28;
  environment.dispose(); pmrem.dispose();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:'#655742',opacity:.20}));
  floor.rotation.x = -Math.PI/2; floor.position.y=-.19; floor.receiveShadow=true; scene.add(floor);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene,camera));
  const ao = new GTAOPass(scene,camera,host.clientWidth,host.clientHeight);
  ao.updateGtaoMaterial({radius:.35,thickness:1,distanceExponent:1.6,distanceFallOff:.9,samples:12});
  ao.blendIntensity=.78; composer.addPass(ao); composer.addPass(new OutputPass());
  let triangles=0, meshes=0;
  let model:THREE.Group|undefined,rotor:THREE.Object3D|undefined,loadId=0,disposed=false;
  // Fine textile surface response is a prototype treatment, not simulated fur.
  const fiberCanvas=document.createElement('canvas'); fiberCanvas.width=fiberCanvas.height=256;
  const ctx=fiberCanvas.getContext('2d')!; ctx.fillStyle='#888';ctx.fillRect(0,0,256,256);
  let seed=913;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<14000;i++){const v=90+Math.floor(rand()*85);ctx.strokeStyle=`rgb(${v},${v},${v})`;const x=rand()*256,y=rand()*256;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+rand()*3-1.5,y+rand()*4);ctx.stroke();}
  const fiberTexture=new THREE.CanvasTexture(fiberCanvas); fiberTexture.wrapS=fiberTexture.wrapT=THREE.RepeatWrapping;fiberTexture.repeat.set(3,3);
  // The sign remains editable independently of the baked asset.
  const signCanvas=document.createElement('canvas');signCanvas.width=1024;signCanvas.height=420;
  const signCtx=signCanvas.getContext('2d')!;
  const signTexture=new THREE.CanvasTexture(signCanvas);signTexture.colorSpace=THREE.SRGBColorSpace;
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.13,.49),new THREE.MeshBasicMaterial({map:signTexture,transparent:true,depthWrite:false}));
  sign.visible=false;scene.add(sign);
  refreshSign=()=>{
    signCtx.clearRect(0,0,1024,420);signCtx.fillStyle='#513c25';signCtx.textAlign='left';
    if(activeStage===5){
      signCtx.fillStyle='#6c7d49';signCtx.beginPath();signCtx.arc(105,104,62,0,Math.PI*2);signCtx.fill();
      signCtx.fillStyle='#fff6de';signCtx.font='bold 48px sans-serif';signCtx.fillText('BG',67,123);
      signCtx.fillStyle='#513c25';signCtx.font='bold 65px Georgia';signCtx.fillText(t('Cozy Cottage','花园小屋'),203,108);
      signCtx.font='32px sans-serif';signCtx.fillText(t('by Buildergame','由 Buildergame 建造'),207,159);
      signCtx.fillRect(48,202,925,2);signCtx.font='34px sans-serif';
      signCtx.fillText(t('A little home for open-source ideas.','给开源想法一个温暖的小家。'),48,267);
      signCtx.font='26px sans-serif';signCtx.fillText(t('PROJECT PREVIEW  /  EVERY BUILDER IS WELCOME','项目展示  /  欢迎每一位建造者'),48,334);
    }else{
      signCtx.textAlign='center';signCtx.font='bold 77px Georgia';signCtx.fillText(t('Cozy Cottage','花园小屋'),512,177);
      signCtx.font='44px sans-serif';signCtx.fillText(stages[activeStage-1].name[lang==='en'?0:1],512,268);
    }
    signTexture.needsUpdate=true;
  };
  function disposeModel(group:THREE.Group){
    const geometry=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
    group.traverse(o=>{if(o instanceof THREE.Mesh){geometry.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const v of Object.values(m))if(v instanceof THREE.Texture&&v!==fiberTexture)textures.add(v);}}});
    geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(tex=>{tex.dispose();if(typeof ImageBitmap!=='undefined'&&tex.source.data instanceof ImageBitmap)tex.source.data.close();});
  }
  async function loadStage(stage:number){
    const id=++loadId,base=`${import.meta.env.BASE_URL}models/${stages[stage-1].file}`;
    const loadState=root.querySelector<HTMLElement>('#load-state')!,retry=root.querySelector<HTMLButtonElement>('#retry')!;
    loadState.hidden=false;retry.hidden=true;root.dataset.ready='loading';
    root.querySelector<HTMLElement>('.spinner')!.hidden=false;
    root.querySelector('#load-copy')!.textContent=t('Building this chapter…','正在搭建这个阶段…');
    let incoming:THREE.Group|undefined;
    try{
      const statsResponse=await fetch(`${base}.stats.json`);if(!statsResponse.ok)throw new Error('Asset metadata unavailable');
      const stats=await statsResponse.json();
      const gltf=await new GLTFLoader().loadAsync(`${base}.glb`);incoming=gltf.scene;
      if(disposed||id!==loadId){disposeModel(incoming);return;}
      triangles=0;meshes=0;
      incoming.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=o.receiveShadow=true;meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;
        for(const m of Array.isArray(o.material)?o.material:[o.material]){if(m instanceof THREE.MeshStandardMaterial){m.envMapIntensity=.45;if(m.map)m.map.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);}
          if(m instanceof THREE.MeshPhysicalMaterial&&m.name.startsWith('Felt')){m.bumpMap=fiberTexture;m.bumpScale=.023;m.sheen=.6;m.sheenRoughness=.9;m.needsUpdate=true;}}
      }});
      if(model){scene.remove(model);disposeModel(model);}model=incoming;scene.add(model);rotor=model.getObjectByName('WindmillRotor');
      sign.geometry.dispose();sign.geometry=new THREE.PlaneGeometry(...stats.sign.size as [number,number]);sign.position.fromArray(stats.sign.position);sign.visible=true;
      activeStage=stage;updateStageCopy();refreshSign();
      const motionInput=root.querySelector<HTMLInputElement>('#motion')!;motionInput.disabled=!rotor;
      loadState.hidden=true;root.dataset.ready='true';root.dataset.stage=String(stage);root.dataset.triangles=String(triangles);root.dataset.meshes=String(meshes);root.dataset.tile=stats.tile.join('x');root.dataset.signWidth=String(stats.sign.size[0]);
      root.querySelector('#render-stats')!.textContent=`${Math.round(triangles/1000)}k tris · ${meshes} meshes`;
    }catch(error){
      if(incoming&&incoming!==model)disposeModel(incoming);
      if(disposed||id!==loadId)return;
      console.error(error);root.dataset.ready='error';root.querySelector<HTMLElement>('.spinner')!.hidden=true;retry.hidden=false;
      root.querySelector('#load-copy')!.textContent=t('This stage could not load. Retry or select another stage.','该阶段加载失败，请重试或选择其他阶段。');
    }
  }
  root.querySelector<HTMLSelectElement>('#stage')!.addEventListener('change',e=>void loadStage(Number((e.target as HTMLSelectElement).value)));
  root.querySelector('#retry')!.addEventListener('click',()=>void loadStage(Number(root.querySelector<HTMLSelectElement>('#stage')!.value)));
  let view='hero';
  function setView(name:string) {
    view=name;
    const aspect=host.clientWidth/host.clientHeight;
    const scale=Math.max(1,1/aspect*1.05);
    controls.target.set(0,1.95,0);
    const positions:Record<string,number[]>={hero:[13,10.8,16.9],front:[0,4.8,22],side:[22,6,0],top:[0,23,.15],close:[5.7,4.2,8.0]};
    const p=positions[name] ?? positions.hero;
    camera.position.set(p[0]*scale,p[1]*scale,p[2]*scale);
    if(name==='close') controls.target.set(-.4,2.6,.4);
    if(name==='sign'){controls.target.copy(sign.position);camera.position.copy(sign.position).add(new THREE.Vector3(.45,.42,5.5*scale));}
    controls.update();
    root.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view===name)));
  }
  setView('hero');
  root.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view!)));
  const motion=root.querySelector<HTMLInputElement>('#motion')!;
  motion.checked=!matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.querySelector<HTMLInputElement>('#ao')!.addEventListener('change',e=>{ao.enabled=(e.target as HTMLInputElement).checked;});
  root.querySelector<HTMLSelectElement>('#lighting')!.addEventListener('change',e=>{
    const evening=(e.target as HTMLSelectElement).value==='evening';
    sun.color.set(evening?'#ffce8b':'#ffeaca');sun.intensity=evening?2.5:3.2;
    sun.position.set(evening?-7:-3,evening?5:10,7);hemi.intensity=evening?.8:1.25;fill.intensity=evening?.65:1.1;
  });
  root.querySelector<HTMLSelectElement>('#quality')!.addEventListener('change',e=>{
    const low=(e.target as HTMLSelectElement).value==='low';
    renderer.setPixelRatio(low?1:Math.min(devicePixelRatio,1.5));composer.setPixelRatio(renderer.getPixelRatio());
    ao.enabled=!low;root.querySelector<HTMLInputElement>('#ao')!.checked=!low;
    renderer.setSize(host.clientWidth,host.clientHeight);composer.setSize(host.clientWidth,host.clientHeight);
  });
  root.querySelector('#save')!.addEventListener('click',()=>{
    composer.render(); renderer.domElement.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='buildergame-cottage.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  });
  const resize=new ResizeObserver(()=>{
    if(host.clientWidth<1 || host.clientHeight<1)return;
    renderer.setSize(host.clientWidth,host.clientHeight);composer.setSize(host.clientWidth,host.clientHeight);
    camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();
  });resize.observe(host);
  void loadStage(5);
  let last=performance.now(),windowStart=last,frames=0;
  const frameTimes:number[]=[];
  const output=root.querySelector<HTMLOutputElement>('#render-stats')!;
  renderer.setAnimationLoop(now=>{
    const elapsed=now-last;last=now;if(document.hidden)return;
    if(rotor&&motion.checked)rotor.rotateOnWorldAxis(new THREE.Vector3(0,0,1),Math.min(elapsed,.1*1000)*.00017);
    controls.update();composer.render();frames++;frameTimes.push(elapsed);if(frameTimes.length>120)frameTimes.shift();
    if(now-windowStart>1500){
      const fps=frames*1000/(now-windowStart);output.textContent=`${Math.round(triangles/1000)}k tris · ${meshes} meshes · ${Math.round(fps)} fps`;
      root.dataset.fps=fps.toFixed(1);root.dataset.frameMs=(frameTimes.reduce((a,b)=>a+b,0)/frameTimes.length).toFixed(1);
      frames=0;windowStart=now;
    }
  });
  const cleanup=()=>{
    if(disposed)return;disposed=true;loadId++;
    renderer.setAnimationLoop(null);resize.disconnect();controls.dispose();composer.dispose();ao.dispose();
    const geometries=new Set<THREE.BufferGeometry>(), materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
    scene.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const value of Object.values(m))if(value instanceof THREE.Texture)textures.add(value);}}});
    geometries.forEach(g=>g.dispose());textures.forEach(tex=>tex.dispose());materials.forEach(m=>m.dispose());environmentTarget.dispose();sun.shadow.dispose();renderer.dispose();
  };
  if(import.meta.hot)import.meta.hot.dispose(cleanup);
  window.addEventListener('pagehide',cleanup,{once:true});
}
start().catch(error=>{
  console.error(error);
  root.querySelector('.spinner')?.remove();
  root.querySelector('#load-copy')!.textContent=t('The 3D preview could not load. Please reload or try a WebGL-capable browser.','3D 预览加载失败，请刷新页面或使用支持 WebGL 的浏览器。');
  root.dataset.ready='error';
});
