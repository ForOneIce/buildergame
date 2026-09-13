const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const baseUrl = process.env.DEMO_URL || 'http://127.0.0.1:5173/';
const selectors = ['#map-home', '.map-nav .camera-controls', '#show-projects', '#random-explore', '.town-overview', '#town-stats', '.town-info', '.map-minimap', '.timeline'];

async function sceneReady(page) {
  await page.locator('#scene[data-town-ready="true"]').waitFor({ timeout: 60000 });
  await page.locator('#map-transition').waitFor({ state: 'hidden', timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
}

(async () => {
  const { sampleTown } = await import('../src/sample.mjs');
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_BIN ? { executablePath: process.env.BROWSER_BIN } : { channel: 'chrome' }) });
  fs.mkdirSync('private/qa', { recursive: true });
  const errors = [], external = [], mutations = [], walletModules = [];
  try {
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
      let reference;
      for (const kind of ['sample', 'ordinary', 'wallet-enabled']) {
        const fixture = sampleTown();
        fixture.event.projects.forEach(project => { delete project.builder.avatar; });
        if (kind !== 'sample') {
          fixture.event.id = `hud-parity-${kind}`; fixture.history.eventId = fixture.event.id;
          fixture.event.sampleData = fixture.history.sampleData = false;
        }
        if (kind === 'wallet-enabled') {
          fixture.event.collectionType = 'hackathon';
          const key = new URL(fixture.event.projects[0].repository).pathname.slice(1).toLowerCase();
          fixture.event.support = { version: 1, chainId: 11155111, projectRecipients: { [key]: '0x52908400098527886E0F7030069857D2E4169EE7' } };
        }
        const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
        try {
          await context.addInitScript(() => {
            window.__hudWalletCalls = 0;
            Object.defineProperty(window, 'ethereum', { configurable: true, value: { request() { window.__hudWalletCalls++; throw Error('No wallet operations in the layout fixture'); } } });
            window.addEventListener('eip6963:requestProvider', () => window.__hudWalletCalls++);
          });
          await context.route('**/*', async route => {
            const request = route.request(), url = new URL(request.url());
            if (!['GET', 'HEAD'].includes(request.method())) { mutations.push(request.url()); return route.abort(); }
            if (url.origin !== new URL(baseUrl).origin && /^https?:$/.test(url.protocol)) { external.push(request.url()); return route.abort(); }
            if (/\/support\/(?:panel|wallet-panel)/.test(url.pathname)) { walletModules.push(request.url()); return route.abort(); }
            if (url.pathname === '/api/session') return route.fulfill({ json: { authenticated: false, configured: false, login: null, avatar: null } });
            if (url.pathname === '/api/town') return route.fulfill({ json: fixture });
            if (url.pathname === '/api/towns') return route.fulfill({ json: { towns: [] } });
            if (url.pathname === '/data/town.json') return route.fulfill({ status: 404, body: '' });
            return route.continue();
          });
          const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
          await page.goto(baseUrl); await page.locator('[data-enter]').click(); await sceneReady(page);
          assert.equal(await page.locator('.map-game.town-hud').count(), 1, `${kind} uses the shared accepted town HUD`);
          assert.equal(await page.locator('.quest-stack, .explorer-badge, #show-exploration, #next-project, [data-export]').count(), 0);
          assert.equal(await page.locator('#town-wallet').count(), kind === 'wallet-enabled' ? 1 : 0);
          assert.equal(await page.locator('.sample-tour-picker').count(), kind === 'sample' ? 1 : 0);
          assert.equal(await page.locator('#sample-invest').count(), 1, 'All town kinds keep the existing virtual coin launcher');
          assert.equal(await page.locator('#manage').count(), 0);
          assert.equal(await page.locator('.town-info').innerText(), fixture.event.name, 'Only the town name remains in the name card');
          assert.equal(await page.locator('.town-overview > #town-stats').count(), 1);
          assert.equal(await page.locator('#map-home').evaluate(element => element.nextElementSibling?.classList.contains('camera-controls')), true);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${kind} has no horizontal overflow`);

          const boxes = {};
          for (const selector of selectors) {
            assert.equal(await page.locator(selector).count(), 1);
            const box = await page.locator(selector).boundingBox();
            assert.ok(box, `${kind}: ${selector} is visible`);
            assert.ok(box.x >= -1 && box.y >= -1 && box.x + box.width <= viewport.width + 1 && box.y + box.height <= viewport.height + 1, `${kind}: ${selector} stays inside ${viewport.width}×${viewport.height}`);
            boxes[selector] = box;
          }
          assert.ok(boxes['.map-nav .camera-controls'].y >= boxes['#map-home'].y + boxes['#map-home'].height, 'Camera buttons sit below Town map');
          assert.ok(boxes['#town-stats'].y + boxes['#town-stats'].height <= boxes['.town-info'].y + 1, 'Statistics sit above the lower-left name card');
          if (!reference) reference = boxes;
          else for (const selector of selectors) for (const key of ['x', 'y', 'width', 'height']) {
            assert.ok(Math.abs(boxes[selector][key] - reference[selector][key]) <= 1, `${kind}: ${selector}.${key} matches the sample (${boxes[selector][key]} vs ${reference[selector][key]})`);
          }
          await page.screenshot({ path: `private/qa/town-hud-${kind}-${viewport.width}.png` });
          await page.locator('#random-explore').click(); await page.locator('#detail[open]').waitFor();
          assert.ok((await page.locator('#detail-title').innerText()).trim());
          const remembered = await page.evaluate(id => JSON.parse(localStorage.getItem(`bg-exploration:${id}:guest`) || '[]'), fixture.event.id);
          assert.equal(remembered.length, 1, 'All town kinds retain browser-local random discovery');
          assert.equal(await page.evaluate(() => window.__hudWalletCalls), 0);
          console.log(`${kind} ${viewport.width}×${viewport.height}: shared DOM/control positions and local random discovery passed.`);
        } finally { await context.close(); }
      }
    }
    assert.deepEqual(errors, []); assert.deepEqual(external, []); assert.deepEqual(mutations, []); assert.deepEqual(walletModules, []);
    console.log('No wallet SDK/authentication, external calls, or mutations occurred during town HUD parity checks.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
