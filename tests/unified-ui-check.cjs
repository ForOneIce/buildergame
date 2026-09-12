const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const baseUrl = process.env.DEMO_URL || 'http://127.0.0.1:5173/';
const output = 'private/qa';
const viewports = [{ width: 1440, height: 1000 }, { width: 768, height: 1024 }, { width: 360, height: 800 }];

async function header(page, screen) {
  await page.locator('.map-header .wood-logo').waitFor();
  assert.equal(await page.locator('.map-header').count(), 1, `${screen}: one shared header`);
  assert.match(await page.locator('.wood-logo').innerText(), /buildergame/i);
  for (const id of ['home', 'language', 'player-login']) {
    assert.equal(await page.locator(`#${id}`).isVisible(), true, `${screen}: ${id} remains available`);
  }
}

async function layout(page, label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  assert.equal(overflow, false, `${label}: page must fit horizontally`);
  const clipping = await page.locator('.map-header, #detail[open], #project-entry[open]').evaluateAll(elements =>
    elements.filter(element => {
      const bounds = element.getBoundingClientRect();
      return bounds.width > 0 && (bounds.left < -1 || bounds.right > innerWidth + 1);
    }).map(element => element.id || element.className)
  );
  assert.deepEqual(clipping, [], `${label}: visible header/dialog must stay inside the viewport`);
  if (page.viewportSize().width <= 400) {
    const small = await page.locator('.map-header button, .camera-controls button, .map-nav button').evaluateAll(buttons =>
      buttons.filter(button => {
        const bounds = button.getBoundingClientRect();
        return bounds.width > 0 && bounds.height > 0 && (bounds.width < 44 || bounds.height < 44);
      }).map(button => button.id || button.textContent.trim())
    );
    assert.deepEqual(small, [], `${label}: principal touch buttons need a 44px hit area`);
  }
}

async function townReady(page) {
  await page.locator('#scene[data-town-ready="true"]').waitFor({ timeout: 60000 });
  await page.locator('#map-transition').waitFor({ state: 'hidden', timeout: 60000 });
  assert.equal(await page.locator('#scene canvas').count() > 0, true, 'Real town canvas is available');
}

async function screenshot(page, screen, width) {
  await page.screenshot({ path: `${output}/unified-${screen}-${width}.png`, fullPage: screen !== 'town', animations: 'disabled' });
}

async function delayedTownArrival(page) {
  let release, reached, timeout;
  const gate = new Promise(resolve => { release = resolve; });
  const requestReached = new Promise(resolve => { reached = resolve; });
  const pattern = '**/models/*-low.glb';
  const hold = async route => { reached(); await gate; await route.continue(); };
  await page.route(pattern, hold);
  try {
    await page.locator('[data-enter]').first().click();
    await Promise.race([requestReached, new Promise((_, reject) => {
      timeout = setTimeout(() => reject(Error('No town model request reached the delayed route')), 10000);
    })]);
    await page.locator('#map-transition').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#scene').getAttribute('aria-busy'), 'true');
    assert.notEqual(await page.locator('#scene').getAttribute('data-town-ready'), 'true');
    assert.equal(await page.locator('.map-header').evaluate(element => element.inert), true);
    assert.equal(await page.locator('#scene').evaluate(element => element.closest('main').inert), true);
    await page.locator('#show-projects').evaluate(element => element.focus());
    assert.notEqual(await page.evaluate(() => document.activeElement.id), 'show-projects', 'Loading prevents focus entering the inactive world');
    assert.equal(await page.locator('[data-arrival-continue]').isEnabled(), true);
    assert.equal(await page.locator('[data-arrival-back]').isEnabled(), true);
  } finally {
    clearTimeout(timeout);
    release();
    await page.unroute(pattern, hold);
  }
  await townReady(page);
  assert.equal(await page.locator('.map-header').evaluate(element => element.inert), false);
  assert.equal(await page.locator('#scene').evaluate(element => element.closest('main').inert), false);
  assert.equal(await page.locator('#scene').getAttribute('aria-busy'), null);
}

