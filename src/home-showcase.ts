import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {release} from './town-assets';

type ShowcaseOptions={lang?:'en'|'zh';intervalMs?:number};
const stages=[
  {file:'stage-1',en:'Open land',zh:'空地'},
  {file:'stage-2',en:'Foundation',zh:'地基'},
  {file:'stage-3',en:'Timber frame',zh:'木架'},
  {file:'stage-4',en:'Cottage',zh:'小屋'},
  {file:'cozy-house',en:'Garden house',zh:'花园屋'},
];

/** One accepted plot at a time; no town map or extra terrain is generated. */
export function createHomeShowcase(host:HTMLElement,options:ShowcaseOptions={}) {
  const lang=options.lang||'en',t=(en:string,zh:string)=>lang==='en'?en:zh;
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const interval=Math.max(1000,options.intervalMs??3500);
  let disposed=false,playing=!reducedMotion.matches,stage=0,requestedStage=1,generation=0;
  let model:THREE.Group|undefined,request:AbortController|undefined;
  let autoTimer:ReturnType<typeof setTimeout>|undefined,transition:Animation|undefined;

  // Construct the renderer before modifying the host so the caller can provide a fallback.
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setClearColor(0x000000,0);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const canvas=renderer.domElement;canvas.className='showcase-canvas';
  canvas.setAttribute('role','img');canvas.setAttribute('aria-label',t('A repository plot growing through five building stages','仓库地块经历五个建设阶段'));
  canvas.setAttribute('aria-hidden','true');
  host.append(canvas);host.dataset.showcaseReady='loading';host.dataset.stage='0';

  const status=document.createElement('div');status.className='showcase-status';status.setAttribute('role','status');
  const statusCopy=document.createElement('span');statusCopy.textContent=t('Preparing a place to grow…','正在准备生长的地方…');
  const retry=document.createElement('button');retry.type='button';retry.className='showcase-retry button';retry.textContent=t('Retry','重试');retry.hidden=true;
  status.append(statusCopy,retry);host.append(status);

  const controls=document.createElement('div');controls.className='showcase-controls';
  controls.setAttribute('role','group');controls.setAttribute('aria-label',t('Building stages','建设阶段'));
  const stageButtons=stages.map((item,index)=>{
    const button=document.createElement('button');button.type='button';button.className='showcase-stage';
    button.dataset.showcaseStage=String(index+1);button.textContent=String(index+1);
    button.setAttribute('aria-label',t(`Stage ${index+1}: ${item.en}`,`阶段 ${index+1}：${item.zh}`));
    button.setAttribute('aria-pressed','false');button.title=item[lang];
    button.addEventListener('click',()=>showStage(index+1));controls.append(button);return button;
  });
  const toggle=document.createElement('button');toggle.type='button';toggle.className='showcase-toggle';
  const caption=document.createElement('span');caption.className='showcase-caption';
  controls.append(toggle,caption);host.append(controls);

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(32,1,.1,100);
  const hemi=new THREE.HemisphereLight('#fff8e5','#b5ae87',1.25);scene.add(hemi);
  const sun=new THREE.DirectionalLight('#ffeaca',3.2);sun.position.set(-3,10,7);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-7,right:7,top:8,bottom:-7,near:.5,far:25});
  sun.shadow.normalBias=.025;sun.shadow.bias=-.00015;scene.add(sun);
  const fill=new THREE.DirectionalLight('#e2ebff',1.1);fill.position.set(6,5,-4);scene.add(fill);
  const room=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(room,.06);
  scene.environment=environment.texture;scene.environmentIntensity=.28;room.dispose();pmrem.dispose();
  // An invisible shadow receiver keeps the isolated model grounded on the page.
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.ShadowMaterial({color:'#655742',opacity:.17}));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=-.2;shadow.receiveShadow=true;scene.add(shadow);
  const loader=new GLTFLoader();

  function updateControls() {
    host.dataset.playing=String(playing);toggle.textContent=playing?t('Pause','暂停'):t('Play','播放');
    toggle.setAttribute('aria-label',playing?t('Pause building growth','暂停建筑成长'):t('Play building growth','播放建筑成长'));
    stageButtons.forEach((button,index)=>button.setAttribute('aria-pressed',String(index+1===stage)));
    caption.textContent=stage?stages[stage-1][lang]:t('Five stages. One home.','五个阶段，同一个家。');
  }
  function renderFrame(){if(!disposed&&!document.hidden)renderer.render(scene,camera);}
  function resize() {
    if(disposed)return;
    const width=Math.max(1,host.clientWidth),height=Math.max(1,host.clientHeight-controls.offsetHeight-16);
    // Reserve room below the model so the courtyard never overlaps stage controls.
    renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();
    // The largest accepted courtyard defines all five views; a stage change never reframes it.
    const fit=Math.max(1,1/camera.aspect*1.05);
    camera.position.set(13*fit,10.8*fit,16.9*fit);camera.lookAt(0,1.95,0);renderFrame();
  }
  function clearAuto(){clearTimeout(autoTimer);autoTimer=undefined;}
  function schedule() {
    clearAuto();if(disposed||!playing||document.hidden||host.dataset.showcaseReady!=='true')return;
    autoTimer=setTimeout(()=>{autoTimer=undefined;void loadStage(stage%5+1);},interval);
  }
  async function fade(out:boolean) {
    if(reducedMotion.matches||document.hidden||disposed)return;
    const animation=canvas.animate(out?[{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.985)'}]:[{opacity:0,transform:'scale(.985)'},{opacity:1,transform:'scale(1)'}],{duration:out?140:220,easing:'ease-out',fill:'forwards'});
    transition=animation;
    try{await animation.finished;}catch{/* Cancellation is expected on another selection or disposal. */}
    if(transition===animation)transition=undefined;animation.cancel();
  }
  async function loadStage(next:number) {
    if(disposed)return;
    clearAuto();requestedStage=next;const id=++generation;
    request?.abort();transition?.cancel();request=new AbortController();
    host.dataset.showcaseReady='loading';retry.hidden=true;status.hidden=false;
    statusCopy.textContent=t('Preparing this chapter…','正在准备这个阶段…');
    let incoming:THREE.Group|undefined;
    try{
      const response=await fetch(`${import.meta.env.BASE_URL}models/${stages[next-1].file}.glb`,{signal:request.signal});
      if(!response.ok)throw new Error('Building asset unavailable');
      const bytes=await response.arrayBuffer();if(disposed||id!==generation)return;
      incoming=(await loader.parseAsync(bytes,new URL(`${import.meta.env.BASE_URL}models/`,document.baseURI).href)).scene;
      if(disposed||id!==generation){release([incoming]);return;}
      incoming.traverse(object=>{
        if(!(object instanceof THREE.Mesh))return;
        object.castShadow=object.receiveShadow=true;
        for(const material of Array.isArray(object.material)?object.material:[object.material]){
          if(material instanceof THREE.MeshStandardMaterial){material.envMapIntensity=.45;if(material.map)material.map.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);}
          if(material instanceof THREE.MeshPhysicalMaterial&&material.name.startsWith('Felt')){material.sheen=.6;material.sheenRoughness=.9;}
        }
      });
      if(model)await fade(true);
      if(disposed||id!==generation){release([incoming]);return;}
      const previous=model;model=incoming;scene.add(model);if(previous){scene.remove(previous);release([previous]);}
      stage=next;host.dataset.stage=String(stage);updateControls();renderFrame();
      if(previous)await fade(false);
      if(disposed||id!==generation)return;
      host.dataset.showcaseReady='true';status.hidden=true;schedule();
    }catch(error){
      if(incoming&&incoming!==model)release([incoming]);
      if(disposed||id!==generation||(error instanceof DOMException&&error.name==='AbortError'))return;
      host.dataset.showcaseReady='error';statusCopy.textContent=t('This stage could not load. Choose another or retry.','这个阶段加载失败，请切换其他阶段或重试。');retry.hidden=false;
    }
  }
  function pause(){playing=false;clearAuto();updateControls();}
  function resume(){if(disposed)return;playing=true;updateControls();if(host.dataset.showcaseReady==='error')void loadStage(requestedStage);else schedule();}
  function showStage(next:number){if(!Number.isInteger(next)||next<1||next>5||disposed)return;pause();if(stage===next&&host.dataset.showcaseReady==='true')return;void loadStage(next);}
  function visibility(){if(document.hidden){clearAuto();transition?.finish();}else{renderFrame();schedule();}}
  function motionPreference(){if(reducedMotion.matches){pause();transition?.finish();}}
  toggle.addEventListener('click',()=>playing?pause():resume());retry.addEventListener('click',()=>void loadStage(requestedStage));
  document.addEventListener('visibilitychange',visibility);reducedMotion.addEventListener('change',motionPreference);
  const observer=new ResizeObserver(resize);observer.observe(host);resize();updateControls();void loadStage(1);

  return {
    pause,resume,showStage,
    dispose(){
      if(disposed)return;disposed=true;++generation;clearAuto();request?.abort();transition?.cancel();
      observer.disconnect();document.removeEventListener('visibilitychange',visibility);reducedMotion.removeEventListener('change',motionPreference);
      if(model)release([model]);release([shadow]);sun.shadow.dispose();environment.dispose();renderer.dispose();
      canvas.remove();status.remove();controls.remove();
      delete host.dataset.stage;delete host.dataset.showcaseReady;delete host.dataset.playing;
    },
  };
}
