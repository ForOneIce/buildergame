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
  const clipping = await page.locator('.map-header, #detail[open], #project-entry[open], .sample-tour-picker[open] .sample-tour-options').evaluateAll(elements =>
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

function assertSilentShowcase(showcase) {
  return Promise.all([
    showcase.locator('button, [role="button"], [role="status"], .showcase-caption, .showcase-status').count(),
    showcase.textContent(),
  ]).then(([controls, text]) => {
    assert.equal(controls, 0, 'The building showcase has no stage controls, caption or loading status');
    assert.equal(text.trim(), '', 'Building transitions do not show loading copy');
  });
}

async function holdNextShowcaseStage(page) {
  let release, reached;
  const gate = new Promise(resolve => { release = resolve; });
  const arrived = new Promise(resolve => { reached = resolve; });
  await page.route('**/models/stage-2.glb', async route => {
    reached();
    await gate;
    if (!page.isClosed()) await route.continue();
  });
  return {
    release,
    async check() {
      let timer;
      try {
        await Promise.race([arrived, new Promise((_, reject) => {
          timer = setTimeout(() => reject(Error('Stage 2 preload did not reach the held route')), 15000);
        })]);
        const showcase = page.locator('#home-showcase');
        assert.equal(await showcase.getAttribute('data-stage'), '1');
        // Wait past the normal dwell: a slow next asset must not hide the current building.
        await page.waitForTimeout(4300);
        assert.equal(await showcase.getAttribute('data-stage'), '1');
        assert.equal(await showcase.locator('canvas').isVisible(), true);
        assert.equal(await showcase.locator('canvas').evaluate(canvas => getComputedStyle(canvas).opacity), '1');
        await assertSilentShowcase(showcase);
        await page.screenshot({ path: `${output}/unified-showcase-delayed-1440.png`, animations: 'disabled' });
      } finally {
        clearTimeout(timer);
        release();
      }
    },
  };
}

async function welcomePresentation(page, width, delayedStage) {
  const home = page.locator('.landing');
  assert.match(await home.textContent(), /A home for GitHub builders\. Let’s watch each other grow\./);
  assert.match(await home.textContent(), /Who can create a town\?/);
  assert.match(await home.textContent(), /Keep building\. Keep growing\./);
  assert.doesNotMatch(await home.textContent(), /Your work has a home|One repository, one home|No wallet needed|Explore as a guest|Who lives here/i);
  assert.equal(await home.locator('[data-mode], [data-import], [data-sample-landscape], [data-tour-landscape]').count(), 0, 'Homepage keeps setup options and sample-town tour controls in their destination screens');
  assert.equal(await home.locator('.builder-audience').count(), 2);
  assert.equal(await home.locator('.builder-audience svg').count(), 2);
  assert.equal(await home.locator('.builder-audience button, .builder-audience a, .builder-audience [role="button"], .builder-audience [tabindex]').count(), 0, 'Audience descriptions are noninteractive');
  const tilt = await page.locator('.wood-logo').evaluate(element => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    return { x: matrix.b, y: matrix.c };
  });
  assert.ok(Math.abs(tilt.x) < .001 && Math.abs(tilt.y) < .001, 'The shared logo stays level');
  assert.equal(await page.locator('#player-login .profile-copy').count(), 0, 'Homepage profile has no permanent text block');
  for (const selector of ['[data-enter]', '[data-create]', '#player-login']) {
    const control = page.locator(selector).first();
    assert.ok(await control.getAttribute('aria-label'), `${selector}: icon action keeps an accessible name`);
    await page.locator('#home').focus();
    await page.mouse.move(0, 0);
    await page.waitForFunction(selector => {
      const hint = document.querySelector(selector).querySelector('[role="tooltip"]');
      return hint && (getComputedStyle(hint).visibility === 'hidden' || Number(getComputedStyle(hint).opacity) === 0);
    }, selector);
    await control.focus();
    await page.waitForFunction(selector => {
      const hint = document.querySelector(selector).querySelector('[role="tooltip"]');
      return hint && getComputedStyle(hint).visibility !== 'hidden' && Number(getComputedStyle(hint).opacity) > .9;
    }, selector);
    if (width === 1440) {
      await page.locator('#home').focus();
      await control.hover();
      await page.waitForFunction(selector => {
        const hint = document.querySelector(selector).querySelector('[role="tooltip"]');
        return hint && getComputedStyle(hint).visibility !== 'hidden' && Number(getComputedStyle(hint).opacity) > .9;
      }, selector);
    }
  }
  await page.locator('#home').focus();
  await page.mouse.move(0, 0);
  const showcase = page.locator('#home-showcase');
  await page.locator('#home-showcase[data-showcase-ready="true"]').waitFor({ timeout: 60000 });
  assert.equal(await showcase.locator('canvas').count(), 1, 'Homepage renders one dedicated building canvas');
  assert.equal(await home.locator('#scene, #island-preview').count(), 0, 'Homepage no longer contains a town scene');
  await assertSilentShowcase(showcase);
  if (width === 360) {
    assert.equal(await showcase.getAttribute('data-playing'), 'false', 'Reduced motion disables automatic cycling');
    assert.equal(await showcase.getAttribute('data-stage'), '5', 'Reduced motion shows the completed building');
    await page.waitForTimeout(4200);
    assert.equal(await showcase.getAttribute('data-stage'), '5', 'A reduced-motion visitor sees a stable completed building');
    assert.equal(await showcase.locator('canvas').evaluate(element => element.getAnimations().length), 0);
  } else {
    assert.equal(await showcase.getAttribute('data-playing'), 'true', 'The decorative showcase cycles automatically');
  }
  if (width === 1440) {
    await delayedStage.check();
    const outgoing=showcase.locator('.showcase-outgoing');
    await outgoing.waitFor({timeout:15000});
    assert.equal(await outgoing.evaluate(canvas=>{
      const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
      for(let i=3;i<pixels.length;i+=4)if(pixels[i]>0)return true;
      return false;
    }),true,'The outgoing layer contains the previous building, not a blank frame');
    assert.equal(await showcase.locator('.showcase-canvas').evaluate(canvas=>getComputedStyle(canvas).opacity),'1','The incoming building stays visible beneath the dissolve');
    for (const stage of [2, 3, 4, 5, 1]) {
      await page.locator(`#home-showcase[data-showcase-ready="true"][data-stage="${stage}"]`).waitFor({ timeout: 60000 });
      await assertSilentShowcase(showcase);
    }
  }
}

