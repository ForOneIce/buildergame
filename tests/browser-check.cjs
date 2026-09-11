const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
(async()=>{
  fs.mkdirSync('private/qa',{recursive:true});
  const browser = await chromium.launch({ headless:true, ...(process.env.BROWSER_BIN?{executablePath:process.env.BROWSER_BIN}:{channel:'chrome'}), args:process.env.BROWSER_RENDERER==='software'?['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[] });
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});
  await page.locator('#island-preview canvas').waitFor();await page.screenshot({path:'private/qa/welcome.png',fullPage:true});
  await page.getByRole('button',{name:'Explore sample town'}).click();await page.locator('#scene canvas').waitFor();
  await page.screenshot({path:'private/qa/town.png'});
  await page.locator('#timeline').fill('0');await page.locator('#timeline').dispatchEvent('input');assert.match(await page.locator('#snapshot-count').innerText(),/1 \/ 3/);
  await page.locator('[data-project="sample-3"]').click();await page.locator('#detail[open]').waitFor();assert.match(await page.locator('#detail-body').innerText(),/Garden Kit/);await page.locator('#close').click();
  const downloadPromise=page.waitForEvent('download');await page.locator('.game-nav [data-export]').click();const download=await downloadPromise;await download.saveAs('private/qa/backup.json');
  const backup=JSON.parse(fs.readFileSync('private/qa/backup.json'));assert.equal(backup.format,'buildergame/v1');assert.equal(backup.history.snapshots.length,3);
  await page.locator('#language').click();assert.match(await page.locator('#project-panel').innerText(),/认识邻居/);assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN');
  await page.locator('#language').click();await page.locator('#home').click();
  await page.locator('[data-mode="hackathon"]').click();await page.locator('#town-name').fill('Test event');await page.locator('#repositories').fill('https://github.com/a/one\nhttps://github.com/b/two');
  await page.screenshot({path:'private/qa/hackathon-setup.png',fullPage:true});
  // Mock only the capture transport; the complete UI and JSON validation remain real.
  await page.route('**/api/capture',async route=>{
    const input=route.request().postDataJSON();const event=input.event;const snapshot={id:'captured-test',label:'Snapshot 1',capturedAt:'2026-09-11T12:00:00Z',projects:event.projects.map(p=>({projectId:p.id,plot:p.plot,status:'fresh',observedAt:'2026-09-11T12:00:00Z',metrics:{commits:10,stars:10,forks:10},score:100,stage:'cottage',rule:event.rule}))};
    await route.fulfill({json:{bundle:{format:'buildergame/v1',event,history:{schemaVersion:1,eventId:event.id,sampleData:false,snapshots:[snapshot]}},failures:[],published:false}});
  });
  await page.locator('#capture').click();await page.getByRole('heading',{name:'Your town is ready.'}).waitFor();await page.getByRole('button',{name:'Enter my town'}).click();assert.match(await page.locator('.game-title').innerText(),/Test event/);
  await page.reload({waitUntil:'networkidle'});await page.getByRole('button',{name:'Enter the town'}).click();assert.match(await page.locator('.game-title').innerText(),/Test event/);
  await page.locator('#home').click();await page.locator('#import').setInputFiles('private/qa/backup.json');await page.locator('#scene canvas').waitFor();assert.match(await page.locator('#snapshot-count').innerText(),/3 \/ 3/);
  await page.locator('#home').click();await page.locator('[data-mode="personal"]').click();
  await page.route('**/api/repos?**',route=>route.fulfill({json:{owner:'tester',nextPage:null,repositories:[{repository:'https://github.com/tester/project',name:'project',description:'Public example',builder:{name:'tester',url:'https://github.com/tester'}}]}}));
  await page.locator('#username').fill('tester');await page.locator('#load-repos').click();await page.locator('[data-repo]').check();await page.locator('#town-name').fill('My portfolio');await page.locator('#capture').click();await page.getByRole('heading',{name:'Your town is ready.'}).waitFor();
  await page.setViewportSize({width:390,height:844});await page.locator('#home').click();await page.screenshot({path:'private/qa/mobile-welcome.png',fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.getByRole('button',{name:'Enter the town'}).click();await page.screenshot({path:'private/qa/mobile-town.png'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  console.log(JSON.stringify({browserErrors:errors,passed:['welcome WebGL','snapshot timeline','project dialog','JSON backup','Chinese toggle','hackathon capture (mocked transport)','reload local snapshot','backup import','personal repository selection (mocked transport)','mobile layout']},null,2));
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
