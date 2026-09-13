const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const baseUrl = process.env.DEMO_URL || 'http://127.0.0.1:5173/';
const results = [], errors = [];

async function instrument(context, mode = 'native') {
  await context.addInitScript(mode => {
    const Original = window.Audio;
    const audit = window.__musicAudit = { elements: [], plays: 0, pauses: 0, loaded: 0, rejected: 0, pending: [], hidden: null };
    const hidden = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden').get;
    Object.defineProperty(document, 'hidden', { get: () => audit.hidden ?? hidden.call(document) });
    if (mode === 'no-webaudio') {
      Object.defineProperty(window, 'AudioContext', { value: undefined, configurable: true });
      Object.defineProperty(window, 'webkitAudioContext', { value: undefined, configurable: true });
    }
    if (mode === 'no-audio') Object.defineProperty(window, 'Audio', { value: undefined, configurable: true });
    else Object.defineProperty(window, 'Audio', { configurable: true, value: new Proxy(Original, { construct(Target, args) {
      const audio = new Target(...args), play = audio.play.bind(audio), pause = audio.pause.bind(audio);
      audit.elements.push(audio);
      audio.addEventListener('loadeddata', () => audit.loaded++);
      audio.play = () => {
        audit.plays++;
        const action = mode === 'rejected' ? Promise.reject(new DOMException('Fixture autoplay rejection', 'NotAllowedError'))
          : mode === 'delayed' ? new Promise(resolve => audit.pending.push(() => { play().catch(() => {}); resolve(); })) : play();
        return action.catch(error => { audit.rejected++; throw error; });
      };
      audio.pause = () => { audit.pauses++; pause(); };
      return audio;
    } }) });
  }, mode);
}
async function state(page) {
  return page.evaluate(() => {
    const a = window.__musicAudit;
    return { plays: a.plays, pauses: a.pauses, loaded: a.loaded, rejected: a.rejected, pending: a.pending.length,
      elements: a.elements.map(e => ({ paused: e.paused, currentTime: e.currentTime, duration: e.duration,
        loop: e.loop, volume: e.volume, src: e.currentSrc || e.src, error: e.error?.code || 0, readyState: e.readyState })) };
  });
}
async function serving(page) {
  await page.route('**/api/session', r => r.fulfill({ json: { configured: false, authenticated: false, playerConfigured: false } }));
  await page.route('**/api/town', r => r.fulfill({ json: null }));
  await page.route('**/api/towns', r => r.fulfill({ json: { towns: [] } }));
  await page.route('**/data/town.json', r => r.fulfill({ status: 404, body: '' }));
}
async function open(browser, mode = 'native', fixture = false) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await instrument(context, mode); const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  await serving(page);
  if (fixture) {
    await page.route('**/__music-fixture', r => r.fulfill({ contentType: 'text/html', body: '<div id="host"><button id="gesture">Plan</button><button data-sound-toggle id="mute">Mute</button></div><script type="module">import {createPlannerMusic} from "/src/ui/planner-music.ts";window.music = createPlannerMusic(document.querySelector("#host"),true);</script>' }));
    await page.goto(new URL('__music-fixture', baseUrl).href); await page.waitForFunction(() => window.music);
  }
  return { context, page };
}
const playing = page => page.waitForFunction(() => window.__musicAudit.elements.length === 1 && !window.__musicAudit.elements[0].paused && window.__musicAudit.elements[0].currentTime > .05, null, { timeout: 15000 });
const silent = async page => assert.ok((await state(page)).elements.every(e => e.paused), 'Every created track is paused');