async function plannerPreviews(page, width) {
  assert.equal(await page.locator('.setup-page #back, .setup-heading, .site-plan svg, .setup-page [data-sample-landscape], .setup-page [data-tour-landscape]').count(), 0, 'Planning removes the duplicate back/introduction/drawing and sample tours');
  assert.equal(await page.locator('#player-login .profile-copy').count(), 0, 'Setup uses the compact homepage account control');
  const tops = await page.locator('#home, #language, #player-login, #player-login .guest-face').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().top));
  assert.ok(Math.max(...tops) - Math.min(...tops) <= 1, 'Setup header controls share a top edge');
  assert.equal(await page.locator('.growth').evaluate(element => element.open), true, 'Growth settings start expanded');
  assert.equal(await page.locator('.config-backup').evaluate(element => element.open), false, 'Backup options start collapsed');
  assert.equal(await page.locator('[data-mode] svg').count(), 2, 'Both mode choices use illustrative symbols');
  const sources = new Set();
  for (const mode of ['flat', 'valley', 'clouds']) {
    await page.locator(`[data-landscape-choice="${mode}"]`).click();
    assert.equal(await page.locator('#landscape').inputValue(), mode);
    await page.waitForFunction(() => {
      const image = document.querySelector('#terrain-thumbnail');
      return image.complete && image.naturalWidth > 0;
    });
    const thumbnail = page.locator('#terrain-thumbnail');
    sources.add(await thumbnail.getAttribute('src'));
    assert.ok(await thumbnail.getAttribute('alt'), 'Terrain thumbnail has descriptive text');
    const position = await thumbnail.evaluate(image => {
      const imageBox = image.getBoundingClientRect(), planBox = image.closest('.site-plan').getBoundingClientRect();
      return { left: imageBox.left - planBox.left, top: imageBox.top - planBox.top, width: imageBox.width, planWidth: planBox.width };
    });
    assert.ok(position.left >= 0 && position.top >= 0 && position.width >= position.planWidth * .9, 'The selected terrain fills the larger preview area');
    assert.equal(await page.locator('#town-name').inputValue(), `Interface fixture ${width}`);
    assert.match(await page.locator('#repositories').inputValue(), /fixture-project/);
  }
  assert.equal(sources.size, 3, 'Each selected terrain has its own thumbnail');
  await page.locator('[data-landscape-choice="valley"]').click();
  const emphasis = await page.evaluate(() => ({
    capture: document.querySelector('#capture').getBoundingClientRect().width,
    terrain: Math.max(...[...document.querySelectorAll('[data-landscape-choice]')].map(button => button.getBoundingClientRect().width)),
  }));
  assert.ok(emphasis.capture > emphasis.terrain * 1.5, 'The creation action is more prominent than the compact terrain choices');
}

