const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
const baseUrl = process.env.DEMO_URL || 'http://127.0.0.1:5173/';

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_BIN ? { executablePath: process.env.BROWSER_BIN } : { channel: 'chrome' }) });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/session', route => route.fulfill({ json: { configured: false, authenticated: false, login: null, avatar: null } }));
    await page.route('**/api/town', route => route.fulfill({ json: null }));
    await page.route('**/api/towns', route => route.fulfill({ json: { towns: [] } }));
    await page.route('**/data/town.json', route => route.fulfill({ status: 404, body: '' }));
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    for (const landscape of ['flat', 'valley', 'clouds']) {
      const result = await page.evaluate(async landscape => {
        const { createTown } = await import('/src/town.ts');
        const { sampleTown } = await import('/src/sample.mjs');
        const bundle = sampleTown(), snapshot = bundle.history.snapshots.at(-1);
        const host = document.createElement('div'); host.id = 'camera-fixture';
        Object.assign(host.style, { position: 'fixed', inset: '0', zIndex: '9999' }); document.body.append(host);
        const normal = createTown(host, bundle.event.projects, () => {}, landscape, { mailboxDemo: true });
        normal.update(snapshot);
        const standard = normal.mailboxPoints();
        for (let i = 0; i < 4; i++) normal.zoom(1);
        const fourSteps = normal.mailboxPoints();
        normal.reset(); const standardReset = normal.mailboxPoints(); normal.dispose();
        const sample = createTown(host, bundle.event.projects, () => {}, landscape, { mailboxDemo: true, initialZoomSteps: 4 });
        sample.update(snapshot); const initial = sample.mailboxPoints();
        sample.zoom(-1); sample.focus(bundle.event.projects[3].id); sample.reset();
        const reset = sample.mailboxPoints(); sample.dispose(); host.remove();
        return { standard, standardReset, fourSteps, initial, reset };
      }, landscape);
      const equalProjection = (actual, expected, label) => {
        assert.equal(actual.length, expected.length);
        for (let i = 0; i < actual.length; i++) {
          assert.equal(actual[i].id, expected[i].id);
          assert.ok(Math.hypot(actual[i].x - expected[i].x, actual[i].y - expected[i].y) < .05, `${landscape}: ${label} preserves the actual camera projection for ${actual[i].id}`);
        }
      };
      equalProjection(result.initial, result.fourSteps, 'Sample entrance equals four normal zoom steps');
      equalProjection(result.reset, result.fourSteps, 'Sample reset returns to the closer view');
      equalProjection(result.standardReset, result.standard, 'Default reset retains the normal town fit');
      assert.ok(result.initial.some((point, i) => Math.hypot(point.x - result.standard[i].x, point.y - result.standard[i].y) > 10), 'The requested closer view differs visibly from the old fit');
    }
    assert.deepEqual(errors, []);
    console.log('Actual camera projections match four zoom-in steps for sample entrance/reset across flat, valley and clouds; default town fit stays unchanged.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
