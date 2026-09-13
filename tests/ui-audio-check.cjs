const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const baseUrl = process.env.DEMO_URL || 'http://127.0.0.1:5173/';
const scope = process.env.AUDIO_CASE || 'all';
const cases = ['lifecycle', 'mailbox', 'pending', 'fallbacks', 'responsive'];
assert.ok(scope === 'all' || scope.split(',').every(name => cases.includes(name)), 'Unknown AUDIO_CASE');
const run = name => scope === 'all' || scope.split(',').includes(name);

async function instrument(context, mode = 'native') {
  await context.addInitScript(mode => {
    const NativeContext = window.AudioContext || window.webkitAudioContext;
    const audit = { created: 0, resumes: 0, decoded: [], decodeFailures: 0, starts: [], stops: [], ended: [], peak: 0, contexts: [], holdStarts: false, held: null, hiddenOverride: null };
    window.__uiAudioAudit = audit; // Dedicated browser-test state; no product hook is added.
    const rawHidden = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden').get;
    const rawVisibility = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState').get;
    Object.defineProperty(document, 'hidden', { get: () => audit.hiddenOverride ?? rawHidden.call(document) });
    Object.defineProperty(document, 'visibilityState', { get: () => audit.hiddenOverride === null ? rawVisibility.call(document) : audit.hiddenOverride ? 'hidden' : 'visible' });
    if (mode === 'storage-unavailable') for (const name of ['getItem', 'setItem', 'removeItem']) Storage.prototype[name] = () => { throw new DOMException('Fixture storage is unavailable', 'SecurityError'); };
    if (mode === 'api-unavailable') {
      Object.defineProperty(window, 'AudioContext', { configurable: true, value: undefined });
      Object.defineProperty(window, 'webkitAudioContext', { configurable: true, value: undefined });
      return;
    }
    if (!NativeContext) throw Error('Native Web Audio is required for the primary regression fixture');
    const byteUrls = new WeakMap(), decodedUrls = new WeakMap(), connections = new WeakMap();
    const nativeFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await nativeFetch(...args), read = response.arrayBuffer.bind(response);
      response.arrayBuffer = async () => { const bytes = await read(); byteUrls.set(bytes, response.url || String(args[0])); return bytes; };
      return response;
    };
    const nativeDecode = BaseAudioContext.prototype.decodeAudioData;
    BaseAudioContext.prototype.decodeAudioData = function (bytes, ...args) {
      const url = byteUrls.get(bytes) || '';
      return nativeDecode.call(this, bytes, ...args).then(buffer => {
        decodedUrls.set(buffer, url); audit.decoded.push({ url, duration: buffer.duration, channels: buffer.numberOfChannels, sampleRate: buffer.sampleRate });
        return buffer;
      }, error => { audit.decodeFailures++; throw error; });
    };
    const nativeConnect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (destination, ...args) {
      const edges = connections.get(this) || []; edges.push(destination); connections.set(this, edges);
      return nativeConnect.call(this, destination, ...args);
    };
    const nativeResume = NativeContext.prototype.resume;
    NativeContext.prototype.resume = function (...args) {
      audit.resumes++;
      return mode === 'resume-rejected' ? Promise.reject(new DOMException('Fixture autoplay denial', 'NotAllowedError')) : nativeResume.apply(this, args);
    };
    const nativeCreateSource = BaseAudioContext.prototype.createBufferSource; let sourceId = 0;
    BaseAudioContext.prototype.createBufferSource = function (...args) {
      const source = nativeCreateSource.apply(this, args), nativeStart = source.start, nativeStop = source.stop, id = ++sourceId;
      source.addEventListener('ended', () => audit.ended.push(id));
      source.start = function (...startArgs) {
        const gains = [], visited = new Set();
        const trace = node => { if (visited.has(node)) return; visited.add(node); if (node instanceof GainNode) gains.push(node.gain.value); for (const next of connections.get(node) || []) trace(next); };
        trace(source);
        if (audit.holdStarts) audit.held = source.context.suspend();
        const result = nativeStart.apply(source, startArgs);
        audit.starts.push({ id, url: decodedUrls.get(source.buffer) || '', gains, state: source.context.state, at: performance.now(), loop: source.loop });
        audit.peak = Math.max(audit.peak, audit.starts.filter(start => !audit.ended.includes(start.id) && !audit.stops.some(stop => stop.id === start.id)).length);
        return result;
      };
      source.stop = function (...stopArgs) { audit.stops.push({ id, beforeEnded: !audit.ended.includes(id), at: performance.now() }); return nativeStop.apply(source, stopArgs); };
      return source;
    };
    const WrappedContext = new Proxy(NativeContext, { construct(Target, args) {
      const context = new Target(...args); audit.created++; audit.contexts.push(context);
      if (mode === 'resume-rejected') Object.defineProperty(context, 'state', { get: () => 'suspended' });
      return context;
    } });
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: WrappedContext });
    if (window.webkitAudioContext) Object.defineProperty(window, 'webkitAudioContext', { configurable: true, value: WrappedContext });
  }, mode);
}
async function state(page) {
  return page.evaluate(() => { const { created, resumes, decoded, decodeFailures, starts, stops, ended, peak } = window.__uiAudioAudit; return { created, resumes, decoded, decodeFailures, starts, stops, ended, peak }; });
}
const cueStarts = (audit, cue) => audit.starts.filter(start => new URL(start.url || 'about:blank').pathname.endsWith(`/${cue}.ogg`));
async function waitCue(page, cue, count) {
  await page.waitForFunction(({ cue, count }) => window.__uiAudioAudit.starts.filter(start => new URL(start.url || 'about:blank').pathname.endsWith(`/${cue}.ogg`)).length >= count, { cue, count }, { timeout: 8000 });
}
async function press(page, selector) { await page.locator(selector).focus(); await page.keyboard.press('Enter'); }
async function townReady(page) {
  await page.locator('#scene[data-town-ready="true"]').waitFor({ timeout: 60000 });
  await page.locator('#map-transition').waitFor({ state: 'hidden', timeout: 60000 });
}
async function serve(page, signedIn = false) {
  await page.route('**/api/session', route => route.fulfill({ json: { configured: signedIn, playerConfigured: signedIn, authenticated: signedIn, canPublish: signedIn, isDeployer: false, login: signedIn ? 'fixture-builder' : null, avatar: null } }));
  await page.route('**/api/town', route => route.fulfill({ json: null }));
  await page.route('**/api/towns', route => route.fulfill({ json: { towns: [] } }));
  await page.route('**/data/town.json', route => route.fulfill({ status: 404, json: { error: 'No static fixture' } }));
}
function watch(context, errors, requests) {
  context.on('page', page => {
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (new URL(request.url()).pathname.includes('/audio/')) requests.push(request.url()); });
  });
}
async function headerFits(page) {
  const selectors = ['#home', '#sound-toggle', '#language', '#player-login', '#logout'], boxes = [];
  for (const selector of selectors) if (await page.locator(selector).count()) {
    const box = await page.locator(selector).boundingBox(); if (!box) continue;
    assert.ok(box.x >= -1 && box.y >= -1 && box.x + box.width <= page.viewportSize().width + 1, `${selector} stays inside the header viewport`);
    boxes.push({ selector, ...box });
  }
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    assert.ok(Math.min(a.x + a.width, b.x + b.width) <= Math.max(a.x, b.x) + 1 || Math.min(a.y + a.height, b.y + b.height) <= Math.max(a.y, b.y) + 1, `${a.selector} does not overlap ${b.selector}`);
  }
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
}

