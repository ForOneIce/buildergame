const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const baseUrl = process.env.DEMO_URL || 'http://127.0.0.1:5173/';
const scope = process.env.MAILBOX_CASE || 'all';
const run = name => scope === 'all' || scope.split(',').includes(name);
assert.ok(scope === 'all' || scope.split(',').every(name => ['desktop', 'scene', 'responsive', 'guards'].includes(name)), 'Unknown MAILBOX_CASE');

async function townReady(page, selector = '#scene') {
  await page.locator(`${selector}[data-town-ready="true"]`).waitFor({ timeout: 60000 });
  if (selector === '#scene') await page.locator('#map-transition').waitFor({ state: 'hidden', timeout: 60000 });
}
async function storage(page) {
  return page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, cookie: document.cookie, writes: window.__mailboxAudit.storageWrites.length }));
}
async function installGuards(context, audit) {
  await context.addInitScript(() => {
    const walletCalls = [], storageWrites = [];
    const reject = method => (...args) => { walletCalls.push({ method, args }); return Promise.reject(new Error('Fixture wallet must not be called')); };
    window.__mailboxAudit = { walletCalls, storageWrites, providerDiscovery: 0 };
    Object.defineProperty(window, 'ethereum', { configurable: true, value: { request: reject('request'), enable: reject('enable'), send: reject('send'), sendAsync: reject('sendAsync') } });
    window.addEventListener('eip6963:requestProvider', () => window.__mailboxAudit.providerDiscovery++);
    for (const method of ['setItem', 'removeItem', 'clear']) {
      const original = Storage.prototype[method];
      Storage.prototype[method] = function (...args) { storageWrites.push({ method, args }); return original.apply(this, args); };
    }
  });
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin !== new URL(baseUrl).origin && /^https?:$/.test(url.protocol)) {
      audit.external.push({ method: request.method(), url: request.url() });
      return route.abort();
    }
    return route.fallback();
  });
  context.on('page', page => {
    page.on('pageerror', error => audit.errors.push(error.message));
    page.on('request', request => { if (!['GET', 'HEAD'].includes(request.method())) audit.writes.push({ method: request.method(), url: request.url() }); });
    page.on('download', () => audit.downloads++);
    page.on('popup', () => audit.popups++);
  });
}
async function serveTown(page, fixture = null) {
  await page.route('**/api/session', route => route.fulfill({ json: { configured: false, playerConfigured: false, authenticated: false, canPublish: false, isDeployer: false, login: null, avatar: null } }));
  await page.route('**/api/town', route => route.fulfill({ json: fixture }));
  await page.route('**/api/towns', route => route.fulfill({ json: { towns: [] } }));
  await page.route('**/data/town.json', route => route.fulfill({ status: 404, json: { error: 'No static fixture' } }));
}
async function enterSample(page) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-enter]').click();
  await townReady(page);
}
async function noSideEffects(page, before, audit) {
  assert.deepEqual(await storage(page), before, 'Virtual coins do not alter saved towns, snapshots, exploration, tokens or export data');
  const calls = await page.evaluate(() => window.__mailboxAudit);
  assert.deepEqual(calls.walletCalls, [], 'The demo never calls an available wallet provider');
  assert.equal(calls.providerDiscovery, 0, 'The demo does not request wallet-provider discovery');
  assert.deepEqual(audit.external, [], 'No external payment/RPC service is contacted');
  assert.deepEqual(audit.writes, [], 'No HTTP mutation is made');
  assert.equal(audit.downloads, 0, 'The demo does not rewrite or export a town');
  assert.equal(audit.popups, 0, 'The demo opens no transaction or project window');
}
async function fits(page, selector) {
  const bounds = await page.locator(selector).boundingBox(), viewport = page.viewportSize();
  assert.ok(bounds && bounds.x >= -1 && bounds.y >= -1 && bounds.x + bounds.width <= viewport.width + 1 && bounds.y + bounds.height <= viewport.height + 1, `${selector} stays in the viewport`);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'No horizontal overflow');
}

