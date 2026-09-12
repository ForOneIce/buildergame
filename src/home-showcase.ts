import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {release} from './town-assets';

type ShowcaseOptions={lang?:'en'|'zh';intervalMs?:number};
const stages=['stage-1','stage-2','stage-3','stage-4','cozy-house'];

/** A quiet, automatic illustration using the five accepted building models. */
export function createHomeShowcase(host:HTMLElement,options:ShowcaseOptions={}) {
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const interval=Math.max(1000,options.intervalMs??3500);
  let disposed=false,playing=!reducedMotion.matches,busy=false,stage=0,staticRetries=0;
  let model:THREE.Group|undefined,outgoing:HTMLCanvasElement|undefined;
  let autoTimer:ReturnType<typeof setTimeout>|undefined,transition:Animation|undefined;
  const request=new AbortController(),bytes=new Map<number,Promise<ArrayBuffer>>();

  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setClearColor(0x000000,0);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const canvas=renderer.domElement;canvas.className='showcase-canvas';canvas.setAttribute('aria-hidden','true');
  host.setAttribute('role','img');host.append(canvas);
  host.dataset.showcaseReady='loading';host.dataset.stage='0';host.dataset.playing=String(playing);

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(32,1,.1,100);
  const hemi=new THREE.HemisphereLight('#fff8e5','#b5ae87',1.25);scene.add(hemi);
  const sun=new THREE.DirectionalLight('#ffeaca',3.2);sun.position.set(-3,10,7);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-7,right:7,top:8,bottom:-7,near:.5,far:25});
  sun.shadow.normalBias=.025;sun.shadow.bias=-.00015;scene.add(sun);
  const fill=new THREE.DirectionalLight('#e2ebff',1.1);fill.position.set(6,5,-4);scene.add(fill);
  const room=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(room,.06);
  scene.environment=environment.texture;scene.environmentIntensity=.28;room.dispose();pmrem.dispose();
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.ShadowMaterial({color:'#655742',opacity:.17}));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=-.2;shadow.receiveShadow=true;scene.add(shadow);
  const loader=new GLTFLoader();

  function renderFrame(){if(!disposed&&!document.hidden)renderer.render(scene,camera);}
  function resize() {
    if(disposed)return;
    transition?.finish();outgoing?.remove();outgoing=undefined;
    const width=Math.max(1,host.clientWidth),height=Math.max(1,host.clientHeight);
    renderer.setSize(width,height);camera.aspect=width/height;
    camera.zoom=THREE.MathUtils.clamp(.8+camera.aspect*.25,1.02,1.12);camera.updateProjectionMatrix();
    // One fixed camera preserves the plot's position throughout its growth. 固定视角。
    const fit=Math.max(1,1/camera.aspect*1.05);
    camera.position.set(13*fit,10.8*fit,16.9*fit);camera.lookAt(0,1.95,0);renderFrame();
  }
  function clearAuto(){clearTimeout(autoTimer);autoTimer=undefined;}
  function assetBytes(next:number) {
    let pending=bytes.get(next);
    if(!pending){
      pending=fetch(import.meta.env.BASE_URL+'models/'+stages[next-1]+'.glb',{signal:request.signal})
        .then(response=>{if(!response.ok)throw Error('Building asset unavailable');return response.arrayBuffer();})
        .catch(error=>{bytes.delete(next);throw error;});
      bytes.set(next,pending);
    }
    return pending;
  }
  function schedule(next=stage%5+1) {
    clearAuto();if(disposed||document.hidden||busy)return;
    if(!playing){
      // Quietly recover a failed first load without starting a reduced-motion carousel.
      if(!model&&staticRetries<2)autoTimer=setTimeout(()=>{autoTimer=undefined;++staticRetries;void loadStage(5);},2000*(staticRetries+1));
      return;
    }
    // Fetch ahead while the current building stays on screen. 不用加载文案打断观看。
    void assetBytes(next).catch(()=>{});
    autoTimer=setTimeout(()=>{autoTimer=undefined;void loadStage(next);},interval);
  }
  async function dissolve(previous:HTMLCanvasElement|undefined) {
    if(reducedMotion.matches||document.hidden||disposed){previous?.remove();return;}
    const surface=previous||canvas;
    const animation=surface.animate(previous?[{opacity:1},{opacity:0}]:[{opacity:0},{opacity:1}],{duration:650,easing:'ease-in-out',fill:'forwards'});
    transition=animation;
    try{await animation.finished;}catch{/* Navigation can cancel an in-flight transition. */}
    if(transition===animation)transition=undefined;
    animation.cancel();previous?.remove();if(outgoing===previous)outgoing=undefined;
  }
  async function loadStage(next:number) {
    if(disposed||busy)return;
    busy=true;clearAuto();let incoming:THREE.Group|undefined;
    try{
      const source=await assetBytes(next);if(disposed)return;
      incoming=(await loader.parseAsync(source,new URL(import.meta.env.BASE_URL+'models/',document.baseURI).href)).scene;
      if(disposed){release([incoming]);return;}
      incoming.traverse(object=>{
        if(!(object instanceof THREE.Mesh))return;
        object.castShadow=object.receiveShadow=true;
        for(const material of Array.isArray(object.material)?object.material:[object.material]){
          if(material instanceof THREE.MeshStandardMaterial){material.envMapIntensity=.45;if(material.map)material.map.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);}
          if(material instanceof THREE.MeshPhysicalMaterial&&material.name.startsWith('Felt')){material.sheen=.6;material.sheenRoughness=.9;}
        }
      });
      // Keep a rendered frame above the new scene so a transition never fades to an empty page.
      if(model&&!reducedMotion.matches&&!document.hidden){
        renderFrame();const frame=document.createElement('canvas');frame.width=canvas.width;frame.height=canvas.height;
        const context=frame.getContext('2d');
        if(context){context.drawImage(canvas,0,0);frame.className='showcase-outgoing';frame.setAttribute('aria-hidden','true');host.append(frame);outgoing=frame;}
      }
      const previous=model;model=incoming;scene.add(model);
      if(previous){scene.remove(previous);release([previous]);}
      stage=next;host.dataset.stage=String(stage);host.dataset.showcaseReady='transitioning';renderFrame();
      await dissolve(outgoing);if(disposed)return;
      host.dataset.showcaseReady='true';
    }catch(error){
      if(incoming&&incoming!==model)release([incoming]);
      if(disposed)return;
      bytes.delete(next);
      // A failed stage leaves the last good building visible; the next chapter can still load.
      host.dataset.showcaseReady=model?'true':'error';
    }finally{
      busy=false;if(!disposed)schedule(next%5+1);
    }
  }
  function visibility(){if(document.hidden){clearAuto();transition?.finish();}else{renderFrame();schedule();}}
  function motionPreference(){
    playing=!reducedMotion.matches;host.dataset.playing=String(playing);
    if(playing)schedule();else{clearAuto();transition?.finish();}
  }
  document.addEventListener('visibilitychange',visibility);reducedMotion.addEventListener('change',motionPreference);
  const observer=new ResizeObserver(resize);observer.observe(host);resize();void loadStage(playing?1:5);
  return {
    dispose(){
      if(disposed)return;disposed=true;clearAuto();request.abort();transition?.cancel();bytes.clear();
      observer.disconnect();document.removeEventListener('visibilitychange',visibility);reducedMotion.removeEventListener('change',motionPreference);
      if(model)release([model]);release([shadow]);sun.shadow.dispose();environment.dispose();renderer.dispose();
      canvas.remove();outgoing?.remove();host.removeAttribute('role');
      delete host.dataset.stage;delete host.dataset.showcaseReady;delete host.dataset.playing;
    },
  };
}
