const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const baseUrl = process.env.DEMO_URL || 'http://127.0.0.1:5173/';

(async () => {
  fs.mkdirSync('private/qa', { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'no-preference' });
  const page = await context.newPage(), errors = [], checked = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.route('**/__cursor-fixture', r => r.fulfill({ contentType: 'text/html', body: `<style>body{margin:0}#scene{position:fixed;inset:0}</style><div id="scene"></div><script type="module">
      import '/src/ui/theme.css';
      import {createTown} from '/src/town.ts';
      import {sampleTown} from '/src/sample.mjs';
      import * as THREE from '/node_modules/three/build/three.module.js';
      const base=sampleTown(),project=base.event.projects[0],picks=[],deliveries=[];
      project.builder.avatar='';
      const api=createTown(document.querySelector('#scene'),[project],(id,open)=>picks.push({id,open}),'flat',{mailboxDemo:true,onMailbox:id=>deliveries.push(id)});
      const snapshot=structuredClone(base.history.snapshots[0]);snapshot.projects=[{...snapshot.projects[0],stage:'decorated'}];
      window.fixture={api,snapshot,project,picks,deliveries,THREE};api.update(snapshot);
    </script>` }));
    await page.goto(new URL('__cursor-fixture', baseUrl).href);
    await page.locator('#scene[data-town-ready="true"]').waitFor({ timeout: 60000 });
    await page.waitForFunction(() => window.fixture.api.mailboxPoints().some(p => p.visible));
    await page.evaluate(() => fixture.api.focusMailbox(fixture.project.id));
    await page.waitForTimeout(200);
    const points = await page.evaluate(async () => {
      const { api, THREE } = fixture, origin = api.mapPoints[0], center = new THREE.Vector3(origin.x + .15, origin.y + 1.17, origin.z + 3.4);
      const camera = new THREE.PerspectiveCamera(36, innerWidth / innerHeight, .2, 3000);
      camera.position.copy(center).add(new THREE.Vector3(4.1,3.6,6.4));camera.lookAt(center);camera.updateMatrixWorld();
      const project = world => { const p=world.clone().project(camera); return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2}; };
      const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0);
      const ring = project(center.clone().addScaledVector(right,.62));
      const ray = new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(ring.x/innerWidth*2-1,1-ring.y/innerHeight*2),camera);
      const old = new THREE.Mesh(new THREE.BoxGeometry(.68,.62,.68),new THREE.MeshBasicMaterial());old.position.copy(center);old.updateMatrixWorld();
      const oldIntersections=ray.intersectObject(old,false).length;old.geometry.dispose();old.material.dispose();
      const stats=await fetch('/models/cozy-house.stats.json').then(r=>r.json());
      return { center:api.mailboxPoints()[0],ring,oldIntersections,
        door:project(new THREE.Vector3(origin.x-.5,origin.y+2.4,origin.z+2)),
        sign:project(new THREE.Vector3(...stats.sign.position).add(new THREE.Vector3(origin.x,origin.y,origin.z))) };
    });
    assert.equal(points.oldIntersections, 0, 'The selected ring point lies outside the previous box proxy');
    const cursor = () => page.locator('#scene canvas').getAttribute('data-cursor');
    await page.mouse.move(points.ring.x,points.ring.y); assert.equal(await cursor(),'coin');
    const computed = await page.locator('#scene canvas').evaluate(e=>getComputedStyle(e).cursor);
    assert.match(computed,/coin\.svg.*5 3/);
    assert.match(await page.evaluate(()=>fetch('/ui/cursors/coin.svg').then(r=>r.text())),/width="48" height="48"/);
    checked.push('Expanded mailbox sphere accepts a real pointer ray outside the old proxy; computed cursor uses 48px SVG and 5/3 hotspot');
    await page.mouse.down();assert.equal(await cursor(),'coin');
    await page.mouse.up();assert.equal(await cursor(),'coin');
    await page.mouse.move(points.ring.x+4,points.ring.y+2);assert.equal(await cursor(),'coin');
    await page.waitForTimeout(100);assert.equal(await cursor(),'coin');
    await page.screenshot({path:'private/qa/mailbox-expanded-flight.png'});
    await page.waitForFunction(()=>fixture.deliveries.length===1);
    assert.deepEqual(await page.evaluate(()=>fixture.picks),[]);
    checked.push('Gold cursor persists through pointerdown, release, nearby movement and active flight; exactly one delivery without project-card/door action');
    await page.waitForTimeout(600);
    await page.mouse.move(points.door.x,points.door.y);assert.equal(await cursor(),'visit');
    await page.mouse.click(points.door.x,points.door.y);
    assert.equal(await page.evaluate(()=>fixture.picks.at(-1)?.open),true);
    await page.mouse.move(points.sign.x,points.sign.y);assert.equal(await cursor(),'grab');
    await page.mouse.click(points.sign.x,points.sign.y);
    assert.equal(await page.evaluate(()=>fixture.picks.at(-1)?.open),false);
    checked.push('Expanded proxy preserves distinct door visit and sign details targets');
    await page.mouse.move(points.center.x,points.center.y);await page.mouse.down();
    await page.mouse.move(points.center.x+22,points.center.y+22);assert.equal(await cursor(),'grabbing');
    await page.mouse.up();assert.equal(await cursor(),'walk');
    assert.equal(await page.evaluate(()=>fixture.deliveries.length),1,'A drag creates no delivery');
    await page.evaluate(()=>fixture.api.focusMailbox(fixture.project.id));await page.waitForTimeout(150);
    const center=await page.evaluate(()=>fixture.api.mailboxPoints()[0]);
    await page.mouse.move(center.x,center.y);await page.mouse.down();
    await page.locator('#scene canvas').dispatchEvent('pointercancel',{pointerId:1});
    assert.equal(await cursor(),'walk');await page.mouse.up();
    assert.equal(await page.evaluate(()=>fixture.deliveries.length),1);
    checked.push('Real drag clears to walk on release; cancel fixture clears cursor and cannot deliver');
    await page.evaluate(()=>{fixture.api.tossCoin(fixture.project.id);fixture.snapshot.id='cancel-stage';fixture.snapshot.projects[0].stage='land';fixture.api.update(fixture.snapshot);});
    assert.equal(await cursor(),'walk');
    assert.equal(await page.evaluate(()=>fixture.api.mailboxPoints().filter(p=>p.visible).length),0);
    await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>fixture.deliveries.length),1);
    await page.evaluate(()=>fixture.api.dispose());
    assert.equal(await page.locator('#scene canvas').count(),0);assert.deepEqual(errors,[]);
    checked.push('Snapshot switch disables mailbox and cancels in-flight receipt; scene disposal removes canvas');
    const report={checked,browserErrors:errors,boundary:'One actual stage-five GLB through exported scene API, trusted pointer input, projection math proving old-proxy miss. Pointercancel explicitly synthetic; no model changes.'};
    fs.writeFileSync('private/qa/mailbox-cursor-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
  } catch(e) {await page.screenshot({path:'private/qa/mailbox-cursor-failure.png'}).catch(()=>{});throw e;}
  finally{await context.close();await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
