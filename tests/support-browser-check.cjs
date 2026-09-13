const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const baseUrl = process.env.DEMO_URL || 'http://127.0.0.1:5173/';
// Public checksum fixture only; never a live transaction recipient.
const recipient = '0x52908400098527886E0F7030069857D2E4169EE7';

async function downloadJson(page, selector) {
  const pending = page.waitForEvent('download');
  await page.locator(selector).click();
  const stream = await (await pending).createReadStream(), chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
async function importJson(page, input) {
  await page.locator('#import').setInputFiles({ name: 'fixture.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(input)) });
  const message = input.kind === 'buildergame-plan/v1' ? 'Plan restored.' : input.format ? 'Backup restored' : 'Configuration loaded.';
  await page.waitForFunction(message => document.querySelector('#notice')?.textContent.includes(message), message);
}
async function ready(page) {
  await page.locator('#scene[data-town-ready="true"]').waitFor({ timeout: 60000 });
  await page.locator('#map-transition').waitFor({ state: 'hidden', timeout: 60000 });
}
async function acknowledgeCreatorNotice(page) {
  await page.locator('.support-setup-guide[open]').waitFor();
  assert.equal(await page.locator('[data-guide-ack]').isChecked(), false, 'Each notice opens with a fresh acknowledgment');
  assert.equal(await page.locator('[data-guide-continue]').isDisabled(), true);
  await page.locator('[data-guide-ack]').check();
  await page.locator('[data-guide-continue]').click();
  await page.locator('.support-setup-guide').waitFor({ state: 'detached' });
}

(async () => {
  const { sampleTown } = await import('../src/sample.mjs');
  const { baselineSnapshot, makeRecord } = await import('../src/model.mjs');
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_BIN ? { executablePath: process.env.BROWSER_BIN } : { channel: 'chrome' }) });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const requests = [], errors = [], external = [];
  try {
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      requests.push(url.pathname);
      // Exercise an unavailable optional SDK without contacting authentication or a chain.
      if (url.pathname.includes('/support/wallet-panel')) return route.abort();
      if (url.origin !== new URL(baseUrl).origin && /^https?:$/.test(url.protocol)) { external.push(url.href); return route.abort(); }
      if (url.pathname === '/api/session') return route.fulfill({ json: { authenticated: false, configured: false, login: null } });
      if (url.pathname === '/api/town') return route.fulfill({ json: null });
      if (url.pathname === '/api/towns') return route.fulfill({ json: { towns: [] } });
      if (url.pathname === '/data/town.json') return route.fulfill({ status: 404, body: '' });
      if (url.pathname === '/api/capture') {
        const { event } = route.request().postDataJSON();
        const capturedAt = '2026-09-13T08:00:00.000Z';
        const snapshot = { id: 'support-browser-snapshot', label: 'Fixture snapshot', capturedAt, projects: event.projects.map(project => makeRecord(project, { commits: 150, stars: 80, forks: 40 }, event.rule, capturedAt)) };
        return route.fulfill({ json: { bundle: { format: 'buildergame/v1', event, history: { schemaVersion: 1, eventId: event.id, sampleData: false, snapshots: [baselineSnapshot(event, '2026-09-13T07:59:00.000Z'), snapshot] } }, published: false, failures: [] } });
      }
      return route.continue();
    });
    await context.addInitScript(() => {
      window.__supportProviderCalls = 0;
      Object.defineProperty(window, 'ethereum', { configurable: true, value: { request() { window.__supportProviderCalls++; throw Error('No wallet calls in this fixture'); } } });
      window.addEventListener('eip6963:requestProvider', () => window.__supportProviderCalls++);
    });
    const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
    await page.goto(baseUrl);
    await page.locator('[data-create]').click();
    await page.locator('[data-mode="hackathon"]').click();
    await page.locator('#town-name').fill('Support browser fixture');
    await page.locator('#repositories').fill('https://github.com/example/one\nhttps://github.com/example/two');
    await page.locator('.support-settings > summary').click();
    await page.locator('.support-setup-guide[open]').waitFor();
    assert.equal(await page.locator('#support-recipients').isDisabled(), true);
    assert.equal(await page.locator('[data-guide-continue]').isDisabled(), true);
    assert.match(await page.locator('.support-setup-guide').innerText(), /does not connect a wallet or authorize a transfer/);
    await page.keyboard.press('Escape');
    await page.locator('.support-setup-guide').waitFor({ state: 'detached' });
    assert.equal(await page.locator('.support-settings').evaluate(element => element.open), false);
    assert.equal(await page.locator('#support-recipients').isDisabled(), true);
    const backup = page.locator('.config-backup').filter({ has: page.locator('#export-config') });
    await backup.locator(':scope > summary').click();
    const withoutSupport = await downloadJson(page, '#export-config');
    assert.equal(Object.hasOwn(withoutSupport, 'support'), false, 'Cancelling the optional notice still permits the original town configuration');
    assert.equal(requests.some(url => /support\/(panel|wallet-panel)/.test(url)), false);
    assert.equal(await page.evaluate(() => window.__supportProviderCalls), 0);
    await page.locator('.support-settings > summary').click();
    await acknowledgeCreatorNotice(page);
    assert.equal(await page.locator('#support-recipients').isDisabled(), false);
    await page.locator('#support-recipients').fill(`example/one = ${recipient}`);
    await page.locator('.support-settings > summary').click();
    await page.locator('.support-settings > summary').click();
    assert.equal(await page.locator('.support-setup-guide').count(), 0, 'Acknowledged same-page edits do not reopen the gate');
    await page.locator('[data-support-guide]').click();
    await page.locator('.support-setup-guide[open]').waitFor();
    assert.equal(await page.locator('[data-guide-ack]').isChecked(), false);
    await page.locator('[data-guide-cancel]').click();
    assert.equal(await page.locator('#support-recipients').isDisabled(), false);
    const configuration = await downloadJson(page, '#export-config');
    assert.deepEqual(configuration.support, { version: 1, chainId: 11155111, projectRecipients: { 'example/one': recipient } });
    const draft = await downloadJson(page, '#save-draft');
    assert.equal(draft.supportRecipientsText, `example/one = ${recipient}`);
    await page.locator('#support-recipients').fill('unknown/project = ' + recipient);
    await page.locator('#export-config').click();
    assert.match(await page.locator('#notice').innerText(), /does not match/);
    await importJson(page, draft);
    await page.locator('#support-recipients').waitFor();
    assert.equal(await page.locator('#support-recipients').inputValue(), draft.supportRecipientsText);
    await page.locator('#capture').click();
    await page.locator('.success-page').waitFor();
    await page.locator('[data-enter]').click(); await ready(page);
    assert.equal(await page.locator('#town-wallet').count(), 1);
    assert.equal(await page.locator('#sample-invest').count(), 0);
    assert.equal(requests.some(url => /support\/(panel|wallet-panel)/.test(url)), false, 'Creating and browsing a configured town does not load optional support UI');
    assert.equal(await page.evaluate(() => window.__supportProviderCalls), 0);
    await page.locator('#show-projects').click();
    await page.locator('[data-project]').nth(1).click();
    assert.equal(await page.locator('[data-support-project]').count(), 0, 'Unmapped project has no organizer-wallet fallback');
    await page.locator('#close').click();
    await page.locator('[data-project]').first().click();
    assert.equal(await page.locator('[data-support-project]').count(), 1);
    await page.locator('[data-support-project]').click();
    await page.locator('.support-card').waitFor();
    await page.waitForFunction(() => /not available|could not load/.test(document.querySelector('.support-card')?.textContent || ''));
    assert.equal(await page.locator('#detail[open]').count(), 0, 'Support replaces the project dialog without modal overlap');
    assert.equal(await page.locator('#demo-wallet-receipt:visible').count(), 0, 'Opening a real-support card never fakes a coin receipt');
    await page.keyboard.press('Escape');
    await page.locator('.support-card').waitFor({ state: 'hidden' });
    // The earliest snapshot still exposes configured support through accessible project cards.
    await page.locator('#timeline').fill('0');
    await page.locator('[data-project]').first().click();
    assert.equal(await page.locator('[data-support-project]').count(), 1);
    await page.locator('#close').click();
    await page.locator('#manage').click();
    assert.equal(await page.locator('#support-recipients').inputValue(), draft.supportRecipientsText);
    fs.mkdirSync('private/qa', { recursive: true });
    await page.screenshot({ path: 'private/qa/support-planner.png' });
    // Old backup import keeps the wallet extension entirely absent.
    const old = sampleTown();
    await importJson(page, old); await ready(page);
    assert.equal(await page.locator('#town-wallet').count(), 0);
    await page.locator('#show-projects').click(); await page.locator('[data-project]').first().click();
    assert.equal(await page.locator('[data-support-project]').count(), 0);
    assert.equal(await page.evaluate(() => window.__supportProviderCalls), 0);
    assert.equal(await page.locator('.support-setup-guide, .support-card').count(), 0, 'A legacy town does not show any wallet notice');
    await page.locator('#close').click();
    await page.locator('#sample-invest').click();
    assert.doesNotMatch(await page.locator('#investment-dialog').innerText(), /wallet|connect|coming later/i);
    await page.keyboard.press('Escape');
    // A fresh document does not reuse acknowledgment from another creator session.
    await page.goto(baseUrl);
    await page.locator('[data-create]').click();
    await importJson(page, configuration);
    await page.locator('.support-setup-guide[open]').waitFor();
    assert.equal(await page.locator('#support-recipients').inputValue(), draft.supportRecipientsText);
    assert.equal(await page.locator('#support-recipients').isDisabled(), true);
    await page.locator('[data-guide-cancel]').click();
    await backup.locator(':scope > summary').click();
    await page.locator('#export-config').click();
    assert.match(await page.locator('#notice').innerText(), /Read and acknowledge/);
    await page.locator('.support-settings > summary').click();
    await acknowledgeCreatorNotice(page);
    // The translated notice has the same unchecked gate and harmless cancellation.
    await page.locator('#language').click();
    await page.locator('[data-support-guide]').click();
    await page.locator('.support-setup-guide[open]').waitFor();
    assert.match(await page.locator('.support-setup-guide').innerText(), /不启用也能正常使用小镇/);
    assert.match(await page.locator('.support-setup-guide').innerText(), /不会连接钱包或授权转账/);
    assert.equal(await page.locator('[data-guide-ack]').isChecked(), false);
    assert.equal(await page.locator('[data-guide-continue]').isDisabled(), true);
    await page.locator('[data-guide-cancel]').click();
    assert.equal(await page.evaluate(() => window.__supportProviderCalls), 0);
    assert.deepEqual(external, []);
    assert.deepEqual(errors, []);
    console.log('Bilingual creator notice/cancel/acknowledgment, imported-address gate, planner/export/import/capture, mixed recipients, missing SDK, lazy loading and legacy no-wallet checks passed. No real Privy session or transfer is claimed.');
  } finally { await context.close(); await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