async function sampleTours(page) {
  assert.equal(await page.locator('#manage').count(), 0, 'Sample towns expose tours instead of Town settings');
  for (const mode of ['valley', 'clouds', 'flat']) {
    await page.locator('.sample-tour-picker > summary').click();
    assert.equal(await page.locator('[data-tour-landscape]').count(), 3);
    for (const cursor of await page.locator('[data-tour-landscape]').evaluateAll(buttons => buttons.map(button => getComputedStyle(button).cursor))) {
      assert.match(cursor, /steps\.png/, 'Sample tours keep the exploration cursor');
    }
    await layout(page, 'sample landscape picker');
    await page.locator(`[data-tour-landscape="${mode}"]`).click();
    await townReady(page);
    assert.equal(await page.locator('#scene').getAttribute('data-landscape'), mode);
    if (await page.locator('.sample-tour-picker').evaluate(element => element.open)) await page.locator('.sample-tour-picker > summary').click();
  }
}

async function switchPlanningMode(page, mode, width) {
  await page.locator(`[data-mode="${mode}"]`).focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator(`[data-mode="${mode}"]`).getAttribute('aria-pressed'), 'true');
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-mode')), mode, 'Mode change restores focus to its control');
  const animation = await page.locator('.setup-card').evaluate(element => getComputedStyle(element).animationName);
  if (width === 360) assert.equal(animation, 'none', 'Reduced motion avoids a moving page turn');
  else assert.notEqual(animation, 'none', 'A mode change has page-turn feedback');
}

async function incompletePlanRoundTrip(page) {
  const title = 'Unfinished planning fixture';
  const unfinishedUrl = 'https://github.com/fixture-builder/';
  const path = `${output}/unfinished-town.plan.json`;
  await page.locator('#town-name').fill(title);
  await switchPlanningMode(page, 'personal', 1440);
  await page.locator('#username').fill('fixture-builder');
  await page.locator('#load-repos').click();
  await page.waitForFunction(() => !document.querySelector('#load-repos').disabled);
  await page.locator('[data-repo]').check();
  await switchPlanningMode(page, 'hackathon', 1440);
  await page.locator('#repositories').fill(unfinishedUrl);
  await page.locator('[data-landscape-choice="clouds"]').click();
  await page.locator('[data-weight="stars"]').fill('7');
  assert.equal(await page.locator('.config-backup').evaluate(element => element.open), false);
  await page.locator('.config-backup > summary').click();
  const saving = page.waitForEvent('download');
  await page.locator('#save-draft').click();
  await (await saving).saveAs(path);
  const saved = JSON.parse(fs.readFileSync(path, 'utf8'));
  assert.equal(saved.kind, 'buildergame-plan/v1', 'An unfinished plan is distinct from a deployment configuration or captured town');
  assert.equal(saved.repoText, unfinishedUrl, 'Saving a plan permits incomplete repository input');
  assert.deepEqual(saved.selected, ['https://github.com/fixture-builder/fixture-project']);
  assert.equal(saved.publish, false);

  // A fresh page proves restoration comes from the exported file, not surviving form memory.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('[data-create]').click();
  await page.locator('.config-backup > summary').click();
  const choosing = page.waitForEvent('filechooser');
  await page.locator('.config-backup [data-import]').click();
  await (await choosing).setFiles(path);
  await page.locator('#repositories').waitFor();
  assert.equal(await page.locator('#scene').count(), 0, 'Restoring an unfinished plan stays in the planner');
  assert.equal(await page.locator('#town-name').inputValue(), title);
  assert.equal(await page.locator('#repositories').inputValue(), unfinishedUrl);
  assert.equal(await page.locator('#landscape').inputValue(), 'clouds');
  assert.equal(await page.locator('[data-weight="stars"]').inputValue(), '7');
  assert.equal(await page.locator('.config-backup').evaluate(element => element.open), false);
  await switchPlanningMode(page, 'personal', 1440);
  assert.equal(await page.locator('#username').inputValue(), 'fixture-builder');
  assert.equal(await page.locator('[data-repo]').isChecked(), true, 'Selected personal repositories survive file restoration');
  await switchPlanningMode(page, 'hackathon', 1440);
  assert.equal(await page.locator('#repositories').inputValue(), unfinishedUrl);
}