async function projectEntry(page, context, reducedMotion) {
  await page.locator('#show-projects').click();
  await page.locator('#project-list [data-project]').first().click();
  await page.locator('#detail[open]').waitFor();
  const title = await page.locator('#detail-title').textContent();
  const currentUrl = page.url();
  const pageCount = context.pages().length;
  for (const closeMethod of ['escape', 'close']) {
    await page.locator('#detail [data-visit]').click();
    await page.locator('#project-entry[open]').waitFor();
    assert.equal(await page.locator('#detail').isVisible(), false);
    assert.equal(await page.locator('#entry-title').textContent(), title);
    if (reducedMotion) {
      assert.equal(await page.locator('#entry-actions a[href]').count(), 1, 'Reduced-motion entry exposes its action without an animation delay');
      assert.equal(await page.locator('.entry-door > span').evaluate(element => getComputedStyle(element).transitionDuration), '0s');
    }
    const external = page.locator('#entry-actions a[href]');
    await external.waitFor();
    assert.equal(await external.getAttribute('href'), 'https://github.com/fixture-builder/fixture-project');
    assert.equal(await external.getAttribute('target'), '_blank');
    const rel = (await external.getAttribute('rel')).split(/\s+/);
    assert.ok(rel.includes('noopener') && rel.includes('noreferrer'));
    assert.equal(page.url(), currentUrl, 'Opening the door does not navigate away');
    assert.equal(context.pages().length, pageCount, 'The external destination requires a separate explicit click');
    await layout(page, 'project entry');
    if (closeMethod === 'escape') await page.keyboard.press('Escape');
    else await page.locator('#close-entry').click();
    await page.locator('#project-entry').waitFor({ state: 'hidden' });
    await page.locator('#detail[open]').waitFor();
    await page.waitForFunction(() => document.activeElement?.hasAttribute('data-visit'));
  }
  await page.locator('#close').click();
  await page.locator('#detail').waitFor({ state: 'hidden' });
  if (await page.locator('#project-panel').isVisible()) await page.locator('#close-projects').click();
}

