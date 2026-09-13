const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
const baseUrl = process.env.DEMO_URL || 'http://127.0.0.1:5173/';

const panelStub = `export function mountSupportPanel(host, options) {
  const state = window.__townLockFixture = { mounted: 1, disposed: 0, lockChanges: [] };
  const layer = document.createElement('div'); layer.className = 'support-island';
  Object.assign(layer.style, { position: 'fixed', bottom: '30px', right: '30px', zIndex: '3000', padding: '20px', background: 'white' });
  host.append(layer);
  const portal = document.createElement('button'); portal.id = 'fixture-privy-portal'; portal.textContent = 'Local body portal';
  Object.assign(portal.style, { position: 'fixed', top: '120px', right: '25px', zIndex: '4000' });
  portal.onclick = () => state.portalClicks = (state.portalClicks || 0) + 1;
  document.body.append(portal);
  return {
    open() {
      layer.innerHTML = '<p>Local wallet lock fixture — no wallet connection</p><button id="fixture-lock">Lock during request</button><button id="fixture-unlock">Finish local request</button>';
      layer.querySelector('#fixture-lock').onclick = () => { state.lockChanges.push(true); options.onLockChange?.(true); };
      layer.querySelector('#fixture-unlock').onclick = () => { state.lockChanges.push(false); options.onLockChange?.(false); };
    },
    dispose() { state.disposed++; options.onLockChange?.(false); layer.remove(); portal.remove(); }
  };
}`;

async function contextFor(browser, fixture, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const audit = { errors: [], external: [], mutations: [], walletCalls: 0 };
  await context.addInitScript(() => {
    window.__lockWalletCalls = 0;
    Object.defineProperty(window, 'ethereum', { configurable: true, value: { request() { window.__lockWalletCalls++; throw Error('No wallet calls in the interaction-lock fixture'); } } });
    window.addEventListener('eip6963:requestProvider', () => window.__lockWalletCalls++);
  });
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (!['GET', 'HEAD'].includes(request.method())) { audit.mutations.push(request.url()); return route.abort(); }
    if (url.origin !== new URL(baseUrl).origin && /^https?:$/.test(url.protocol)) { audit.external.push(request.url()); return route.abort(); }
    if (url.pathname === '/__town-lock-fixture') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Town interaction lock fixture</title></head><body><main id="fixture"><section id="game"><button id="game-action">Game action</button></section><aside id="already-inert" inert>Originally unavailable</aside><div id="wallet" class="support-island"><button id="wallet-action">Wallet action</button></div></main><section id="portal"><button id="portal-action">Body portal action</button></section></body></html>' });
    if (url.pathname === '/src/support/panel.ts') return route.fulfill({ contentType: 'text/javascript', body: panelStub });
    if (url.pathname === '/api/session') { await options.beforeSession?.(); return route.fulfill({ json: { authenticated: false, configured: false, login: null } }); }
    if (url.pathname === '/api/town') return route.fulfill({ json: fixture });
    if (url.pathname === '/api/towns') return route.fulfill({ json: { towns: [] } });
    if (url.pathname === '/data/town.json') return route.fulfill({ status: 404, body: '' });
    return route.continue();
  });
  const page = await context.newPage(); page.on('pageerror', error => audit.errors.push(error.message));
  return { context, page, audit };
}