async function planningModeDrafts(page, width) {
  await page.locator('[data-weight="stars"]').fill('7');
  await switchPlanningMode(page, 'personal', width);
  await page.locator('#username').fill('fixture-builder');
  await switchPlanningMode(page, 'hackathon', width);
  // Consecutive activations exercise interruption without waiting for each visual turn to finish.
  await page.locator('[data-mode="personal"]').evaluate(button => button.click());
  await page.locator('[data-mode="hackathon"]').evaluate(button => button.click());
  assert.equal(await page.locator('#town-name').count(), 1, 'Interrupted page turns do not leave duplicate forms');
  assert.equal(await page.locator('#town-name').inputValue(), `Interface fixture ${width}`);
  assert.equal(await page.locator('#repositories').inputValue(), 'https://github.com/fixture-builder/fixture-project');
  assert.equal(await page.locator('#landscape').inputValue(), 'valley');
  assert.equal(await page.locator('[data-weight="stars"]').inputValue(), '7');
  assert.equal(await page.locator('[data-mode="hackathon"]').getAttribute('aria-pressed'), 'true');
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
      let delayedStage;
      try {
        const page = await context.newPage();
        page.on('pageerror', error => errors.push(`${width}: ${error.message}`));
        const captures = await installMocks(page, makeRecord);
        if (width === 1440) delayedStage = await holdNextShowcaseStage(page);
        let staticAttempts=0;
        if(width===360)await page.route('**/models/cozy-house.glb',route=>++staticAttempts===1?route.fulfill({status:503,body:'Temporary fixture failure'}):route.continue());
        await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
        await header(page, 'welcome');
        await welcomePresentation(page, width, delayedStage);
        if(width===360)assert.equal(staticAttempts,2,'Reduced motion quietly retries an unavailable initial model');
        await layout(page, 'welcome');
        await screenshot(page, 'welcome', width);
        if (width === 360) {
          await page.locator('#language').click();
          await page.locator('#home-showcase[data-showcase-ready="true"]').waitFor({ timeout: 60000 });
          assert.match(await page.locator('.landing').textContent(), /为github builder打造的家园，让我们一起见证彼此的成长。/);
          assert.match(await page.locator('.landing').textContent(), /谁能新建城镇？/);
          assert.match(await page.locator('.floating-note').textContent(), /持续构建，持续成长/);
          assert.equal(await page.locator('[data-create]').getAttribute('aria-label'), '新建城镇');
          await layout(page, 'Chinese welcome');
          await screenshot(page, 'welcome-zh', width);
          await page.locator('#language').click();
          await page.locator('#home-showcase[data-showcase-ready="true"]').waitFor({ timeout: 60000 });
        }

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
        if (width === 1440 || width === 360) await sampleTours(page);
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
        await page.locator('[data-create]').click();
        await page.locator('[data-mode="hackathon"]').first().click();
        await page.locator('#town-name').waitFor();
        await header(page, 'setup');
        if (width === 1440) await incompletePlanRoundTrip(page);
        await page.locator('#town-name').fill(`Interface fixture ${width}`);
        await page.locator('#repositories').fill('https://github.com/fixture-builder/fixture-project');
        await plannerPreviews(page, width);
        await planningModeDrafts(page, width);
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
          assert.match(await page.locator('#terrain-thumbnail').getAttribute('alt'), /山谷/);
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
        assert.equal(captures[0].event.rule.weights.stars, 7, 'Capture uses the retained growth settings');
        await page.locator('[data-enter]').first().click();
        await townReady(page);
        assert.match(await page.locator('.town-info').innerText(), new RegExp(`Interface fixture ${width}`));
        await header(page, 'captured town');
        assert.equal(await page.locator('.sample-tour-picker').count(), 0, 'Captured towns retain management, not sample tours');
        assert.equal(await page.locator('#manage').isVisible(), true);
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
          await page.locator('[data-create]').click();
          await page.locator('[data-mode="personal"]').first().click();
          await page.locator('#username').fill('fixture-builder');
          await page.locator('#load-repos').click();
          await page.waitForFunction(() => !document.querySelector('#load-repos').disabled);
          await page.locator('[data-repo]').check();
          await page.locator('#town-name').fill('Personal interface fixture');
          await page.locator('[data-landscape-choice="clouds"]').click();
          await page.locator('[data-mode="hackathon"]').click();
          await page.locator('[data-mode="personal"]').click();
          assert.equal(await page.locator('[data-mode="personal"]').getAttribute('aria-pressed'), 'true');
          assert.equal(await page.locator('#town-name').inputValue(), 'Personal interface fixture');
          assert.equal(await page.locator('#username').inputValue(), 'fixture-builder');
          assert.equal(await page.locator('[data-repo]').isChecked(), true);
          assert.equal(await page.locator('#landscape').inputValue(), 'clouds', 'Mode changes preserve the personal draft');
          await page.locator('#capture').click();
          await page.locator('.success-page').waitFor();
          assert.equal(captures.length, 2);
          assert.equal(captures[1].event.collectionType, 'personal');
          assert.equal(captures[1].event.landscape, 'clouds');
        }
      } finally {
        delayedStage?.release();
        await context.close();
      }
    }
    assert.deepEqual(errors, [], 'No browser page errors');
    console.log('Refined homepage, silent five-stage showcase, compact planning controls and larger terrain previews, sample-town tours versus real-town settings, retained mode drafts and incomplete-plan file restoration, shared header, delayed-loading isolation, real town readiness, responsive screens, concise card/focus, safe door entry, contextual cursors, EN/ZH, mocked capture, both collection modes and backup round trip passed.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
