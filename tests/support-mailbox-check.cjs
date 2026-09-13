const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const baseUrl = process.env.DEMO_URL || 'http://127.0.0.1:5173/';
const fixtureUrl = new URL('__support-mailbox-fixture', baseUrl).href;

// Local scene fixture only: no wallet SDK, signing, RPC, or chain transaction.
async function target(page, index) {
  await page.evaluate(index => {
    const fixture = window.__supportMailbox;
    if (!fixture.api.focusMailbox(fixture.projects[index].id)) throw Error('Fixture mailbox is unavailable');
  }, index);
  await page.waitForTimeout(120);
  const point = await page.evaluate(index => {
    const fixture = window.__supportMailbox;
    return fixture.api.mailboxPoints().find(point => point.id === fixture.projects[index].id);
  }, index);
  assert.equal(point.visible, true, 'The selected physical mailbox has a visible interaction target');
  await page.mouse.move(point.x, point.y);
  assert.equal(await page.locator('#fixture canvas').getAttribute('data-cursor'), 'coin');
  return point;
}

(async () => {
  fs.mkdirSync('private/qa', { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_BIN ? { executablePath: process.env.BROWSER_BIN } : { channel: 'chrome' }) });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
  const audit = { errors: [], external: [], mutations: [] };
  let page;
  try {
    await context.addInitScript(() => {
      window.__supportMailboxWalletCalls = 0;
      Object.defineProperty(window, 'ethereum', { configurable: true, value: { request() { window.__supportMailboxWalletCalls++; throw Error('No wallets in the physical-mailbox fixture'); } } });
      window.addEventListener('eip6963:requestProvider', () => window.__supportMailboxWalletCalls++);
    });
    await context.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url());
      if (!['GET', 'HEAD'].includes(request.method())) { audit.mutations.push(request.url()); return route.abort(); }
      if (url.origin !== new URL(baseUrl).origin && /^https?:$/.test(url.protocol)) { audit.external.push(request.url()); return route.abort(); }
      if (request.url() === fixtureUrl) return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>BuilderGame mailbox routing fixture</title></head><body><div id="fixture" style="position:fixed;inset:0"></div></body></html>' });
      return route.continue();
    });
    page = await context.newPage(); page.on('pageerror', error => audit.errors.push(error.message));
    await page.goto(fixtureUrl);
    await page.evaluate(async () => {
      const { createTown } = await import('/src/town.ts');
      const { sampleTown } = await import('/src/sample.mjs');
      const source = sampleTown(), projects = source.event.projects.slice(0, 2).map(project => ({ ...project, builder: { ...project.builder, avatar: undefined } }));
      const selected = [], clicks = [], arrivals = [];
      const api = createTown(document.querySelector('#fixture'), projects, (id, open) => selected.push({ id, open }), 'flat', {
        mailboxDemo: true,
        onMailboxClick(id) { clicks.push(id); return id === projects[0].id; },
        mailboxHint(id) { return id === projects[0].id ? 'Support this builder · Sepolia test ETH' : undefined; },
        onMailbox(id) { arrivals.push(id); },
      });
      const snapshot = structuredClone(source.history.snapshots.at(-1));
      snapshot.projects = projects.map(project => ({ ...snapshot.projects.find(record => record.projectId === project.id), stage: 'decorated' }));
      window.__supportMailbox = { api, projects, snapshot, selected, clicks, arrivals };
      api.update(snapshot);
    });
    await page.locator('#fixture[data-town-ready="true"]').waitFor({ timeout: 60000 });
    await page.waitForFunction(() => window.__supportMailbox.api.mailboxPoints().every(point => point.visible));

    const configured = await target(page, 0);
    assert.equal(await page.locator('#fixture .scene-greeting').innerText(), 'Support this builder · Sepolia test ETH', 'Configured mailboxes show the caller-provided support hint');
    await page.mouse.click(configured.x, configured.y);
    assert.deepEqual(await page.evaluate(() => window.__supportMailbox.clicks), [configured.id], 'The real physical click reaches the confirmation callback');
    await page.waitForTimeout(1450);
    assert.deepEqual(await page.evaluate(() => window.__supportMailbox.arrivals), [], 'A handled support click cannot auto-toss or claim a virtual arrival before confirmation');
    await page.mouse.move(configured.x + 1, configured.y);
    assert.equal(await page.locator('#fixture .scene-greeting').innerText(), 'Support this builder · Sepolia test ETH', 'No coin is in flight after the intercepted click');
    assert.deepEqual(await page.evaluate(() => window.__supportMailbox.selected), [], 'A mailbox click never falls through to the project sign or door');
    console.log('Configured mailbox click intercepts the coin animation and exposes its support hint.');

    const virtual = await target(page, 1);
    assert.equal(await page.locator('#fixture .scene-greeting').innerText(), 'Drop a demo coin', 'An unconfigured mailbox retains its original playful hint');
    await page.mouse.click(virtual.x, virtual.y);
    await page.waitForFunction(() => window.__supportMailbox.arrivals.length === 1);
    assert.deepEqual(await page.evaluate(() => window.__supportMailbox.clicks), [configured.id, virtual.id]);
    assert.deepEqual(await page.evaluate(() => window.__supportMailbox.arrivals), [virtual.id], 'Returning false keeps the original virtual delivery callback');
    assert.deepEqual(await page.evaluate(() => window.__supportMailbox.selected), []);
    await page.waitForTimeout(450);
    console.log('Unconfigured mailbox keeps the existing physical coin interaction and arrival.');

    await target(page, 0);
    const accepted = await page.evaluate(() => {
      const fixture = window.__supportMailbox;
      return fixture.api.tossCoin(fixture.projects[0].id);
    });
    assert.equal(accepted, true, 'The existing scene animation remains available for an explicit confirmed-success callback');
    await page.waitForFunction(() => window.__supportMailbox.arrivals.length === 2);
    assert.deepEqual(await page.evaluate(() => window.__supportMailbox.arrivals), [virtual.id, configured.id]);
    assert.deepEqual(await page.evaluate(() => window.__supportMailbox.clicks), [configured.id, virtual.id], 'Programmatic success animation does not reopen the confirmation callback');
    await page.screenshot({ path: 'private/qa/support-mailbox-routing.png' });
    console.log('Explicit success animation remains independent of the confirmation click handler.');

    assert.equal(await page.evaluate(() => window.__supportMailboxWalletCalls), 0);
    await page.evaluate(() => { window.__supportMailbox.api.dispose(); });
    assert.equal(await page.locator('#fixture canvas, #fixture .scene-greeting').count(), 0);
    assert.deepEqual(audit, { errors: [], external: [], mutations: [] });
    console.log(JSON.stringify(audit, null, 2));
  } catch (error) {
    await page?.screenshot({ path: 'private/qa/support-mailbox-failure.png' }).catch(() => {});
    throw error;
  } finally { await context.close(); await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