(async () => {
  fs.mkdirSync('private/qa', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    {
      const { context, page } = await open(browser);
      await page.goto(baseUrl); await page.locator('[data-create]').waitFor();
      assert.equal((await state(page)).elements.length, 0, 'Homepage is lazy and silent');
      await page.locator('[data-create]').click(); await playing(page);
      const first = await state(page);
      assert.equal(first.elements[0].loop, true); assert.equal(first.elements[0].volume, .16);
      assert.ok(first.elements[0].duration > 1 && first.loaded > 0, 'Supplied MP3 decodes through the real native media element');
      assert.match(decodeURI(first.elements[0].src), /Miniature Sky\.mp3/);
      await page.locator('[data-mode="hackathon"]').click(); await page.locator('#language').click();
      const rerender = await state(page);
      assert.equal(rerender.elements.length, 1); assert.equal(rerender.plays, first.plays, 'Mode/language rerenders do not replay or duplicate music');
      assert.ok(rerender.elements[0].currentTime >= first.elements[0].currentTime);
      await page.locator('#sound-toggle').click(); await silent(page);
      assert.equal(await page.evaluate(() => localStorage.getItem('bg-sound-enabled')), 'off');
      await page.locator('#sound-toggle').click(); await playing(page);
      await page.evaluate(() => { window.__musicAudit.hidden = true; document.dispatchEvent(new Event('visibilitychange')); }); await silent(page);
      await page.evaluate(() => { window.__musicAudit.hidden = false; document.dispatchEvent(new Event('visibilitychange')); }); await playing(page);
      await page.locator('#home').click(); await silent(page);
      assert.equal((await state(page)).elements[0].currentTime, 0, 'Leaving setup resets the loop');
      await page.locator('[data-enter]').click(); await silent(page);
      await context.close(); results.push('Native app: lazy homepage, supplied MP3 decoded, loop/volume, rerender continuity, shared mute, visibility pause/resume, home/town silence');
    }
    {
      const { context, page } = await open(browser);
      await page.goto(new URL('?setup=personal', baseUrl).href); await page.locator('.setup-page').waitFor();
      assert.equal((await state(page)).plays, 0);
      await page.locator('#sound-toggle').click();
      assert.equal((await state(page)).plays, 0, 'The first direct-setup mute never starts music');
      await page.locator('#language').click(); assert.equal((await state(page)).plays, 0);
      await page.goto(new URL('?setup=personal', baseUrl).href); await page.locator('.setup-page').waitFor(); await page.locator('[data-mode="hackathon"]').click();
      assert.equal((await state(page)).plays, 0, 'Remembered mute survives reload');
      await page.locator('#sound-toggle').click(); await playing(page);
      await context.close(); results.push('Direct setup: first mute has zero play attempts, remembered mute survives reload, deliberate unmute plays');
    }
    for (const mode of ['rejected', 'delayed', 'network-failed', 'no-audio']) {
      const { context, page } = await open(browser, mode, true);
      if (mode === 'network-failed') await page.route('**/*.mp3*', r => r.fulfill({ status: 404, body: '' }));
      await page.evaluate(() => window.music.setActive(true)); await page.locator('#gesture').click();
      if (mode === 'delayed') {
        await page.waitForFunction(() => window.__musicAudit.pending.length === 1);
        await page.evaluate(() => { music.setActive(false); window.__musicAudit.pending.shift()(); });
        await page.waitForTimeout(200); await silent(page);
        assert.equal((await state(page)).elements[0].currentTime, 0, 'Delayed resolution cannot leak music after navigation');
      } else if (mode === 'rejected') {
        await page.waitForFunction(() => window.__musicAudit.rejected > 0); await silent(page);
        await page.locator('#gesture').click(); assert.equal((await state(page)).elements.length, 1);
      } else if (mode === 'network-failed') {
        await page.waitForFunction(() => window.__musicAudit.elements[0]?.error);
        assert.equal((await state(page)).elements[0].currentTime, 0, 'A failed media request cannot advance playback');
        await page.evaluate(() => music.setActive(false)); await silent(page);
      } else assert.equal((await state(page)).elements.length, 0);
      await page.evaluate(() => music.dispose()); await silent(page); await context.close();
      results.push(`Bounded fixture: ${mode}, cleanup and no uncaught errors`);
    }
    {
      const { context, page } = await open(browser, 'no-webaudio');
      await page.goto(new URL('?setup=personal', baseUrl).href); await page.locator('.setup-page').waitFor();
      assert.equal(await page.locator('#sound-toggle').isDisabled(), false, 'HTMLAudio alone keeps the shared control available');
      await page.locator('[data-mode="hackathon"]').click(); await playing(page);
      await page.locator('#sound-toggle').click(); await silent(page);
      await context.close(); results.push('HTMLAudio fallback: usable shared control and real music when Web Audio is unavailable');
    }
    assert.deepEqual(errors, []);
    const report = { passed: results, browserErrors: errors, boundary: 'Real browser HTMLAudioElement decode/time progression and trusted inputs; visibility, rejected/delayed play, missing APIs and failed network are explicitly bounded fixtures. No human listening claimed.' };
    fs.writeFileSync('private/qa/planner-music-report.json', JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2));
  } catch (e) {
    for (const context of browser.contexts()) for (const page of context.pages()) await page.screenshot({ path: 'private/qa/planner-music-failure.png' }).catch(() => {});
    throw e;
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