async function assertClean(page, audit) {
  audit.walletCalls = await page.evaluate(() => window.__lockWalletCalls);
  assert.deepEqual(audit, { errors: [], external: [], mutations: [], walletCalls: 0 });
}

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_BIN ? { executablePath: process.env.BROWSER_BIN } : { channel: 'chrome' }) });
  try {
    const direct = await contextFor(browser, null);
    try {
      const { page } = direct;
      await page.goto(new URL('__town-lock-fixture', baseUrl).href);
      await page.evaluate(async () => {
        const { createTownInteractionLock } = await import('/src/support/town-lock.ts');
        window.__lockFixture = { api: createTownInteractionLock(document.querySelector('#fixture')), walletClicks: 0, portalClicks: 0, gameClicks: 0 };
        document.querySelector('#wallet-action').onclick = () => window.__lockFixture.walletClicks++;
        document.querySelector('#portal-action').onclick = () => window.__lockFixture.portalClicks++;
        document.querySelector('#game-action').onclick = () => window.__lockFixture.gameClicks++;
        window.__lockFixture.api.set(true);
      });
      assert.deepEqual(await page.evaluate(() => ['game', 'already-inert', 'wallet', 'portal'].map(id => document.getElementById(id).inert)), [true, true, false, false]);
      await page.locator('#wallet-action').click(); await page.locator('#portal-action').click();
      await page.evaluate(() => document.querySelector('#game-action').focus());
      assert.notEqual(await page.evaluate(() => document.activeElement.id), 'game-action', 'Native inert excludes game controls from keyboard focus');
      await page.evaluate(() => {
        const host = document.querySelector('#fixture');
        const child = document.createElement('section'); child.id = 'late-game'; child.innerHTML = '<button>Late game action</button>'; host.append(child);
        const wallet = document.createElement('section'); wallet.id = 'late-wallet'; wallet.className = 'support-island'; wallet.innerHTML = '<button id="late-wallet-action">Late wallet action</button>'; host.append(wallet);
      });
      await page.waitForFunction(() => document.querySelector('#late-game').inert);
      assert.equal(await page.locator('#late-wallet').evaluate(element => element.inert), false, 'Wallet islands appended during a request stay usable');
      await page.locator('#late-wallet-action').click();
      await page.evaluate(() => { window.__lockFixture.api.set(true); window.__lockFixture.api.set(false); });
      assert.deepEqual(await page.evaluate(() => ['game', 'already-inert', 'wallet', 'portal', 'late-game', 'late-wallet'].map(id => document.getElementById(id).inert)), [false, true, false, false, false, false], 'Unlock restores original inert state, including newly observed game children');
      await page.locator('#game-action').click();
      assert.deepEqual(await page.evaluate(() => [window.__lockFixture.walletClicks, window.__lockFixture.portalClicks, window.__lockFixture.gameClicks]), [1, 1, 1]);
      await assertClean(page, direct.audit);
      console.log('Native town lock preserves wallet islands/body portals, locks new children, and restores prior inert state.');
    } finally { await direct.context.close(); }

    const { sampleTown } = await import('../src/sample.mjs');
    const fixture = sampleTown();
    fixture.event.id = 'local-town-lock-test'; fixture.history.eventId = fixture.event.id;
    fixture.event.sampleData = fixture.history.sampleData = false;
    fixture.event.collectionType = 'hackathon';
    fixture.event.projects.forEach(project => { delete project.builder.avatar; });
    const key = new URL(fixture.event.projects[0].repository).pathname.slice(1).toLowerCase();
    fixture.event.support = { version: 1, chainId: 11155111, projectRecipients: { [key]: '0x52908400098527886E0F7030069857D2E4169EE7' } };
    const integrated = await contextFor(browser, fixture);
    try {
      const { page } = integrated;
      await page.goto(baseUrl); await page.locator('[data-enter]').click();
      await page.locator('#scene[data-town-ready="true"]').waitFor({ timeout: 60000 });
      await page.locator('#map-transition').waitFor({ state: 'hidden', timeout: 60000 });
      await page.locator('#town-wallet').click(); await page.locator('#fixture-lock').click();
      assert.equal(await page.locator('.support-island').evaluate(element => element.inert), false);
      assert.equal(await page.locator('#fixture-privy-portal').evaluate(element => element.closest('[inert]') !== null), false);
      await page.locator('#fixture-privy-portal').click();
      await page.evaluate(() => {
        window.__townLockFixture.canvas = document.querySelector('#scene canvas');
        const late = document.createElement('aside'); late.id = 'late-root-control'; document.querySelector('#app').append(late);
      });
      await page.waitForFunction(() => document.querySelector('#late-root-control').inert);
      await page.evaluate(() => document.querySelector('#home').click());
      assert.equal(await page.locator('body').getAttribute('data-screen'), 'town', 'The navigation guard also rejects a synthetic handler call during a critical request');
      await page.evaluate(() => { history.pushState(null, '', '?setup=personal'); dispatchEvent(new PopStateEvent('popstate')); });
      await page.waitForTimeout(100);
      assert.equal(await page.locator('body').getAttribute('data-screen'), 'town', 'A history event defers rendering while the wallet operation is locked');
      assert.equal(await page.evaluate(() => document.querySelector('#scene canvas') === window.__townLockFixture.canvas), true);
      assert.equal(await page.evaluate(() => window.__townLockFixture.disposed), 0, 'The active optional panel is not disposed by deferred navigation');
      assert.equal(await page.evaluate(() => window.__townLockFixture.portalClicks), 1);
      await page.locator('#fixture-unlock').click();
      await page.waitForFunction(() => document.body.dataset.screen === 'setup');
      assert.equal(await page.evaluate(() => window.__townLockFixture.disposed), 1, 'The queued route resumes after unlock and disposes the old panel once');
      assert.equal(await page.locator('.support-island, #fixture-privy-portal, #late-root-control').count(), 0);
      assert.equal(await page.locator('#app > [inert]').count(), 0, 'The new page is interactive after the deferred route completes');
      await assertClean(page, integrated.audit);
      console.log('Main UI keeps its active scene/panel through lock, defers history navigation, and renders the requested route after unlock.');
    } finally { await integrated.context.close(); }

    let holdNavigation = false, signalNavigation, releaseSession;
    const navigationStarted = new Promise(resolve => { signalNavigation = resolve; });
    const heldSession = new Promise(resolve => { releaseSession = resolve; });
    const raced = await contextFor(browser, fixture, { beforeSession: async () => {
      if (!holdNavigation) return;
      signalNavigation(); await heldSession;
    } });
    try {
      const { page } = raced;
      await page.goto(baseUrl); await page.locator('[data-enter]').click();
      await page.locator('#scene[data-town-ready="true"]').waitFor({ timeout: 60000 });
      await page.locator('#map-transition').waitFor({ state: 'hidden', timeout: 60000 });
      await page.locator('#town-wallet').click(); await page.locator('#fixture-lock').waitFor();
      await page.evaluate(() => window.__townLockFixture.canvas = document.querySelector('#scene canvas'));
      holdNavigation = true;
      await page.evaluate(() => { history.pushState(null, '', '?setup=personal'); dispatchEvent(new PopStateEvent('popstate')); });
      await navigationStarted;
      await page.locator('#fixture-lock').click();
      const finishedDirectory = page.waitForResponse(response => new URL(response.url()).pathname === '/api/towns');
      holdNavigation = false; releaseSession();
      await (await finishedDirectory).finished();
      await page.waitForTimeout(100);
      assert.equal(await page.locator('body').getAttribute('data-screen'), 'town');
      assert.equal(await page.evaluate(() => document.querySelector('#scene canvas') === window.__townLockFixture.canvas), true);
      assert.equal(await page.evaluate(() => window.__townLockFixture.disposed), 0);
      assert.equal(new URL(page.url()).searchParams.get('setup'), 'personal', 'An earlier navigation cannot commit its URL changes while a later critical request is locked');
      await page.locator('#fixture-unlock').click();
      await page.waitForFunction(() => document.body.dataset.screen === 'setup');
      assert.equal(await page.evaluate(() => window.__townLockFixture.disposed), 1);
      assert.equal(await page.locator('.support-island, #fixture-privy-portal, #app > [inert]').count(), 0);
      await assertClean(page, raced.audit);
      console.log('A navigation already awaiting a response also defers its state/URL commit when a critical wallet request starts later.');
    } finally { releaseSession(); await raced.context.close(); }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
