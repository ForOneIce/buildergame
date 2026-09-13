const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
const baseUrl = process.env.DEMO_URL || 'http://127.0.0.1:5173/';

// Exercise the optional loading shell only. The replacement SDK is an explicitly
// local UI stub: it cannot authenticate, create wallets, or submit transactions.
const walletStub = `window.__panelFixture.moduleLoaded = true;
export function mountWalletPanel(host) {
  window.__panelFixture.mounted++;
  return {
    open() {
      window.__panelFixture.opened++;
      const restore = document.activeElement;
      window.__panelFixture.focusAtOpen = restore?.id;
      host.innerHTML = '<section class="support-card" role="dialog" data-wallet-stub><p>Local wallet UI fixture</p><button id="stub-close">Close fixture</button></section>';
      const button = host.querySelector('button');
      button.onclick = () => { host.replaceChildren(); restore?.focus(); };
      button.focus();
    },
    dispose() { window.__panelFixture.disposed++; host.replaceChildren(); }
  };
}`;

async function scenario(browser, mode, action) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const audit = { errors: [], external: [], mutations: [], sdkRequests: 0 };
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  try {
    const fixtureUrl = new URL(`__support-panel-${mode}`, baseUrl).href;
    await context.addInitScript(() => {
      window.__panelFixture = { mounted: 0, opened: 0, disposed: 0, walletCalls: 0, confirmations: 0 };
      Object.defineProperty(window, 'ethereum', { configurable: true, value: { request() { window.__panelFixture.walletCalls++; throw Error('No wallet calls in this shell fixture'); } } });
      window.addEventListener('eip6963:requestProvider', () => window.__panelFixture.walletCalls++);
    });
    await context.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url());
      if (!['GET', 'HEAD'].includes(request.method())) { audit.mutations.push(request.url()); return route.abort(); }
      if (url.origin !== new URL(baseUrl).origin && /^https?:$/.test(url.protocol)) { audit.external.push(request.url()); return route.abort(); }
      if (request.url() === fixtureUrl) return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>BuilderGame support loading fixture</title></head><body><button id="launcher">Open support</button><button id="other">Other control</button><main id="fixture"></main></body></html>' });
      if (url.pathname === '/src/support/panel.ts') {
        const response = await route.fetch();
        const source = await response.text();
        const pattern = /const appId =[^;]+;/;
        assert.match(source, pattern, 'The fixture overrides only the optional app ID, not loading behavior');
        return route.fulfill({ response, body: source.replace(pattern, `const appId = ${JSON.stringify(mode === 'missing' ? '' : 'local-ui-test-only')};`) });
      }
      if (url.pathname.startsWith('/src/support/wallet-panel')) {
        audit.sdkRequests++;
        if (mode === 'failed') return route.abort('failed');
        await gate;
        return route.fulfill({ contentType: 'text/javascript', body: walletStub });
      }
      return route.continue();
    });
    const page = await context.newPage(); page.on('pageerror', error => audit.errors.push(error.message));
    await page.goto(fixtureUrl);
    await page.evaluate(async () => {
      const { mountSupportPanel } = await import('/src/support/panel.ts');
      const panel = mountSupportPanel(document.querySelector('#fixture'), { event: { id: 'local-loading-fixture', projects: [] }, t: en => en, onConfirmed() { window.__panelFixture.confirmations++; } });
      window.__panelFixture.api = panel;
      document.querySelector('#launcher').onclick = () => panel.open();
    });
    await action(page, audit, release);
    assert.equal(await page.evaluate(() => window.__panelFixture.walletCalls), 0);
    assert.equal(await page.evaluate(() => window.__panelFixture.confirmations), 0);
    assert.deepEqual(audit.errors, []); assert.deepEqual(audit.external, []); assert.deepEqual(audit.mutations, []);
    await page.evaluate(() => window.__panelFixture.api?.dispose());
    assert.equal(await page.locator('.support-island').count(), 0);
    console.log(`${mode}: passed; SDK module requests ${audit.sdkRequests}; no authentication, wallet calls, transactions, or external requests.`);
  } finally { release(); await context.close(); }
}

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_BIN ? { executablePath: process.env.BROWSER_BIN } : { channel: 'chrome' }) });
  try {
    await scenario(browser, 'missing', async (page, audit) => {
      await page.locator('#launcher').click();
      await page.locator('.support-card').waitFor();
      assert.match(await page.locator('.support-card').innerText(), /not available on this deployment/);
      assert.equal(audit.sdkRequests, 0, 'Missing app IDs never load the wallet SDK');
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement?.closest('.support-card') !== null), true, 'The one-button loading shell traps keyboard focus');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.support-card').count(), 0);
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'launcher');
      await page.locator('#launcher').click(); await page.getByRole('button', { name: 'Back to town' }).click();
      assert.equal(await page.locator('.support-card').count(), 0);
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'launcher');
    });

    await scenario(browser, 'failed', async (page, audit) => {
      await page.locator('#launcher').click();
      await page.getByRole('button', { name: 'Reload page' }).waitFor();
      assert.match(await page.locator('.support-card').innerText(), /could not load/);
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Reload page');
      await page.keyboard.press('Shift+Tab');
      assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Back to town');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.support-card').count(), 0);
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'launcher');
      await page.locator('#launcher').click();
      await page.getByRole('button', { name: 'Reload page' }).waitFor();
      assert.equal(audit.sdkRequests, 1, 'Reopening a failed cached import does not pretend to download it again');
      await Promise.all([page.waitForEvent('domcontentloaded'), page.getByRole('button', { name: 'Reload page' }).click()]);
      assert.equal(await page.locator('.support-card').count(), 0, 'The explicit reload action performs a real document navigation');
      assert.equal(await page.evaluate(() => window.__panelFixture.api), undefined);
    });

    await scenario(browser, 'delayed', async (page, audit, release) => {
      await page.locator('#launcher').click();
      await page.locator('.support-card').waitFor();
      await page.waitForFunction(() => document.querySelector('.support-card')?.textContent.includes('Opening'));
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.support-card').count(), 0);
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'launcher');
      await page.locator('#launcher').click();
      await page.locator('.support-card').waitFor({ timeout: 3000 });
      assert.match(await page.locator('.support-card').innerText(), /Opening|taking longer|loading/i, 'Reopening an in-flight import remains visible and closable');
      assert.equal(audit.sdkRequests, 1, 'Reopening does not start duplicate SDK imports');
      release();
      await page.locator('[data-wallet-stub]').waitFor();
      assert.equal(await page.evaluate(() => window.__panelFixture.focusAtOpen), 'launcher', 'The loaded wallet receives the original launch control for focus restoration');
      assert.equal(await page.evaluate(() => window.__panelFixture.mounted), 1);
      await page.locator('#stub-close').click();
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'launcher');
      await page.locator('#launcher').click();
      await page.locator('[data-wallet-stub]').waitFor();
      assert.equal(await page.evaluate(() => window.__panelFixture.mounted), 1, 'Reopening reuses the mounted optional panel');
      assert.equal(await page.evaluate(() => window.__panelFixture.opened), 2);
      await page.locator('#stub-close').click();
    });

    await scenario(browser, 'disposed', async (page, audit, release) => {
      await page.locator('#launcher').click();
      await page.locator('.support-card').waitFor();
      await page.evaluate(() => window.__panelFixture.api.dispose());
      assert.equal(await page.locator('.support-island').count(), 0);
      release();
      await page.waitForFunction(() => window.__panelFixture.moduleLoaded === true);
      assert.equal(await page.evaluate(() => window.__panelFixture.mounted), 0, 'Late SDK loading cannot mount wallet UI after route disposal');
      assert.equal(await page.locator('.support-card, [data-wallet-stub]').count(), 0);
      assert.equal(audit.sdkRequests, 1);
    });
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