async function holdNextCue(page, selector) {
  await page.evaluate(() => { window.__uiAudioAudit.holdStarts = true; window.__uiAudioAudit.held = null; });
  await press(page, selector);
  await page.waitForFunction(() => window.__uiAudioAudit.held !== null);
  await page.evaluate(() => window.__uiAudioAudit.held);
  await page.evaluate(() => { window.__uiAudioAudit.holdStarts = false; });
}

(async () => {
  fs.mkdirSync('private/qa', { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_BIN ? { executablePath: process.env.BROWSER_BIN } : { channel: 'chrome' }), args: ['--autoplay-policy=document-user-activation-required'] });
  const errors = [], requests = [], passed = [];
  try {
    if (run('lifecycle')) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      watch(context, errors, requests); await instrument(context); const page = await context.newPage(); await serve(page);
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' }); await page.locator('#sound-toggle').waitFor();
      assert.equal(await page.locator('#sound-toggle').getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('#sound-toggle').getAttribute('aria-label'), 'Mute sound effects');
      await page.mouse.move(0, 0); await page.locator('#home').hover(); await page.waitForTimeout(220);
      await page.locator('#home').dispatchEvent('click'); await page.waitForTimeout(150);
      assert.equal((await state(page)).created, 0, 'Load, untrusted clicks and hover before a gesture do not construct an AudioContext');
      assert.equal((await state(page)).starts.length, 0);
      await page.locator('#home').click(); await waitCue(page, 'click', 1);
      let current = await state(page);
      assert.equal(current.created, 1); assert.ok(current.decoded.length > 0, 'Real local clips decode into native AudioBuffers');
      assert.ok(current.decoded.every(buffer => buffer.duration > 0 && buffer.duration <= 2 && buffer.channels > 0 && buffer.sampleRate > 0));
      assert.ok(current.starts.every(source => source.state === 'running'), 'Trusted activation starts a real running AudioContext');
      for (let i = 0; i < 4; i++) {
        const previous = cueStarts(await state(page), 'click').length;
        await page.waitForTimeout(110); await press(page, '#home'); await waitCue(page, 'click', previous + 1); await page.waitForTimeout(100);
        assert.equal(cueStarts(await state(page), 'click').length, previous + 1, 'Rerendering the header does not duplicate click listeners');
      }
      const hoverBefore = cueStarts(await state(page), 'hover').length;
      const a = await page.locator('#language').boundingBox(), b = await page.locator('#player-login').boundingBox();
      const started = Date.now();
      for (let i = 0; i < 12; i++) { const point = i % 2 ? a : b; await page.mouse.move(point.x + point.width / 2, point.y + point.height / 2); }
      await page.waitForTimeout(180);
      const hoverAdded = cueStarts(await state(page), 'hover').length - hoverBefore;
      assert.ok(hoverAdded >= 1 && hoverAdded <= Math.ceil((Date.now() - started) / 140) + 1 && hoverAdded < 12, 'Rapid real pointer movement is audibly throttled');
      await page.mouse.move(0, 0);
      for (let i = 0; i < 2; i++) {
        const openBefore = cueStarts(await state(page), 'panel-open').length, closeBefore = cueStarts(await state(page), 'panel-close').length;
        await press(page, '#player-login'); await page.locator('#github-connect-dialog[open]').waitFor();
        await waitCue(page, 'panel-open', openBefore + 1); await page.waitForTimeout(110);
        await press(page, '#close-github'); await waitCue(page, 'panel-close', closeBefore + 1); await page.waitForTimeout(160);
        assert.equal(cueStarts(await state(page), 'panel-open').length, openBefore + 1, 'Repeated modal mounts emit one open cue');
        assert.equal(cueStarts(await state(page), 'panel-close').length, closeBefore + 1, 'Repeated modal mounts emit one close cue');
      }
      const mapBefore = cueStarts(await state(page), 'map-open').length;
      await press(page, '[data-enter]'); await townReady(page); await waitCue(page, 'map-open', mapBefore + 1);
      assert.equal(cueStarts(await state(page), 'map-open').length, mapBefore + 1, 'Opening one town emits one map cue');
      await page.screenshot({ path: 'private/qa/audio-default-sample-close.png' });
      await press(page, '#sample-invest'); await page.locator('#investment-dialog[open]').waitFor();
      for (let attempt = 0; attempt < 12 && await page.locator('#investment-dialog').evaluate(element => element.open); attempt++) {
        await page.locator('#find-mailbox').click();
        if (await page.locator('#investment-dialog').evaluate(element => element.open)) await page.waitForTimeout(400);
      }
      await page.locator('#investment-dialog').waitFor({ state: 'hidden' });
      await page.mouse.move(0, 0); await page.waitForTimeout(180);
      const canvas = await page.locator('#scene canvas').boundingBox(), sceneHoverBefore = cueStarts(await state(page), 'hover').length;
      await page.mouse.move(canvas.x + canvas.width / 2, canvas.y + canvas.height / 2); await waitCue(page, 'hover', sceneHoverBefore + 1);
      const successBefore = cueStarts(await state(page), 'success').length;
      await page.mouse.click(canvas.x + canvas.width / 2, canvas.y + canvas.height / 2); await waitCue(page, 'success', successBefore + 1);
      assert.equal(cueStarts(await state(page), 'success').length, successBefore + 1, 'One delivered mailbox coin emits one success cue');
      await press(page, '#play'); await page.waitForTimeout(180);
      const afterPlay = (await state(page)).starts.length;
      await page.waitForFunction(() => document.querySelector('#timeline').value === '2', null, { timeout: 10000 });
      assert.equal((await state(page)).starts.length, afterPlay, 'Automatic snapshot playback stays silent');
      current = await state(page);
      assert.equal(current.created, 1, 'Navigation reuses the singleton AudioContext');
      assert.ok(current.peak <= 2, 'At most two effects overlap');
      for (const source of current.starts) {
        assert.equal(source.loop, false);
        assert.ok(source.gains.some(gain => Math.abs(gain - .18) < .001), 'The native output graph includes the quiet master gain');
        assert.ok(source.gains.reduce((total, gain) => total * gain, 1) <= .181, 'Combined output gain is bounded');
      }
      // Suspend the real context after source creation solely to hold a short clip for a deterministic stop check.
      await holdNextCue(page, '#zoom-in'); const beforeMute = await state(page);
      await page.locator('#sound-toggle').click();
      assert.equal(await page.locator('#sound-toggle').getAttribute('aria-pressed'), 'false');
      assert.equal(await page.evaluate(() => localStorage.getItem('bg-sound-enabled')), 'off');
      assert.ok((await state(page)).stops.length > beforeMute.stops.length, 'Mute stops a currently active native source');
      const mutedStarts = (await state(page)).starts.length;
      await press(page, '#zoom-out'); await page.waitForTimeout(180); assert.equal((await state(page)).starts.length, mutedStarts);
      await page.reload({ waitUntil: 'domcontentloaded' }); await page.locator('#sound-toggle').waitFor();
      assert.equal(await page.locator('#sound-toggle').getAttribute('aria-pressed'), 'false');
      await press(page, '#home'); assert.equal((await state(page)).created, 0, 'Persisted mute survives reload and trusted interaction');
      await press(page, '#sound-toggle'); await press(page, '#home'); await waitCue(page, 'click', 1);
      assert.equal(await page.evaluate(() => localStorage.getItem('bg-sound-enabled')), 'on');
      await page.waitForTimeout(150); await holdNextCue(page, '#home'); const beforeHidden = await state(page);
      await page.evaluate(() => { window.__uiAudioAudit.hiddenOverride = true; document.dispatchEvent(new Event('visibilitychange')); });
      assert.ok((await state(page)).stops.length > beforeHidden.stops.length, 'The hidden-page handler stops active native sources');
      const hiddenStarts = (await state(page)).starts.length;
      await press(page, '#home'); await page.waitForTimeout(180); assert.equal((await state(page)).starts.length, hiddenStarts);
      await page.evaluate(() => { window.__uiAudioAudit.hiddenOverride = false; document.dispatchEvent(new Event('visibilitychange')); });
      await page.waitForTimeout(180); assert.equal((await state(page)).starts.length, hiddenStarts, 'Returning to the page does not autoplay');
      await context.close(); passed.push('native lifecycle, activation, decoded clips, gains, throttle, singleton, map, automatic-history silence, mute and visibility');
      console.log('Native audio lifecycle checks passed.');
    }

    if (run('mailbox')) for (const reducedMotion of ['no-preference', 'reduce']) {
      const context = await browser.newContext({ viewport: { width: 1000, height: 800 }, reducedMotion });
      watch(context, errors, requests); await instrument(context); const page = await context.newPage(); await serve(page);
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' }); await press(page, '[data-enter]'); await townReady(page);
      for (const muted of [false, true]) {
        if (muted) await press(page, '#sound-toggle');
        await press(page, '#sample-invest'); await page.locator('#investment-dialog[open]').waitFor();
        const before = await state(page);
        for (let attempt = 0; attempt < 12 && await page.locator('#investment-dialog').evaluate(element => element.open); attempt++) {
          await press(page, '#try-demo-coin');
          if (await page.locator('#investment-dialog').evaluate(element => element.open)) await page.waitForTimeout(400);
        }
        await page.locator('#investment-dialog').waitFor({ state: 'hidden' });
        await page.locator('#demo-wallet-receipt:visible').waitFor();
        assert.equal(Number(await page.locator('#demo-wallet-receipt').getAttribute('data-demo-total')), muted ? 2 : 1);
        if (!muted) await waitCue(page, 'success', cueStarts(before, 'success').length + 1);
        await page.waitForTimeout(160);
        assert.equal(cueStarts(await state(page), 'success').length - cueStarts(before, 'success').length, muted ? 0 : 1, `${reducedMotion}: one real arrival owns the success cue, including reduced motion`);
        assert.equal(cueStarts(await state(page), 'click').length, cueStarts(before, 'click').length, 'Try coin does not compete with its arrival through a generic click cue');
      }
      await context.close(); passed.push(`actual mailbox arrival: ${reducedMotion}`); console.log(`Actual mailbox audio passed: ${reducedMotion}.`);
    }

    if (run('pending')) {
      const context = await browser.newContext(); watch(context, errors, requests); await instrument(context);
      const page = await context.newPage(); await serve(page); let arrive, release, finish;
      const arrived = new Promise(resolve => { arrive = resolve; }), released = new Promise(resolve => { release = resolve; }), finished = new Promise(resolve => { finish = resolve; });
      await page.route('**/audio/ui/click.ogg*', async route => { arrive(); await released; await route.continue(); finish(); });
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' }); await page.locator('#home').click();
      await Promise.race([arrived, new Promise((_, reject) => setTimeout(() => reject(Error('Click audio request did not arrive')), 8000))]);
      await page.locator('#sound-toggle').click(); release(); await finished; await page.waitForTimeout(450);
      assert.equal((await state(page)).starts.length, 0, 'A response arriving after mute cannot play a stale queued effect');
      await press(page, '#sound-toggle'); await page.waitForFunction(() => window.__uiAudioAudit.contexts.some(context => context.state === 'running'));
      await page.waitForTimeout(100); await press(page, '#home'); await waitCue(page, 'click', 1);
      await context.close(); passed.push('cancel delayed audio and recover after unmute'); console.log('Pending audio cancellation passed.');
    }

    if (run('fallbacks')) for (const mode of ['api-unavailable', 'storage-unavailable', 'fetch-failed', 'decode-failed', 'resume-rejected']) {
      const context = await browser.newContext(); watch(context, errors, requests); await instrument(context, mode);
      const page = await context.newPage(); await serve(page);
      if (mode === 'fetch-failed') await page.route('**/audio/ui/**', route => route.fulfill({ status: 404, body: 'Fixture audio unavailable' }));
      if (mode === 'decode-failed') await page.route('**/audio/ui/**', route => route.fulfill({ contentType: 'audio/ogg', body: 'Fixture invalid encoded audio' }));
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' }); await press(page, '#home'); await page.waitForTimeout(300);
      if (mode === 'storage-unavailable') {
        await waitCue(page, 'click', 1); await press(page, '#sound-toggle');
        assert.equal(await page.locator('#sound-toggle').getAttribute('aria-pressed'), 'false');
        await press(page, '#language'); assert.equal(await page.locator('#sound-toggle').getAttribute('aria-pressed'), 'false', 'In-memory mute survives rerenders when storage is denied');
      } else assert.equal((await state(page)).starts.length, 0, `${mode} falls back to silence`);
      if (mode === 'decode-failed') assert.ok((await state(page)).decodeFailures > 0, 'The native decoder really rejects the bad fixture');
      if (mode === 'resume-rejected') assert.ok((await state(page)).resumes > 0, 'The denied-resume fixture exercises the rejection path');
      await press(page, '[data-create]'); await page.locator('.setup-page').waitFor();
      await context.close(); passed.push(mode); console.log(`Silent fallback passed: ${mode}.`);
    }

    if (run('responsive')) for (const signedIn of [false, true]) {
      const context = await browser.newContext({ viewport: { width: 360, height: 640 }, hasTouch: true });
      watch(context, errors, requests); await instrument(context); const page = await context.newPage(); await serve(page, signedIn);
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' }); await page.locator('#sound-toggle').waitFor(); await headerFits(page);
      assert.equal((await state(page)).created, 0);
      await page.locator('#language').tap(); assert.match(await page.locator('#sound-toggle').getAttribute('aria-label'), /音效|声音/); await headerFits(page);
      await page.locator('#sound-toggle').tap(); assert.equal(await page.locator('#sound-toggle').getAttribute('aria-pressed'), 'false');
      await page.locator('[data-enter]').tap(); await townReady(page); await headerFits(page);
      await page.screenshot({ path: `private/qa/audio-header-${signedIn ? 'signed-in' : 'guest'}-360.png` });
      assert.equal(await page.locator('#sound-toggle').count(), 1);
      await page.locator('#language').tap(); assert.equal(await page.locator('#sound-toggle').getAttribute('aria-label'), 'Enable sound effects');
      await context.close(); passed.push(`360px ${signedIn ? 'signed-in' : 'guest'} bilingual header`);
    }
    assert.deepEqual(errors, [], 'Unavailable audio never becomes a page error');
    assert.ok(requests.every(url => new URL(url).origin === new URL(baseUrl).origin), 'UI audio is served locally');
    console.log(JSON.stringify({ scope, passed, browserErrors: errors, localAudioRequests: requests.length, boundary: 'Real AudioContext/decode/source graph and trusted Playwright inputs. Stop checks briefly suspend native contexts; visibility is a synthetic hidden-page event. Only the denied-resume scenario mocks state/resume.' }, null, 2));
  } catch (error) {
    const pages = browser.contexts().flatMap(context => context.pages());
    if (pages.length) await pages.at(-1).screenshot({ path: 'private/qa/ui-audio-failure.png' }).catch(() => {});
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
