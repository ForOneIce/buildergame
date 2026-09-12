const{chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
async function townReady(page){await page.locator('#scene[data-town-ready="true"]').waitFor({timeout:60000});await page.locator('#map-transition').waitFor({state:'hidden',timeout:60000});}
async function tour(page,mode){
 assert.equal(await page.locator('#manage').count(),0,'Sample tours replace Town settings');
 if(!await page.locator('.sample-tour-picker').evaluate(element=>element.open))await page.locator('.sample-tour-picker > summary').click();
 assert.equal(await page.locator('[data-tour-landscape]').count(),3);
 await page.locator(`[data-tour-landscape="${mode}"]`).click();await townReady(page);
 if(await page.locator('.sample-tour-picker').evaluate(element=>element.open))await page.locator('.sample-tour-picker > summary').click();
}
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{fs.mkdirSync('private/qa',{recursive:true});const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
// These journeys use fictional data and mocked account transport, never GitHub credentials.
await page.route('**/api/session',route=>route.fulfill({json:{configured:false,playerConfigured:false,authenticated:false,isDeployer:false,login:null,avatar:null}}));
await page.route('**/api/town',route=>route.fulfill({json:null}));
for(const mode of ['flat','valley','clouds']){
 await page.goto('http://127.0.0.1:5173/',{waitUntil:'domcontentloaded'});await page.locator('[data-enter]').click();await townReady(page);await tour(page,mode);
 await townReady(page);assert.equal(await page.locator('#scene').getAttribute('data-landscape'),mode);
 await page.screenshot({path:`private/qa/map-${mode}.png`});
 await page.locator('#next-project').click();await page.locator('#detail[open]').waitFor();assert.ok((await page.locator('#detail-title').textContent()).trim());assert.equal(await page.locator('#detail [data-visit]').isDisabled(),true);assert.equal(await page.locator('#detail .card-metrics').count(),0);await page.screenshot({path:`private/qa/info-${mode}.png`});await page.locator('#close').click();
 assert.match(await page.locator('#visited-count').textContent(),/^1 \/ 9$/);await page.locator('#timeline').fill('0');await page.locator('#timeline').dispatchEvent('input');await townReady(page);assert.equal(await page.locator('#scene').getAttribute('data-landscape'),mode);
 assert.equal(await page.locator('#language, #player-login, #logout, [data-export]').count(),0,'Sample HUD omits account, language and export actions');
 await page.locator('#home').click();await page.locator('#language').click();await page.locator('[data-enter]').click();await townReady(page);assert.match(await page.locator('.exploration-panel').innerText(),/你的探索/);
 await page.locator('#home').click();await page.locator('#language').click();await page.locator('[data-enter]').click();await townReady(page);
}
await page.goto('http://127.0.0.1:5173/');await page.locator('[data-enter]').click();await townReady(page);await tour(page,'flat');assert.match(await page.locator('#visited-count').textContent(),/^1 \/ 9$/);
await page.setViewportSize({width:390,height:844});await page.locator('#reset').click();await page.waitForTimeout(400);await page.screenshot({path:'private/qa/map-mobile.png'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
assert.equal(await page.getByRole('button',{name:'Projects',exact:true}).getAttribute('id'),'show-projects');
assert.equal(await page.locator('#player-login').count(),0);assert.equal(await page.locator('#explorer-profile').isVisible(),true,'Sample explorer profile remains available on mobile');
await page.locator('#show-projects').click();await page.locator('[data-project="sample-8"]').click();await page.screenshot({path:'private/qa/info-mobile.png'});await page.locator('#close').click();
await page.locator('#home').click();await page.locator('[data-create]').click();await page.locator('[data-mode="hackathon"]').click();await page.locator('[data-landscape-choice="valley"]').click();await page.locator('#town-name').fill('Valley example');await page.locator('#repositories').fill('https://github.com/example/project');
assert.equal(await page.locator('.config-backup').evaluate(element=>element.open),false);await page.locator('.config-backup > summary').click();
const download=page.waitForEvent('download');await page.locator('#export-config').click();await(await download).saveAs('private/qa/valley.config.json');assert.equal(require('../private/qa/valley.config.json').landscape,'valley');

const {sampleTown}=await import('../src/sample.mjs');
function fictionalFixture(count,id){
 const fixture=sampleTown();fixture.event.id=id;fixture.event.name='Fictional integration fixture';fixture.event.sampleData=false;
 fixture.event.projects=fixture.event.projects.slice(0,count);fixture.history.eventId=id;fixture.history.sampleData=false;
 fixture.history.snapshots.forEach(snapshot=>snapshot.projects=snapshot.projects.slice(0,count));
 return fixture;
}
const legacy=fictionalFixture(1,'legacy-test-fixture');
// Legacy backups predate the landscape field. A previously selected mode must not leak into their locked settings.
for(const selectedMode of ['valley','clouds']){
 await page.locator(`[data-landscape-choice="${selectedMode}"]`).click();
 await page.locator('#import').setInputFiles({name:'legacy.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(legacy))});
 await townReady(page);assert.equal(await page.locator('#scene').getAttribute('data-landscape'),'flat');
 if(selectedMode==='valley'){
  // A one-project town puts its sole clickable plot at the center of the minimap.
  const bounds=await page.locator('#minimap').boundingBox();assert.ok(bounds);
  await page.locator('#minimap').click({position:{x:bounds.width/2,y:bounds.height/2}});
  await page.locator('#detail[open]').waitFor();assert.equal(await page.locator('#detail-title').innerText(),'Open Orchard');
  assert.equal(await page.locator('#visited-count').textContent(),'1 / 1');await page.locator('#close').click();
 }
 assert.equal(await page.locator('.sample-tour-picker').count(),0,'Real towns retain settings instead of sample tours');assert.equal(await page.locator('#language, #player-login, .map-nav [data-export]').count(),3,'Imported real towns retain language, account and export actions');await page.locator('#manage').click();assert.equal(await page.locator('#landscape').inputValue(),'flat');assert.equal(await page.locator('#landscape').isDisabled(),true);
 await page.locator('#home').click();await page.locator('[data-create]').click();await page.locator('[data-mode="hackathon"]').click();
}
await page.close();

// Start a fresh browser context: account progress must merge valid unsynced local visits with server visits.
const playerPage=await browser.newPage({viewport:{width:1440,height:1000}});playerPage.on('pageerror',e=>errors.push(e.message));
const playerTown=fictionalFixture(5,'player-test-fixture');
const avatar='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#5269aa"/></svg>');
const remoteVisits=new Set(['sample-1']),postedVisits=[];
function deferred(){let resolve;const promise=new Promise(done=>resolve=done);return{promise,resolve};}
const heldPosts=new Map(['sample-3','sample-4'].map(id=>[id,{arrived:deferred(),release:deferred()}]));
async function waitForHeld(id){
 let timer;try{await Promise.race([heldPosts.get(id).arrived.promise,new Promise((_,reject)=>timer=setTimeout(()=>reject(Error(`Upload did not arrive for ${id}`)),10000))]);}finally{clearTimeout(timer);}
}
await playerPage.route('**/api/session',route=>route.fulfill({json:{configured:false,playerConfigured:true,authenticated:true,isDeployer:false,login:'test-explorer',avatar}}));
await playerPage.route('**/api/town',route=>route.fulfill({json:playerTown}));
await playerPage.route('**/api/progress**',async route=>{
 if(route.request().method()==='POST'){
  const input=route.request().postDataJSON();assert.equal(input.townId,playerTown.event.id);
  assert.ok(playerTown.event.projects.some(project=>project.id===input.projectId));
  postedVisits.push(input.projectId);
  const held=heldPosts.get(input.projectId);if(held){held.arrived.resolve();await held.release.promise;}
  remoteVisits.add(input.projectId);
 }else assert.equal(new URL(route.request().url()).searchParams.get('town'),playerTown.event.id);
 await route.fulfill({json:{visited:[...remoteVisits]}});
});
await playerPage.addInitScript(()=>localStorage.setItem('bg-exploration:player-test-fixture:test-explorer',JSON.stringify(['sample-0'])));
await playerPage.goto('http://127.0.0.1:5173/?town=1',{waitUntil:'domcontentloaded'});
await townReady(playerPage);
await playerPage.getByText('Synced to your GitHub player profile',{exact:true}).waitFor();
assert.equal(await playerPage.locator('#player-login strong').innerText(),'test-explorer');
assert.equal(await playerPage.locator('#language, #logout, .map-nav [data-export]').count(),3,'Authenticated real-town actions remain available');
assert.equal(await playerPage.locator('#player-login img').getAttribute('src'),avatar);
assert.equal(await playerPage.locator('#explorer-avatar img').getAttribute('src'),avatar);
assert.equal(await playerPage.locator('#visited-count').innerText(),'2 / 5');assert.deepEqual(postedVisits,['sample-0']);
await playerPage.locator('#next-project').click();await playerPage.locator('#detail[open]').waitFor();
assert.equal(await playerPage.locator('#detail-title').innerText(),'Cloud Notes');
await playerPage.getByText('Synced to your GitHub player profile',{exact:true}).waitFor();
assert.equal(await playerPage.locator('#visited-count').innerText(),'3 / 5');assert.deepEqual(postedVisits,['sample-0','sample-2']);
await playerPage.locator('#close').click();

// A second visit made during a pending upload must join the queue without reporting an early sync.
await playerPage.locator('#next-project').click();await waitForHeld('sample-3');
assert.equal(await playerPage.locator('#detail-title').innerText(),'Garden Kit');await playerPage.locator('#close').click();
await playerPage.locator('#next-project').click();assert.equal(await playerPage.locator('#detail-title').innerText(),'Kindred');
assert.equal(await playerPage.locator('#visited-count').innerText(),'5 / 5');
assert.equal(await playerPage.locator('#progress-status').innerText(),'Saved on this device');
assert.deepEqual(postedVisits,['sample-0','sample-2','sample-3']);
assert.equal(remoteVisits.has('sample-3'),false);assert.equal(remoteVisits.has('sample-4'),false);
heldPosts.get('sample-3').release.resolve();await waitForHeld('sample-4');
assert.equal(await playerPage.locator('#progress-status').innerText(),'Saved on this device');
assert.equal(remoteVisits.has('sample-3'),true);assert.equal(remoteVisits.has('sample-4'),false);
heldPosts.get('sample-4').release.resolve();
await playerPage.getByText('Synced to your GitHub player profile',{exact:true}).waitFor();
assert.deepEqual(postedVisits,['sample-0','sample-2','sample-3','sample-4']);
assert.ok(remoteVisits.has('sample-3')&&remoteVisits.has('sample-4'));
const stored=await playerPage.evaluate(()=>JSON.parse(localStorage.getItem('bg-exploration:player-test-fixture:test-explorer')));
assert.ok(stored.includes('sample-3')&&stored.includes('sample-4'));
await playerPage.reload({waitUntil:'domcontentloaded'});await playerPage.locator('[data-enter]').first().click();await townReady(playerPage);
await playerPage.getByText('Synced to your GitHub player profile',{exact:true}).waitFor();assert.equal(await playerPage.locator('#visited-count').innerText(),'5 / 5');
await playerPage.setViewportSize({width:390,height:844});
assert.equal(await playerPage.getByRole('button',{name:'Sync exploration for test-explorer',exact:true}).getAttribute('id'),'player-login');
await playerPage.close();
// A signed-in visitor still gets the simplified sample HUD and their explorer avatar.
const samplePlayer=await browser.newPage({viewport:{width:390,height:844}});samplePlayer.on('pageerror',e=>errors.push(e.message));
await samplePlayer.route('**/api/session',route=>route.fulfill({json:{configured:false,playerConfigured:true,authenticated:true,isDeployer:false,login:'test-explorer',avatar}}));
await samplePlayer.route('**/api/town',route=>route.fulfill({json:null}));
await samplePlayer.route('**/api/progress**',route=>route.fulfill({json:{visited:[]}}));
await samplePlayer.goto('http://127.0.0.1:5173/',{waitUntil:'domcontentloaded'});await samplePlayer.locator('#logout').waitFor();
await samplePlayer.locator('[data-enter]').click();await townReady(samplePlayer);
assert.equal(await samplePlayer.locator('main.sample-town').count(),1);
assert.equal(await samplePlayer.locator('#language, #player-login, #logout, [data-export]').count(),0,'Sample header omits account actions even when signed in');
assert.equal(await samplePlayer.locator('#explorer-profile').isVisible(),true);assert.equal(await samplePlayer.locator('#explorer-avatar img').getAttribute('src'),avatar);
assert.deepEqual(errors,[]);console.log('Three landscapes, sample-only HUD for guest and signed-in visitors, homepage language route, mobile explorer access, reference card, guest progress, real-town auth/export controls, legacy landscape, minimap and queued player synchronization passed.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