async function openDemo(page, keyboard = false) {
  const button = page.locator('#sample-invest');
  if (keyboard) { await button.focus(); await page.keyboard.press('Enter'); }
  else await button.click();
  await page.locator('#investment-dialog[open]').waitFor();
  assert.equal(await page.locator('#connect-demo-wallet').isDisabled(), true, 'Wallet connection is explicitly unavailable in this visual demo');
}
async function activateMailbox(page, selector, mode = 'click') {
  const button = page.locator(selector);
  for (let attempt = 0; attempt < 12; attempt++) {
    if (mode === 'keyboard') { await button.focus(); await page.keyboard.press('Enter'); }
    else if (mode === 'touch') await button.tap(); else await button.click();
    if (!await page.locator('#investment-dialog').evaluate(element => element.open)) return;
    assert.match(await page.locator('#mailbox-status').innerText(), /loading|on its way|加载|投递/);
    await page.waitForTimeout(400);
  }
  assert.fail('The loaded mailbox action remains unavailable after bounded visible-status retries');
}
async function focusMailbox(page, touch = false) {
  await activateMailbox(page, '#find-mailbox', touch ? 'touch' : 'click');
  // The public Find action targets the mailbox proxy center with a front-facing camera.
  await page.waitForTimeout(150);
  const box = await page.locator('#scene canvas').boundingBox();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}
async function receipt(page, total = 1) {
  await page.locator('#demo-wallet-receipt').waitFor({ state: 'visible', timeout: 5000 });
  await page.locator('#demo-wallet-receipt').evaluate(element => Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {}))));
  assert.equal(Number(await page.locator('#demo-wallet-receipt').getAttribute('data-demo-total')), total);
  assert.equal(await page.locator('#demo-wallet-receipt').count(), 1, 'Receipts are replaced rather than stacked');
  assert.match(await page.locator('#demo-wallet-receipt').innerText(), /\+1/);
  assert.equal(await page.locator('#detail[open], #project-entry[open]').count(), 0, 'A mailbox hit never opens the sign or door');
}
async function changeSnapshot(page, index) {
  await page.locator('#timeline').fill(String(index));
  await page.locator('#timeline').dispatchEvent('input');
  await townReady(page);
}
async function sceneFixture(page) {
  // Use the exported scene API in a dedicated project-only fixture, without production globals.
  await page.locator('#home').click();
  await page.evaluate(async () => {
    const { createTown } = await import('/src/town.ts');
    const { sampleTown } = await import('/src/sample.mjs');
    const base = sampleTown(), project = base.event.projects[0];
    const host = document.createElement('div'); host.id = 'mailbox-fixture';
    Object.assign(host.style, { position: 'fixed', inset: '0', zIndex: '9999' }); document.body.append(host);
    const picks = [], deliveries = [];
    const api = createTown(host, [project], (id, open) => picks.push({ id, open }), 'flat', { mailboxDemo: true, onMailbox: id => deliveries.push(id) });
    const state = { api, host, project, picks, deliveries, snapshot: structuredClone(base.history.snapshots[0]) };
    state.snapshot.projects = [{ ...state.snapshot.projects[0], stage: 'decorated' }];
    window.__mailboxFixture = state; api.update(state.snapshot);
  });
  await townReady(page, '#mailbox-fixture');
  await page.waitForFunction(() => window.__mailboxFixture.api.mailboxPoints().some(point => point.visible));
  await page.evaluate(() => { const f = window.__mailboxFixture; f.api.focusMailbox(f.project.id); });
  await page.waitForTimeout(100);
  const point = await page.evaluate(() => window.__mailboxFixture.api.mailboxPoints()[0]);
  assert.equal(point.visible, true);
  await page.mouse.move(point.x, point.y);
  assert.equal(await page.locator('#mailbox-fixture canvas').getAttribute('data-cursor'), 'coin');
  await page.mouse.click(point.x, point.y, { button: 'right' });
  assert.deepEqual(await page.evaluate(() => window.__mailboxFixture.deliveries), []);
  await page.mouse.move(point.x, point.y); await page.mouse.down(); await page.mouse.move(point.x + 18, point.y + 18); await page.mouse.up();
  assert.deepEqual(await page.evaluate(() => window.__mailboxFixture.deliveries), [], 'Camera dragging cannot toss a coin');
  await page.evaluate(() => { const f = window.__mailboxFixture; f.api.focusMailbox(f.project.id); });
  const slot = await page.evaluate(() => window.__mailboxFixture.api.mailboxPoints()[0]);
  await page.mouse.click(slot.x, slot.y);
  await page.waitForFunction(() => window.__mailboxFixture.deliveries.length === 1);
  assert.deepEqual(await page.evaluate(() => window.__mailboxFixture.picks), [], 'Mailbox selection is isolated from door and sign actions');
  await page.waitForTimeout(500);
  const accepts = await page.evaluate(() => { const f = window.__mailboxFixture; return Array.from({ length: 20 }, () => f.api.tossCoin(f.project.id)); });
  assert.equal(accepts.filter(Boolean).length, 1, 'Rapid repeated inputs create at most one active coin');
  await page.evaluate(() => { const f = window.__mailboxFixture; f.snapshot.id = 'fixture-cancel-flight'; f.snapshot.projects[0].stage = 'land'; f.api.update(f.snapshot); });
  assert.equal(await page.evaluate(() => window.__mailboxFixture.api.mailboxPoints().filter(point => point.visible).length), 0, 'Snapshot changes disable stale proxies synchronously');
  assert.notEqual(await page.locator('#mailbox-fixture canvas').getAttribute('data-cursor'), 'coin');
  await page.waitForTimeout(1300);
  assert.equal(await page.evaluate(() => window.__mailboxFixture.deliveries.length), 1, 'A cancelled flight cannot deliver a late receipt');
  for (const stage of ['land', 'foundation', 'frame', 'cottage']) {
    await page.evaluate(stage => { const f = window.__mailboxFixture; f.snapshot.id = 'fixture-' + stage; f.snapshot.projects[0].stage = stage; f.api.update(f.snapshot); }, stage);
    await townReady(page, '#mailbox-fixture');
    assert.deepEqual(await page.evaluate(() => { const f = window.__mailboxFixture; return [f.api.mailboxPoints().filter(point => point.visible).length, f.api.focusMailbox(f.project.id), f.api.tossCoin(f.project.id)]; }), [0, false, false], `${stage} has no active mailbox`);
  }
  await page.evaluate(() => { const f = window.__mailboxFixture; f.snapshot.id = 'fixture-stage5-again'; f.snapshot.projects[0].stage = 'decorated'; f.api.update(f.snapshot); });
  await townReady(page, '#mailbox-fixture');
  await page.waitForFunction(() => window.__mailboxFixture.api.mailboxPoints().some(point => point.visible));
  await page.evaluate(() => { const f = window.__mailboxFixture; f.api.tossCoin(f.project.id); f.api.dispose(); });
  await page.waitForTimeout(1300);
  assert.equal(await page.evaluate(() => window.__mailboxFixture.deliveries.length), 1, 'Disposing the scene cancels callbacks and animation');
  assert.equal(await page.locator('#mailbox-fixture canvas, #mailbox-fixture .scene-greeting').count(), 0);
  await page.evaluate(() => { window.__mailboxFixture.host.remove(); delete window.__mailboxFixture; });
}

