const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const baseUrl = process.env.DEMO_URL || 'http://127.0.0.1:5173/';
async function townReady(page) {
  await page.locator('#scene[data-town-ready="true"]').waitFor({ timeout: 60000 });
  await page.locator('#map-transition').waitFor({ state: 'hidden', timeout: 60000 });
}
async function tour(page, mode) {
  assert.equal(await page.locator('#manage').count(), 0);
  if (!await page.locator('.sample-tour-picker').evaluate(element => element.open)) await page.locator('.sample-tour-picker > summary').click();
  assert.equal(await page.locator('[data-tour-landscape]').count(), 3);
  await page.locator(`[data-tour-landscape="${mode}"]`).click(); await townReady(page);
  if (await page.locator('.sample-tour-picker').evaluate(element => element.open)) await page.locator('.sample-tour-picker > summary').click();
}
function watch(page, errors, progressRequests) {
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (new URL(request.url()).pathname.includes('/api/progress')) progressRequests.push(request.url()); });
}
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_BIN ? { executablePath: process.env.BROWSER_BIN } : { channel: 'chrome' }) });
  try {
    fs.mkdirSync('private/qa', { recursive: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }), errors = [], progressRequests = [];
    watch(page, errors, progressRequests);
    await page.route('**/api/session', route => route.fulfill({ json: { configured: false, playerConfigured: false, authenticated: false, canPublish: false, isDeployer: false, login: null, avatar: null } }));
    await page.route('**/api/town', route => route.fulfill({ json: null }));
    await page.route('**/api/towns', route => route.fulfill({ json: { towns: [] } }));
    for (const mode of ['flat', 'valley', 'clouds']) {
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' }); await page.locator('[data-enter]').click(); await townReady(page); await tour(page, mode);
      assert.equal(await page.locator('#scene').getAttribute('data-landscape'), mode);
      await page.screenshot({ path: `private/qa/map-${mode}.png` });
      await page.locator('#random-explore').click(); await page.locator('#detail[open]').waitFor();
      assert.ok((await page.locator('#detail-title').textContent()).trim());
      assert.equal(await page.locator('#detail [data-visit]').isDisabled(), true);
      assert.equal(await page.locator('#detail .card-metrics').count(), 0);
      await page.screenshot({ path: `private/qa/info-${mode}.png` }); await page.locator('#close').click();
      const key = `bg-exploration:sample-town${mode === 'flat' ? '' : '-' + mode}:guest`;
      assert.ok((await page.evaluate(key => JSON.parse(localStorage.getItem(key) || '[]'), key)).length > 0, 'Random exploration is remembered on this device');
      await page.locator('#timeline').fill('0'); await page.locator('#timeline').dispatchEvent('input'); await townReady(page);
      assert.equal(await page.locator('#scene').getAttribute('data-landscape'), mode);
      assert.equal(await page.locator('.quest-stack, .explorer-badge, #show-exploration, [data-export]').count(), 0);
      assert.equal(await page.locator('#language, #player-login').count(), 2);
      await page.locator('#language').click(); await townReady(page);
      assert.equal(await page.getByRole('button', { name: '随机探索', exact: true }).getAttribute('id'), 'random-explore');
      await page.locator('#language').click(); await townReady(page);
    }
    await page.setViewportSize({ width: 390, height: 844 }); await page.locator('#reset').click();
    await page.screenshot({ path: 'private/qa/map-mobile.png' });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal(await page.getByRole('button', { name: 'Sign in with GitHub', exact: true }).getAttribute('id'), 'player-login');
    await page.locator('#show-projects').click(); await page.locator('[data-project="sample-8"]').click();
    await page.screenshot({ path: 'private/qa/info-mobile.png' }); await page.locator('#close').click();
    await page.locator('#home').click(); await page.locator('[data-create]').click(); await page.locator('[data-mode="hackathon"]').click();
    await page.locator('[data-landscape-choice="valley"]').click(); await page.locator('#town-name').fill('Valley example'); await page.locator('#repositories').fill('https://github.com/example/project');
    await page.locator('.config-backup > summary').click();
    const downloading = page.waitForEvent('download'); await page.locator('#export-config').click(); await (await downloading).saveAs('private/qa/valley.config.json');
    assert.equal(JSON.parse(fs.readFileSync('private/qa/valley.config.json')).landscape, 'valley');

    const { sampleTown } = await import('../src/sample.mjs');
    function fictionalFixture(count, id) {
      const fixture = sampleTown(); fixture.event.id = id; fixture.event.name = 'Fictional integration fixture'; fixture.event.sampleData = false;
      fixture.event.projects = fixture.event.projects.slice(0, count); fixture.history.eventId = id; fixture.history.sampleData = false;
      fixture.history.snapshots.forEach(snapshot => { snapshot.projects = snapshot.projects.slice(0, count); }); return fixture;
    }
    const legacy = fictionalFixture(1, 'legacy-test-fixture');
    for (const selectedMode of ['valley', 'clouds']) {
      await page.locator(`[data-landscape-choice="${selectedMode}"]`).click();
      await page.locator('#import').setInputFiles({ name: 'legacy.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(legacy)) });
      await townReady(page); assert.equal(await page.locator('#scene').getAttribute('data-landscape'), 'flat');
      if (selectedMode === 'valley') {
        const bounds = await page.locator('#minimap').boundingBox();
        await page.locator('#minimap').click({ position: { x: bounds.width / 2, y: bounds.height / 2 } });
        await page.locator('#detail[open]').waitFor(); assert.equal(await page.locator('#detail-title').innerText(), 'Open Orchard');
        assert.equal(await page.locator('#visited-count').textContent(), '1 / 1'); await page.locator('#close').click();
      }
      assert.equal(await page.locator('#language, #player-login, .map-nav [data-export]').count(), 3);
      await page.locator('#manage').click(); assert.equal(await page.locator('#landscape').inputValue(), 'flat'); assert.equal(await page.locator('#landscape').isDisabled(), true);
      await page.locator('#home').click(); await page.locator('[data-create]').click(); await page.locator('[data-mode="hackathon"]').click();
    }
    await page.close();

    // Signed-in progress remains browser-local and survives a reload without any progress API.
    const playerPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); watch(playerPage, errors, progressRequests);
    const playerTown = fictionalFixture(3, 'player-test-fixture');
    const avatar = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#5269aa"/></svg>');
    const playerSession = { configured: true, playerConfigured: true, authenticated: true, canPublish: true, isDeployer: false, login: 'test-explorer', avatar };
    await playerPage.route('**/api/session', route => route.fulfill({ json: playerSession }));
    await playerPage.route('**/api/town', route => route.fulfill({ json: playerTown }));
    await playerPage.route('**/api/towns', route => route.fulfill({ json: { towns: [] } }));
    await playerPage.addInitScript(() => { if (!localStorage.getItem('bg-exploration:player-test-fixture:guest')) localStorage.setItem('bg-exploration:player-test-fixture:guest', JSON.stringify(['sample-0'])); });
    await playerPage.goto(baseUrl + '?town=1', { waitUntil: 'domcontentloaded' }); await townReady(playerPage);
    assert.equal(await playerPage.locator('#player-login').getAttribute('aria-label'), 'GitHub account: test-explorer');
    assert.equal(await playerPage.locator('#player-login img').getAttribute('src'), avatar);
    assert.equal(await playerPage.locator('#visited-count').innerText(), '1 / 3');
    await playerPage.locator('#next-project').click(); await playerPage.locator('#detail[open]').waitFor();
    assert.ok(['Little Atlas', 'Cloud Notes'].includes(await playerPage.locator('#detail-title').innerText()), 'Discovery selects a project not already visited'); await playerPage.locator('#close').click();
    assert.equal(await playerPage.locator('#visited-count').innerText(), '2 / 3');
    assert.equal(await playerPage.locator('#progress-status').innerText(), 'Saved on this device');
    await playerPage.reload({ waitUntil: 'domcontentloaded' }); await playerPage.locator('[data-enter]').click(); await townReady(playerPage);
    assert.equal(await playerPage.locator('#visited-count').innerText(), '2 / 3');
    await playerPage.locator('#player-login').click(); await playerPage.locator('.setup-page').waitFor();
    assert.equal(await playerPage.locator('[data-mode="personal"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await playerPage.locator('#username').inputValue(), 'test-explorer');
    assert.equal(await playerPage.locator('#username').getAttribute('readonly'), '');
    assert.equal(await playerPage.locator('#publish').isEnabled(), true, 'An authenticated non-deployer can publish a new town');
    await playerPage.close();

    const samplePlayer = await browser.newPage({ viewport: { width: 390, height: 844 } }); watch(samplePlayer, errors, progressRequests);
    await samplePlayer.route('**/api/session', route => route.fulfill({ json: playerSession }));
    await samplePlayer.route('**/api/town', route => route.fulfill({ json: null }));
    await samplePlayer.route('**/api/towns', route => route.fulfill({ json: { towns: [] } }));
    await samplePlayer.goto(baseUrl, { waitUntil: 'domcontentloaded' }); await samplePlayer.locator('#logout').waitFor();
    await samplePlayer.locator('[data-enter]').click(); await townReady(samplePlayer);
    assert.equal(await samplePlayer.locator('#language, #player-login, #logout').count(), 3);
    assert.equal(await samplePlayer.locator('.explorer-badge, .quest-stack, [data-export]').count(), 0);
    assert.equal(await samplePlayer.locator('#player-login img').getAttribute('src'), avatar);
    await samplePlayer.locator('#random-explore').click(); await samplePlayer.locator('#detail[open]').waitFor();
    assert.deepEqual(progressRequests, [], 'Exploration sends no server requests for guests or signed-in users');
    assert.deepEqual(errors, []);
    console.log('Three landscapes, direct random exploration, compact account header, mobile cards, legacy landscape lock/minimap, local-only signed-in visits and authenticated personal setup passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
