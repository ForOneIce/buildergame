const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_BIN||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],results=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/__town-test',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="en"><body style="margin:0"><div id="town" style="position:relative;width:100vw;height:100vh"></div></body></html>'}));
  await page.goto('http://127.0.0.1:5173/__town-test');
  await page.evaluate(async()=>{
    const source=await (await fetch('/src/town.ts')).text();
    const THREE=await import(source.match(/from "([^"]*three.js[^"]*)"/)[1]);
    THREE.Scene.prototype.onBeforeRender=function(renderer,scene,camera){if(scene.environment){window.qaScene=scene;window.qaCamera=camera;}};
    window.createTown=(await import('/src/town.ts')).createTown;window.town=null;
    window.makeTown=count=>{
      window.town?.dispose();window.hits=[];
      window.projects=Array.from({length:count},(_,i)=>({id:`p${i}`,name:`Project ${i+1}`,description:'A fictional project for visual scale verification.',repository:`https://github.com/example/project-${i}`,plot:{x:i%Math.ceil(Math.sqrt(count)),z:Math.floor(i/Math.ceil(Math.sqrt(count)))},builder:{name:`Builder ${i+1}`}}));
      window.snapshot={id:'all-stages',projects:window.projects.map((p,i)=>({projectId:p.id,stage:['land','foundation','frame','cottage','decorated'][i%5]}))};
      window.town=window.createTown(document.querySelector('#town'),window.projects,(id,open)=>window.hits.push({id,open}));window.town.update(window.snapshot);
    };
  });
  const ready=()=>page.locator('#town[data-town-ready="true"]').waitFor({timeout:60000});
  for(const count of [12,50,200]){
    await page.evaluate(n=>window.makeTown(n),count);await page.waitForTimeout(200);await ready();await page.waitForTimeout(1500);
    const fps=await page.evaluate(()=>new Promise(resolve=>{let frames=0;const start=performance.now();function tick(now){frames++;if(now-start<2200)requestAnimationFrame(tick);else resolve(Math.round(frames*1000/(now-start)));}requestAnimationFrame(tick);}));
    results.push({count,fps,...await page.locator('#town').evaluate(e=>({...e.dataset}))});
    await page.screenshot({path:`private/qa/town-${count}.png`});
  }
  await page.evaluate(()=>window.town.focus('p4'));await page.waitForTimeout(200);await ready();await page.waitForTimeout(800);
  assert.ok(Number(await page.locator('#town').getAttribute('data-high-detail'))<=6);
  await page.screenshot({path:'private/qa/town-200-close.png'});
  // Project signs and building proxies retain distinct actions after instancing.
  const sign=await page.evaluate(()=>{let s;window.qaScene.traverse(o=>{if(o.userData.id==='p4'&&o.userData.action==='details')s=o;});const p=s.getWorldPosition(s.position.clone()).project(window.qaCamera);return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2};});
  await page.mouse.click(sign.x,sign.y);assert.deepEqual(await page.evaluate(()=>window.hits.at(-1)),{id:'p4',open:false});
  const door=await page.evaluate(()=>{const p=window.qaCamera.position.clone().set(window.projects[4].plot.x*12-1.25,1.7,window.projects[4].plot.z*12+1.6).project(window.qaCamera);return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2};});
  await page.mouse.click(door.x,door.y);assert.deepEqual(await page.evaluate(()=>window.hits.at(-1)),{id:'p4',open:true});
  const before=await page.evaluate(()=>window.hits.length);await page.mouse.move(700,600);await page.mouse.down();await page.mouse.move(820,630,{steps:10});await page.mouse.up();assert.equal(await page.evaluate(()=>window.hits.length),before);
  // A delayed obsolete asset must not restore the old snapshot.
  await page.route('**/models/stage-1-low.glb',async route=>{await new Promise(r=>setTimeout(r,700));await route.continue();});
  const request=page.waitForRequest('**/models/stage-1-low.glb');await page.evaluate(()=>window.makeTown(12));await request;
  await page.evaluate(()=>window.town.update({id:'latest',projects:window.projects.map(p=>({projectId:p.id,stage:'decorated'}))}));await page.waitForTimeout(1400);await ready();
  assert.equal(await page.locator('#town').getAttribute('data-stages'),Array(12).fill(5).join(','));
  await page.unroute('**/models/stage-1-low.glb');
  await page.route('**/models/stage-1-low.glb',route=>route.fulfill({status:503,body:'Deliberate test failure'}));
  await page.evaluate(()=>window.makeTown(1));await page.locator('#town[data-town-ready="error"]').waitFor({timeout:60000});
  await page.unroute('**/models/stage-1-low.glb');await page.getByRole('button',{name:'Retry'}).click();await ready();
  await page.evaluate(()=>window.town.update({id:'unknown',projects:[{projectId:'p0',stage:null}]}));await page.waitForTimeout(200);
  assert.equal(await page.locator('#town').getAttribute('data-stages'),'0');assert.match(await page.locator('.town-load').innerText(),/awaiting data/);
  // Disposal during requests must not recreate canvases or install late geometry.
  await page.evaluate(()=>{window.makeTown(12);window.town.dispose();});await page.waitForTimeout(1000);
  assert.equal(await page.locator('#town canvas').count(),0);assert.deepEqual(errors,[]);
  fs.writeFileSync('private/qa/town-performance.json',JSON.stringify({results,errors},null,2));console.log(JSON.stringify({results,passed:['sign and building actions','drag does not visit','latest snapshot wins','failure retry','unknown marker','pending disposal'],errors},null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
