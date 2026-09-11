const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
  fs.mkdirSync('private/qa',{recursive:true});
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_BIN||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];let deliberateFailure=false;
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!deliberateFailure)errors.push(m.text());});
  await page.goto('http://127.0.0.1:5173/visual.html',{waitUntil:'domcontentloaded'});
  const ready=stage=>page.locator(`#studio[data-ready="true"][data-stage="${stage}"]`).waitFor({timeout:60000});
  await ready(5);await page.locator('#motion').uncheck();
  const sizes=[];
  for(const stage of [5,1,2,3,4]){
    await page.locator('#stage').selectOption(String(stage));await ready(stage);
    sizes.push(await page.locator('#studio').evaluate(el=>({stage:el.dataset.stage,tile:el.dataset.tile,signWidth:el.dataset.signWidth,triangles:el.dataset.triangles})));
    await page.screenshot({path:`private/qa/stage-${stage}.png`});
    await page.locator('#reference-button').click();
    assert.match(await page.locator('#reference-panel img').getAttribute('alt'),new RegExp(`Stage ${stage}`));
    await page.keyboard.press('Escape');
  }
  assert.equal(sizes[0].tile,'9.4x9.4');assert.ok(Number(sizes[0].signWidth)>Number(sizes[1].signWidth));
  for(const s of sizes.slice(1))assert.equal(s.tile,'7.25x6.9');
  await page.locator('#language').click();assert.match(await page.locator('h1').innerText(),/蓝色/);await page.locator('#language').click();
  // Older slow loads must never replace the most recently selected stage.
  let delayedResolve;const delayedDone=new Promise(r=>delayedResolve=r);
  await page.route('**/models/stage-2.glb',async route=>{await new Promise(r=>setTimeout(r,800));await route.continue();delayedResolve();});
  const delayedRequest=page.waitForRequest('**/models/stage-2.glb');
  await page.locator('#stage').selectOption('2');await delayedRequest;
  await page.locator('#stage').selectOption('5');await ready(5);await delayedDone;
  await page.waitForTimeout(500);assert.equal(await page.locator('#studio').getAttribute('data-stage'),'5');
  await page.unroute('**/models/stage-2.glb');
  // Exercise retry on a deliberately unavailable local asset.
  deliberateFailure=true;await page.route('**/models/stage-1.stats.json',route=>route.fulfill({status:503,body:'Test unavailable'}));
  await page.locator('#stage').selectOption('1');await page.locator('#studio[data-ready="error"]').waitFor();
  assert.equal(await page.locator('#retry').isVisible(),true);
  await page.unroute('**/models/stage-1.stats.json');await page.locator('#retry').click();await ready(1);deliberateFailure=false;
  await page.locator('#stage').selectOption('5');await ready(5);
  await page.locator('[data-view="sign"]').click();await page.screenshot({path:'private/qa/stage-5-sign.png'});
  await page.setViewportSize({width:390,height:844});await page.locator('[data-view="hero"]').click();
  await page.locator('#stage').selectOption('3');await ready(3);
  await page.screenshot({path:'private/qa/stages-mobile.png',fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:['five real GLBs','expanded tile/sign','matching references','localized stage copy','last selection wins','failure retry','sign close-up','mobile stage selection'],sizes,errors},null,2));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
