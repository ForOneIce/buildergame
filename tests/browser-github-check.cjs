const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const baseUrl = process.env.DEMO_URL || 'http://127.0.0.1:5173/';
async function townReady(page) {
  await page.locator('#scene[data-town-ready="true"]').waitFor({ timeout: 60000 });
  await page.locator('#map-transition').waitFor({ state: 'hidden', timeout: 60000 });
}
(async () => {
  fs.mkdirSync('private/qa', { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_BIN ? { executablePath: process.env.BROWSER_BIN } : { channel: 'chrome' }) });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [], apiWrites = [], progressRequests = [], githubRequests = [];
    const token = 'fixture-token-never-a-real-credential';
    let rateLimited = false, heldListing;
    const deployed = new Map(), builtTownPaths = new Set();
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname.includes('/api/progress')) progressRequests.push(request.url());
      if (url.pathname.startsWith('/api/') && request.method() !== 'GET') apiWrites.push(request.url());
    });
    // Static deployment: no application backend or published data is available.
    await page.route('**/api/**', route => route.fulfill({ status: 404, json: { error: 'Static fixture has no application backend' } }));
    await page.route('**/data/**', route => {
      const town = deployed.get(new URL(route.request().url()).pathname);
      return route.fulfill(town ? { json: town } : { status: 404, json: { error: 'No deployed fixture yet' } });
    });
    // Static hosts have no SPA fallback for town directories that were never built.
    await page.route('**/towns/**', route => route.request().resourceType() === 'document' && !builtTownPaths.has(new URL(route.request().url()).pathname)
      ? route.fulfill({ status: 404, contentType: 'text/html', body: '<h1>Static file not found</h1>' }) : route.fallback());
    const owner = { login: 'fixture-builder', html_url: 'https://github.com/fixture-builder', avatar_url: 'https://avatars.githubusercontent.com/u/1', type: 'User' };
    const repo = { name: 'fixture-project', html_url: 'https://github.com/fixture-builder/fixture-project', description: 'Fictional public project', private: false, visibility: 'public', size: 1, default_branch: 'main', stargazers_count: 8, forks_count: 4, owner };
    await page.route('https://api.github.com/**', async route => {
      const request = route.request(), path = new URL(request.url()).pathname, auth = request.headers().authorization;
      githubRequests.push({ path, auth });
      if (path === '/user') return route.fulfill(auth === `Bearer ${token}` ? { json: { id: 1001, ...owner } } : { status: 401, json: { message: 'Bad credentials' } });
      if (path === '/users/fixture-builder/repos') {
        const held = heldListing; heldListing = undefined;
        if (held) { held.arrived(); await held.release; }
        try { await route.fulfill({ json: [repo, { ...repo, name: 'private-fixture', private: true, visibility: 'private' }] }); }
        catch (error) { if (!held) throw error; } // The held request is deliberately aborted by disconnect.
        finally { held?.finished(); }
        return;
      }
      if (rateLimited) return route.fulfill({ status: 403, headers: { 'x-ratelimit-remaining': '0', 'access-control-expose-headers': 'x-ratelimit-remaining' }, json: { message: 'Rate limit exceeded' } });
      if (path === '/repos/fixture-builder/fixture-project/commits') return route.fulfill({ json: [{ sha: 'fixture-head' }], headers: { link: '<https://api.github.com/repos/fixture-builder/fixture-project/commits?per_page=1&page=25>; rel="last"', 'access-control-expose-headers': 'link' } });
      if (path === '/repos/fixture-builder/fixture-project') return route.fulfill({ json: repo });
      throw Error(`Unexpected GitHub fixture path: ${path}`);
    });
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.locator('#player-login').click(); await page.locator('#github-connect-dialog[open]').waitFor();
    assert.equal(await page.locator('#github-token').getAttribute('type'), 'password');
    await page.locator('#github-token').fill('invalid-fixture-token'); await page.locator('#connect-token').click();
    await page.waitForFunction(() => document.querySelector('#github-token-error').textContent.trim().length > 0);
    assert.match(await page.locator('#github-token-error').textContent(), /token|credentials|authorization/i);
    assert.equal(await page.locator('#logout').count(), 0);
    await page.locator('#github-token').fill(token); await page.locator('#connect-token').click(); await page.locator('.setup-page').waitFor();
    assert.equal(await page.locator('#username').inputValue(), 'fixture-builder');
    assert.equal(await page.locator('#username').getAttribute('readonly'), '');
    assert.equal(await page.locator('#publish').isDisabled(), true, 'A browser token does not imply server publication');
    await page.locator('#load-repos').click(); await page.waitForFunction(() => !document.querySelector('#load-repos').disabled);
    assert.equal(await page.locator('[data-repo]').count(), 1, 'Private repositories are filtered from the public town selection');
    await page.locator('[data-repo]').check(); await page.locator('#town-name').fill('Browser-only fixture'); await page.locator('#snapshot-label').fill('First direct capture');
    await page.locator('#capture').click(); await page.locator('.success-page').waitFor();
    assert.equal(await page.locator('#published-town-url').count(), 0, 'A local snapshot is not advertised as publicly deployed');
    const saving = page.waitForEvent('download'); await page.locator('[data-export]').click();
    const downloaded = await saving; await downloaded.saveAs('private/qa/browser-github-backup.json');
    const backup = JSON.parse(fs.readFileSync('private/qa/browser-github-backup.json', 'utf8'));
    assert.equal(backup.history.snapshots.length, 2); assert.equal(backup.history.snapshots[0].kind, 'baseline');
    assert.equal(backup.history.snapshots[0].projects[0].metrics, null);
    assert.equal(backup.history.snapshots[1].label, 'First direct capture'); assert.equal(backup.history.snapshots[1].projects[0].metrics.commits, 25);
    assert.equal(downloaded.suggestedFilename(), `${backup.event.deployment.slug}.json`);
    assert.equal(JSON.stringify(backup).includes(token), false);
    const stored = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage }, cookie: document.cookie }));
    assert.equal(stored.includes(token), false, 'Tokens never enter local/session storage or cookies');
    assert.ok(githubRequests.filter(request => request.path !== '/user').every(request => request.auth === `Bearer ${token}`), 'Direct authenticated requests carry the in-memory token only to GitHub');
    await page.locator('[data-enter]').click(); await townReady(page); const address = page.url();
    assert.equal(new URL(address).pathname, new URL(baseUrl).pathname, 'An unpublished town uses the existing static shell');
    assert.equal(new URL(address).searchParams.get('preview'), backup.event.deployment.slug);
    assert.equal(await page.locator('#play').isEnabled(), true); await page.locator('#play').click();
    assert.match(await page.locator('#snapshot-count').innerText(), /0 \/ 1/);
    await page.waitForFunction(() => document.querySelector('#timeline').value === '1');
    await page.screenshot({ path: 'private/qa/browser-github-town.png' });

    rateLimited = true; await page.locator('#manage').click(); await page.locator('#snapshot-label').fill('Unavailable recapture'); await page.locator('#capture').click();
    await page.locator('#notice.error').waitFor(); assert.match(await page.locator('#notice').textContent(), /request limit|rate limit/i);
    await page.locator('#home').click(); await page.locator('[data-enter]').click(); await townReady(page);
    const preserved = page.waitForEvent('download'); await page.locator('.map-nav [data-export]').click(); await (await preserved).saveAs('private/qa/browser-github-preserved.json');
    assert.deepEqual(JSON.parse(fs.readFileSync('private/qa/browser-github-preserved.json', 'utf8')), backup, 'A failed explicit recapture leaves the last snapshot untouched');
    rateLimited = false;
    const refresh = await page.reload({ waitUntil: 'domcontentloaded' }); assert.equal(refresh.status(), 200, 'Refreshing an unpublished preview never requests an unbuilt town directory'); await townReady(page);
    assert.equal(page.url(), address); assert.equal(await page.locator('#logout').count(), 0, 'Reload clears the in-memory connection');
    await page.locator('#home').click(); await page.locator('[data-create]').click(); await page.locator('[data-mode="personal"]').click();
    await page.locator('#username').fill('fixture-builder'); await page.locator('#load-repos').click(); await page.waitForFunction(() => !document.querySelector('#load-repos').disabled);
    assert.equal(githubRequests.at(-1).path, '/users/fixture-builder/repos');
    assert.equal(githubRequests.at(-1).auth, undefined, 'The old token is absent from requests after reload');
    // A response arriving after disconnect must not restore the previous owner's repository list.
    await page.locator('#player-login').click(); await page.locator('#github-token').fill(token); await page.locator('#connect-token').click(); await page.locator('#logout').waitFor();
    let arrived, release, finished;
    const pending = new Promise(resolve => { arrived = resolve; }), completion = new Promise(resolve => { finished = resolve; });
    heldListing = { arrived, finished, release: new Promise(resolve => { release = resolve; }) };
    await page.locator('#load-repos').click(); await pending;
    await page.locator('#logout').click(); assert.equal(await page.locator('#logout').count(), 0);
    assert.equal(await page.locator('[data-repo]').count(), 0);
    release(); await completion; await page.waitForTimeout(100);
    assert.equal(await page.locator('#logout').count(), 0);
    assert.equal(await page.locator('[data-repo]').count(), 0, 'A late repository response cannot repopulate the disconnected account');
    await page.locator('#username').fill('fixture-builder'); await page.locator('#load-repos').click(); await page.waitForFunction(() => !document.querySelector('#load-repos').disabled);
    assert.equal(githubRequests.at(-1).auth, undefined, 'Disconnect also clears the request token without a reload');

    // Publish the first captured JSON as a static fixture, then keep a newer PAT capture locally.
    const slug = backup.event.deployment.slug, publishedUrl = new URL(`towns/${slug}/`, baseUrl);
    builtTownPaths.add(publishedUrl.pathname);
    deployed.set(new URL(`data/towns/${slug}.json`, baseUrl).pathname, structuredClone(backup));
    await page.goto(publishedUrl.href, { waitUntil: 'domcontentloaded' }); await townReady(page);
    assert.match(await page.locator('#snapshot-count').textContent(), /1 \/ 1/);
    await page.locator('#player-login').click(); await page.locator('#github-token').fill(token); await page.locator('#connect-token').click(); await page.locator('.setup-page').waitFor();
    await page.locator('#home').click(); await page.locator('[data-enter]').click(); await townReady(page); await page.locator('#manage').click();
    await page.locator('#snapshot-label').fill('Unpublished second snapshot'); await page.locator('#capture').click(); await page.locator('.success-page').waitFor();
    assert.equal(await page.locator('#published-town-url').count(), 0);
    const draftDownload = page.waitForEvent('download'); await page.locator('[data-export]').click(); await (await draftDownload).saveAs('private/qa/browser-github-local-draft.json');
    const localDraft = JSON.parse(fs.readFileSync('private/qa/browser-github-local-draft.json', 'utf8'));
    assert.equal(localDraft.history.snapshots.length, 3); assert.deepEqual(localDraft.history.snapshots.slice(0, 2), backup.history.snapshots);
    await page.locator('[data-enter]').click(); await townReady(page);
    assert.equal(new URL(page.url()).searchParams.get('preview'), slug);
    await page.goto(publishedUrl.href, { waitUntil: 'domcontentloaded' }); await townReady(page);
    assert.match(await page.locator('#snapshot-count').textContent(), /2 \/ 2/);
    assert.match(await page.locator('#snapshot-label').textContent(), /Unpublished second snapshot/);
    await page.locator('#home').click(); await page.locator('[data-enter]').click(); await townReady(page);
    assert.equal(new URL(page.url()).searchParams.get('preview'), slug, 'A recovered local append remains unpublished');
    const draftRefresh = await page.reload({ waitUntil: 'domcontentloaded' }); assert.equal(draftRefresh.status(), 200); await townReady(page);
    assert.match(await page.locator('#snapshot-count').textContent(), /2 \/ 2/);

    // A cache must match the immutable published prefix and town identity before it can win.
    const altered = structuredClone(localDraft); altered.history.snapshots[1].label = 'Rewritten public history';
    const unrelated = structuredClone(localDraft); unrelated.event.id = 'unrelated-cache'; unrelated.history.eventId = unrelated.event.id;
    const older = structuredClone(backup); older.history.snapshots = older.history.snapshots.slice(0, 1);
    for (const [label, candidate] of [['rewritten', altered], ['unrelated', unrelated], ['older', older]]) {
      await page.evaluate(({ slug, candidate }) => {
        localStorage.setItem('bg-town:' + slug, JSON.stringify(candidate));
        localStorage.setItem('bg-town-backup', JSON.stringify(candidate));
      }, { slug, candidate });
      await page.goto(publishedUrl.href, { waitUntil: 'domcontentloaded' }); await townReady(page);
      assert.match(await page.locator('#snapshot-count').textContent(), /1 \/ 1/, `${label} cache must not replace the deployed history`);
      assert.match(await page.locator('#snapshot-label').textContent(), /First direct capture/);
      await page.locator('#home').click(); await page.locator('[data-enter]').click(); await townReady(page);
      assert.equal(page.url(), publishedUrl.href, `${label} cache must not mark the deployed town as an unpublished draft`);
    }
    assert.deepEqual(apiWrites, []); assert.deepEqual(progressRequests, []); assert.deepEqual(errors, []);
    console.log('Static PAT capture, token lifetime, failure/late-list isolation, reloadable unpublished previews, recovery of newer local snapshots and rejection of rewritten/unrelated/older caches passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