(async () => {
  fs.mkdirSync('private/qa', { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_BIN ? { executablePath: process.env.BROWSER_BIN } : { channel: 'chrome' }) });
  const audit = { errors: [], external: [], writes: [], downloads: 0, popups: 0 };
  try {
    if (run('desktop') || run('scene')) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
    await installGuards(context, audit);
    const page = await context.newPage(); await serveTown(page); await enterSample(page);
    if (run('desktop')) {
    const tour = await page.locator('.sample-tour-picker').boundingBox(), invest = await page.locator('#sample-invest').boundingBox();
    assert.ok(invest.y >= tour.y + tour.height - 1, 'Investment demo appears below Tour landscapes');
    const before = await storage(page), storedWrites = await page.evaluate(() => window.__mailboxAudit.storageWrites.length);
    await openDemo(page, true); await fits(page, '#investment-dialog');
    assert.match(await page.locator('#investment-dialog').innerText(), /wallet.*not connected|not connected.*wallet/is);
    assert.match(await page.locator('#investment-dialog').innerText(), /demo|virtual/i);
    assert.match(await page.locator('#investment-dialog').innerText(), /no real|not.*real|no.*transaction|does not.*transaction/i);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#sample-invest').evaluate(element => element === document.activeElement), true, 'Closing the modal returns keyboard focus');
    await openDemo(page);
    await page.locator('#mailbox-project').selectOption('sample-7');
    const selected = await page.locator('#mailbox-project option:checked').innerText(), point = await focusMailbox(page);
    await page.mouse.move(point.x, point.y);
    assert.equal(await page.locator('#scene canvas').getAttribute('data-cursor'), 'coin');
    assert.match(await page.locator('#scene canvas').evaluate(element => getComputedStyle(element).cursor), /coin\.svg/);
    assert.match(await page.locator('#scene .scene-greeting').innerText(), /coin|demo/i);
    await page.mouse.click(point.x, point.y, { clickCount: 3, delay: 20 });
    await page.waitForTimeout(230); await page.screenshot({ path: 'private/qa/mailbox-flight-desktop.png' });
    await receipt(page, 1);
    assert.equal(await page.locator('#demo-wallet-project').innerText(), selected);
    assert.match(await page.locator('#demo-wallet-receipt').innerText(), /demo|virtual/i);
    await page.screenshot({ path: 'private/qa/mailbox-desktop.png' });
    assert.equal(await page.evaluate(() => window.__mailboxAudit.storageWrites.length), storedWrites, 'Even exploration storage remains untouched');
    await noSideEffects(page, before, audit);
    await page.waitForTimeout(450); await openDemo(page); await activateMailbox(page, '#try-demo-coin'); await receipt(page, 2);
    await noSideEffects(page, before, audit);
    await changeSnapshot(page, 0);
    assert.equal(await page.locator('#demo-wallet-receipt:visible').count(), 0);
    await openDemo(page); await activateMailbox(page, '#try-demo-coin'); await receipt(page, 1);
    await changeSnapshot(page, 1);
    await openDemo(page); await activateMailbox(page, '#try-demo-coin');
    await changeSnapshot(page, 2); await page.waitForTimeout(1300);
    assert.equal(await page.locator('#demo-wallet-receipt:visible').count(), 0, 'Changing snapshots mid-flight clears the receipt');
    await openDemo(page); await activateMailbox(page, '#try-demo-coin');
    await page.locator('.sample-tour-picker > summary').click(); await page.locator('[data-tour-landscape="valley"]').click();
    await townReady(page); await page.waitForTimeout(1300);
    assert.equal(await page.locator('#demo-wallet-receipt:visible').count(), 0, 'Changing landscapes mid-flight cancels the old scene');
    await page.locator('#language').click(); await townReady(page);
    const chineseBefore = await storage(page);
    await openDemo(page, true);
    assert.match(await page.locator('#sample-invest').innerText(), /投资|投币/);
    assert.match(await page.locator('#investment-dialog').innerText(), /钱包.*未连接|未连接.*钱包/s);
    assert.match(await page.locator('#investment-dialog').innerText(), /演示|虚拟/);
    await activateMailbox(page, '#try-demo-coin', 'keyboard'); await receipt(page, 1);
    assert.match(await page.locator('#demo-wallet-receipt').innerText(), /演示|虚拟/);
    await noSideEffects(page, chineseBefore, audit);
    await page.locator('#language').click(); await townReady(page);
    console.log('Desktop bilingual mailbox, keyboard, cancellation and no-side-effect checks passed.');
    }
    if (run('scene')) { await sceneFixture(page); console.log('Scene hit testing, bounded effects, all early stages and disposal checks passed.'); }
    await page.close(); await context.close();
    }

    const viewports = [{ width: 360, height: 800 }, { width: 360, height: 640 }, { width: 844, height: 390 }].filter(viewport => !process.env.MAILBOX_VIEWPORT || process.env.MAILBOX_VIEWPORT === `${viewport.width}x${viewport.height}`);
    if (run('responsive')) assert.ok(viewports.length, 'Unknown MAILBOX_VIEWPORT');
    if (run('responsive')) for (const viewport of viewports) {
      const landscape = process.env.MAILBOX_LANDSCAPE || 'flat';
      assert.ok(['flat', 'valley', 'clouds'].includes(landscape), 'Unknown MAILBOX_LANDSCAPE');
      const imageSuffix = `${viewport.width}x${viewport.height}${landscape === 'flat' ? '' : '-' + landscape}`;
      const touchContext = await browser.newContext({ viewport, hasTouch: true, reducedMotion: viewport.width === 360 ? 'reduce' : 'no-preference' });
      await installGuards(touchContext, audit); const touch = await touchContext.newPage(); await serveTown(touch); await enterSample(touch);
      await fits(touch, '#sample-invest');
      const tourBounds = await touch.locator('.sample-tour-picker').boundingBox(), buttonBounds = await touch.locator('#sample-invest').boundingBox();
      assert.ok(buttonBounds.y >= tourBounds.y + tourBounds.height - 1, 'The compact layout also keeps Invest below Tour');
      await touch.locator('.sample-tour-picker > summary').tap(); await fits(touch, '.sample-tour-options');
      await touch.screenshot({ path: `private/qa/mailbox-terrain-${imageSuffix}.png` });
      await touch.locator('[data-tour-landscape="clouds"]').scrollIntoViewIfNeeded();
      await fits(touch, '[data-tour-landscape="clouds"]');
      if (landscape === 'flat') await touch.locator('.sample-tour-picker > summary').tap();
      else { await touch.locator(`[data-tour-landscape="${landscape}"]`).tap(); await townReady(touch); }
      assert.equal(await touch.locator('.sample-tour-picker').evaluate(element => element.open), false, 'The terrain menu leaves its own toggle reachable');
      assert.equal(await touch.locator('#scene').getAttribute('data-landscape'), landscape);
      const touchBefore = await storage(touch);
      await touch.locator('#sample-invest').tap(); await touch.locator('#investment-dialog[open]').waitFor(); await fits(touch, '#investment-dialog');
      await touch.waitForTimeout(180);
      await touch.screenshot({ path: `private/qa/mailbox-dialog-${imageSuffix}.png` });
      const point = await focusMailbox(touch, true); await touch.touchscreen.tap(point.x, point.y); await receipt(touch, 1);
      assert.equal(await touch.locator('#scene .scene-greeting:visible').count(), 0, 'Touch does not leave a hover tooltip');
      await fits(touch, '#demo-wallet-receipt'); await touch.screenshot({ path: `private/qa/mailbox-receipt-${imageSuffix}.png` });
      const receiptBox = await touch.locator('#demo-wallet-receipt').boundingBox();
      for (const selector of ['.map-nav', '.town-overview', '.timeline']) {
        const box = await touch.locator(selector).boundingBox();
        const overlap = Math.min(receiptBox.x + receiptBox.width, box.x + box.width) > Math.max(receiptBox.x, box.x) && Math.min(receiptBox.y + receiptBox.height, box.y + box.height) > Math.max(receiptBox.y, box.y);
        assert.equal(overlap, false, `The receipt does not cover ${selector} at ${viewport.width}×${viewport.height}: ${JSON.stringify({ receipt: receiptBox, control: box })}`);
      }
      await noSideEffects(touch, touchBefore, audit);
      await touch.locator('#home').tap(); await touch.waitForTimeout(1300);
      assert.equal(await touch.locator('#demo-wallet-receipt:visible, #investment-dialog[open]').count(), 0);
      await touch.close(); await touchContext.close();
      console.log(`Responsive touch/menu/receipt checks passed at ${viewport.width}×${viewport.height}, ${landscape}.`);
    }

    const { sampleTown } = await import('../src/sample.mjs');
    const { makeRecord } = await import('../src/model.mjs');
    if (run('guards')) for (const kind of ['early-stage', 'non-sample']) {
      const fixture = sampleTown(); fixture.event.id = 'mailbox-' + kind; fixture.history.eventId = fixture.event.id;
      if (kind === 'early-stage') fixture.history.snapshots.forEach(snapshot => { snapshot.projects = fixture.event.projects.map(project => makeRecord(project, { commits: 0, stars: 0, forks: 0 }, fixture.event.rule, snapshot.capturedAt)); });
      else { fixture.event.sampleData = false; fixture.history.sampleData = false; }
      const fixtureContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      await installGuards(fixtureContext, audit); const fixturePage = await fixtureContext.newPage(); await serveTown(fixturePage, fixture); await enterSample(fixturePage);
      if (kind === 'early-stage') {
        await openDemo(fixturePage);
        assert.equal(await fixturePage.locator('#find-mailbox').isDisabled(), true);
        assert.equal(await fixturePage.locator('#try-demo-coin').isDisabled(), true);
      } else assert.equal(await fixturePage.locator('#sample-invest, #investment-dialog, #demo-wallet-receipt').count(), 0, 'Real towns do not advertise the sample-only demo');
      await fixtureContext.close();
      console.log(`Mailbox eligibility guard passed: ${kind}.`);
    }
    assert.deepEqual(audit.errors, []); assert.deepEqual(audit.external, []); assert.deepEqual(audit.writes, []);
    console.log(JSON.stringify({ scope, audit }, null, 2));
  } catch (error) {
    const pages = browser.contexts().flatMap(context => context.pages());
    if (pages.length) await pages.at(-1).screenshot({ path: 'private/qa/mailbox-failure.png' }).catch(() => {});
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