async function installMocks(page, makeRecord) {
  const captures = [];
  // Fictional fixtures exercise real forms and validation without GitHub credentials or publication.
  await page.route('**/api/session', route => route.fulfill({ json: {
    configured: false, playerConfigured: false, authenticated: false, isDeployer: false, login: null, avatar: null,
  } }));
  await page.route('**/api/town', route => route.fulfill({ json: null }));
  await page.route('**/api/repos?**', route => route.fulfill({ json: {
    owner: 'fixture-builder', nextPage: null, repositories: [{
      repository: 'https://github.com/fixture-builder/fixture-project', name: 'fixture-project',
      description: 'A fictional public repository used for interface checks.',
      builder: { name: 'fixture-builder', url: 'https://github.com/fixture-builder' },
    }],
  } }));
  await page.route('**/api/capture', route => {
    const request = route.request().postDataJSON();
    const event = request.event;
    captures.push(request);
    assert.equal(request.publish, false, 'Guest capture must not publish');
    const capturedAt = '2026-09-12T00:00:00.000Z';
    const snapshot = {
      id: `ui-fixture-${captures.length}`, label: 'Snapshot 1', capturedAt,
      projects: event.projects.map(project => makeRecord(project, { commits: 10, stars: 10, forks: 10 }, event.rule, capturedAt)),
    };
    return route.fulfill({ json: { bundle: {
      format: 'buildergame/v1', event,
      history: { schemaVersion: 1, eventId: event.id, sampleData: false, snapshots: [snapshot] },
    }, failures: [], published: false } });
  });
  return captures;
}

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const { makeRecord } = await import('../src/model.mjs');
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_BIN ? { executablePath: process.env.BROWSER_BIN } : { channel: 'chrome' }) });
  const errors = [];
  try {
    // Close each context before the next viewport to avoid accumulating WebGL scenes.
    for (const viewport of viewports) {
      const width = viewport.width;
      const context = await browser.newContext({ viewport, reducedMotion: width === 360 ? 'reduce' : 'no-preference' });
      try {
        const page = await context.newPage();
        page.on('pageerror', error => errors.push(`${width}: ${error.message}`));
        const captures = await installMocks(page, makeRecord);
        await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
        await header(page, 'welcome');
        await layout(page, 'welcome');
        await screenshot(page, 'welcome', width);

        if (width === 1440) {
          assert.equal(await page.locator('[data-enter]').first().getAttribute('data-cursor'), 'walk');
          assert.equal(await page.locator('[data-create]').getAttribute('data-cursor'), 'build');
          assert.match(await page.locator('[data-enter]').first().evaluate(element => getComputedStyle(element).cursor), /steps\.png/);
          assert.match(await page.locator('[data-create]').evaluate(element => getComputedStyle(element).cursor), /tool_axe_single\.png/);
          await delayedTownArrival(page);
        } else {
          await page.locator('[data-enter]').first().click();
          await townReady(page);
        }
        if (width === 360) {
          assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
          assert.equal(await page.locator('#map-transition .map-fold').first().evaluate(element => getComputedStyle(element).animationName), 'none');
        }
        await header(page, 'town');
        await layout(page, 'town');
        await screenshot(page, 'town', width);

        await page.locator('#show-projects').click();
        const project = page.locator('#project-list [data-project]').first();
        const projectId = await project.getAttribute('data-project');
        const projectName = await project.locator('strong').innerText();
        await project.focus();
        await page.keyboard.press('Enter');
        await page.locator('#detail[open]').waitFor();
        assert.equal(await page.locator('#detail-title').innerText(), projectName);
        assert.equal(await page.locator('#detail a[href]').count(), 0, 'Fictional project cannot navigate to invented destinations');
        assert.equal(await page.locator('#detail [data-visit]').isDisabled(), true);
        if (width === 1440) assert.equal(await page.locator('#detail [data-visit]').evaluate(element => getComputedStyle(element).cursor), 'not-allowed');
        assert.match(await page.locator('#visited-count').textContent(), /^1\s*\/\s*9$/);
        if (width <= 400) assert.equal(await page.locator('#project-panel').isVisible(), false, 'Mobile card replaces the directory layer');
        await layout(page, 'project card');
        await screenshot(page, 'card', width);
        await page.locator('#close').click();
        await page.locator('#detail').waitFor({ state: 'hidden' });
        await page.waitForFunction(() => document.activeElement?.id === 'show-projects' || document.activeElement?.hasAttribute('data-project'));
        const focus = await page.evaluate(() => {
          const element = document.activeElement;
          const bounds = element.getBoundingClientRect();
          return { id: element.id, project: element.getAttribute('data-project'), visible: bounds.width > 0 && bounds.height > 0 };
        });
        assert.ok(focus.visible && (focus.id === 'show-projects' || focus.project === projectId), 'Closing the card returns focus to a usable directory control');
        if (await page.locator('#project-panel').isVisible()) await page.locator('#close-projects').click();

        if (width === 1440) {
          await page.locator('#timeline').fill('0');
          await page.locator('#timeline').dispatchEvent('input');
          assert.match(await page.locator('#snapshot-count').innerText(), /^1\s*\/\s*3$/);
          const saving = page.waitForEvent('download');
          await page.locator('.map-nav [data-export]').click();
          const download = await saving;
          await download.saveAs(`${output}/unified-sample-backup.json`);
          const saved = JSON.parse(fs.readFileSync(`${output}/unified-sample-backup.json`, 'utf8'));
          assert.equal(saved.history.snapshots.length, 3);
          assert.equal(saved.event.projects.length, 9);
        }

        await page.locator('#home').click();
        await page.locator('[data-mode="hackathon"]').first().click();
        await page.locator('#town-name').waitFor();
        await header(page, 'setup');
        await page.locator('#town-name').fill(`Interface fixture ${width}`);
        await page.locator('#repositories').fill('https://github.com/fixture-builder/fixture-project');
        await page.locator('#landscape').selectOption('valley');
        if (width === 1440) {
          assert.match(await page.locator('body').evaluate(element => getComputedStyle(element).cursor), /tool_axe_single\.png/);
          assert.equal(await page.locator('#town-name').evaluate(element => getComputedStyle(element).cursor), 'text');
        }
        await layout(page, 'setup');
        await screenshot(page, 'setup', width);

        if (width === 360) {
          await page.locator('#language').click();
          assert.equal(await page.locator('html').getAttribute('lang'), 'zh-CN');
          assert.equal(await page.locator('#town-name').inputValue(), `Interface fixture ${width}`);
          assert.match(await page.locator('#repositories').inputValue(), /fixture-project/);
          assert.equal(await page.locator('#landscape').inputValue(), 'valley');
          await layout(page, 'Chinese setup');
          await screenshot(page, 'setup-zh', width);
        }

        await page.locator('#capture').click();
        await page.locator('.success-page').waitFor();
        await header(page, 'success');
        await layout(page, 'success');
        await screenshot(page, 'success', width);
        assert.equal(captures.length, 1);
        assert.equal(captures[0].event.name, `Interface fixture ${width}`);
        assert.equal(captures[0].event.landscape, 'valley');
        await page.locator('[data-enter]').first().click();
        await townReady(page);
        assert.match(await page.locator('.town-info').innerText(), new RegExp(`Interface fixture ${width}`));
        await header(page, 'captured town');
        if (width === 1440 || width === 360) await projectEntry(page, context, width === 360);
        if (width === 360) {
          await page.locator('#language').click();
          await townReady(page);
          assert.equal(await page.locator('html').getAttribute('lang'), 'en');
          await page.route('**/api/session', route => route.fulfill({ json: {
            configured: false, playerConfigured: true, authenticated: true, isDeployer: false,
            login: 'fixture-builder-with-a-long-public-name', avatar: null,
          } }));
          await page.route('**/api/progress**', route => route.fulfill({ json: { visited: [] } }));
          await page.reload({ waitUntil: 'domcontentloaded' });
          await page.locator('#logout').waitFor();
          await header(page, 'signed-in narrow welcome');
          await layout(page, 'signed-in narrow welcome');
          await screenshot(page, 'signed-header', width);
          await page.locator('[data-enter]').first().click();
          await townReady(page);
          await page.setViewportSize({ width: 844, height: 390 });
          await layout(page, 'short town viewport');
          const clippedControls = await page.locator('#home, #language, #player-login, #logout, #show-projects, #zoom-in, #zoom-out, #reset, .timeline').evaluateAll(elements =>
            elements.filter(element => {
              const bounds = element.getBoundingClientRect();
              return bounds.width > 0 && bounds.height > 0 && (bounds.left < -1 || bounds.right > innerWidth + 1 || bounds.top < -1 || bounds.bottom > innerHeight + 1);
            }).map(element => element.id || element.className)
          );
          assert.deepEqual(clippedControls, [], 'Header, principal controls and timeline fit the short viewport');
          const headerSeparation=await page.evaluate(()=>({profileBottom:document.querySelector('#player-login').getBoundingClientRect().bottom,statsTop:document.querySelector('#town-stats').getBoundingClientRect().top}));
          assert.ok(headerSeparation.profileBottom<=headerSeparation.statsTop, 'A long player name does not overlap the town statistics');
          await page.screenshot({ path: `${output}/unified-town-short-844.png`, animations: 'disabled' });
        }

        if (width === 1440) {
          await page.locator('#home').click();
          await page.locator('#import').setInputFiles(`${output}/unified-sample-backup.json`);
          await townReady(page);
          assert.match(await page.locator('#snapshot-count').innerText(), /^3\s*\/\s*3$/);
          await page.locator('#home').click();
          await page.locator('[data-mode="personal"]').first().click();
          await page.locator('#username').fill('fixture-builder');
          await page.locator('#load-repos').click();
          await page.locator('[data-repo]').check();
          await page.locator('#town-name').fill('Personal interface fixture');
          await page.locator('#capture').click();
          await page.locator('.success-page').waitFor();
          assert.equal(captures.length, 2);
          assert.equal(captures[1].event.collectionType, 'personal');
        }
      } finally {
        await context.close();
      }
    }
    assert.deepEqual(errors, [], 'No browser page errors');
    console.log('Shared header, delayed-loading isolation, real town readiness, responsive screens, concise card/focus, safe door entry, reduced motion, contextual cursors, EN/ZH, mocked capture, both collection modes and backup round trip passed.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
