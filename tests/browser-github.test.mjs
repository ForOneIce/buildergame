import test from 'node:test';
import assert from 'node:assert/strict';
import { connectToken, listRepositories, captureTown } from '../src/browser-github.mjs';
import { github } from '../src/github-data.mjs';
import { configuration } from '../src/bundle.mjs';
import { townDeployment, validTownSlug } from '../src/town-identity.mjs';

const token = 'test-token-kept-only-in-memory';
const repo = name => ({ name, html_url: `https://github.com/builder/${name}`, private: false, visibility: 'public', size: 1, default_branch: 'main', stargazers_count: 8, forks_count: 2, owner: { login: 'builder', type: 'User', html_url: 'https://github.com/builder', avatar_url: 'https://avatars.githubusercontent.com/u/1' } });
const fakeCapture = async url => url.includes('/commits?') ? Response.json([{ sha: 'head' }], { headers: { link: '<https://api.github.com/repos/builder/project/commits?per_page=1&page=120>; rel="last"' } }) : Response.json(repo(url.split('/').at(-1)));

test('direct token connection validates /user without returning secrets or imposing a token prefix', async () => {
  const calls = [];
  const fetcher = async (url, init) => { calls.push({ url, init }); return Response.json({ login: 'builder', avatar_url: 'https://avatars.githubusercontent.com/u/1', token, private_note: 'omit' }); };
  const account = await connectToken(`  ${token}  `, { fetcher });
  assert.deepEqual(account, { login: 'builder', avatar: 'https://avatars.githubusercontent.com/u/1' });
  assert.equal(calls.length, 1); assert.equal(calls[0].url, 'https://api.github.com/user');
  assert.equal(calls[0].init.headers.Authorization, `Bearer ${token}`);
  assert.equal(calls[0].init.mode, 'cors'); assert.equal(calls[0].init.credentials, 'omit'); assert.ok(calls[0].init.signal instanceof AbortSignal);
  assert.equal('User-Agent' in calls[0].init.headers, false);
  await assert.rejects(connectToken('   ', { fetcher }), /Enter a GitHub/);
  assert.equal(calls.length, 1); assert.equal(JSON.stringify(account).includes(token), false);
});

test('repository listing uses bounded official pagination and excludes private/internal repositories', async () => {
  const calls = [];
  const result = await listRepositories('builder', 2, token, async (url, init) => {
    calls.push({ url, init });
    return Response.json([repo('public'), { ...repo('secret'), private: true }, { ...repo('internal'), visibility: 'internal' }], { headers: { link: '<https://example.invalid/never-follow-provider-links>; rel="next"' } });
  });
  assert.equal(calls.length, 1); assert.equal(new URL(calls[0].url).hostname, 'api.github.com');
  assert.equal(new URL(calls[0].url).searchParams.get('page'), '2'); assert.equal(result.nextPage, 3);
  assert.deepEqual(result.repositories.map(project => project.name), ['public']);
  assert.equal(JSON.stringify(result).includes(token), false);
  await assert.rejects(listRepositories('../unsafe', 1, token, fakeCapture), /valid GitHub/);
  await assert.rejects(listRepositories('builder', 101, token, fakeCapture), /valid GitHub/);
  let anonymousHeaders; await listRepositories('builder', 1, '', async (_url, init) => { anonymousHeaders = init.headers; return Response.json([]); });
  assert.equal('Authorization' in anonymousHeaders, false);
});

test('friendly auth, limits, network and timeout errors never expose provider bodies or fetch errors', async () => {
  const cases = [
    [401, {}, 'github_auth', /valid|expired/],
    [403, {}, 'github_forbidden', /restricted/],
    [403, { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '2000000000' }, 'github_rate_limit', /2033-05-18T03:33:20.000Z/],
    [429, { 'retry-after': '30' }, 'github_rate_limit', /30 seconds/],
  ];
  for (const [status, headers, code, message] of cases) {
    let requests = 0;
    await assert.rejects(connectToken(token, { fetcher: async () => { requests++; return Response.json({ message: token }, { status, headers }); } }), error => error.status === status && error.code === code && message.test(error.message) && !error.message.includes(token));
    assert.equal(requests, 1, 'No automatic retries');
  }
  await assert.rejects(connectToken(token, { fetcher: async () => { throw Object.assign(new Error(token), { code: 'github_auth' }); } }), error => error.code === 'network' && !error.message.includes(token));
  await assert.rejects(connectToken(token, { fetcher: async () => { throw new DOMException(token, 'TimeoutError'); } }), error => error.code === 'timeout' && /20 seconds/.test(error.message) && !error.message.includes(token));
});

test('cancellation aborts the current direct request and never starts another repository', async () => {
  const controller = new AbortController(); let calls = 0;
  const fetcher = (_url, init) => new Promise((_resolve, reject) => { calls++; init.signal.addEventListener('abort', () => reject(new DOMException('cancelled', 'AbortError')), { once: true }); });
  const event = configuration({ name: 'Cancelled town', repositories: ['https://github.com/builder/one', 'https://github.com/builder/two'] });
  const pending = captureTown(event, null, token, { fetcher, signal: controller.signal }); controller.abort();
  await assert.rejects(pending, error => error.name === 'AbortError' && error.code === 'cancelled');
  assert.equal(calls, 1);
  await assert.rejects(github('/user', token, fetcher, { signal: controller.signal }), error => error.code === 'cancelled');
  assert.equal(calls, 1);
});

test('each direct GitHub request aborts at its 20 second deadline', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] }); let signal;
  const pending = connectToken(token, { fetcher: (_url, init) => new Promise((_resolve, reject) => { signal = init.signal; signal.addEventListener('abort', () => reject(new DOMException('Timeout', 'AbortError')), { once: true }); }) });
  context.mock.timers.tick(19999); assert.equal(signal.aborted, false);
  context.mock.timers.tick(1);
  await assert.rejects(pending, error => error.code === 'timeout' && /20 seconds/.test(error.message));
  assert.equal(signal.aborted, true);
});

test('browser captures preserve baseline, named snapshots, public fields, fixed addresses and old history', async () => {
  const event = configuration({ name: 'Browser town', repositories: ['https://github.com/builder/one', 'https://github.com/builder/two'] });
  event.secret = token;
  const first = await captureTown(event, null, token, { label: '  Launch day  ', fetcher: fakeCapture });
  assert.equal(first.published, false); assert.ok(validTownSlug(first.bundle.event.deployment.slug));
  assert.equal(first.bundle.history.snapshots[0].kind, 'baseline'); assert.equal(first.bundle.history.snapshots[1].label, 'Launch day');
  assert.equal(first.bundle.history.snapshots[1].projects[0].metrics.commits, 120); assert.equal(JSON.stringify(first).includes(token), false);
  const preserved = JSON.stringify(first.bundle);
  const later = await captureTown(first.bundle.event, first.bundle, token, { label: 'Follow-up', fetcher: async url => url.includes('/two') ? Response.json({}, { status: 404 }) : fakeCapture(url) });
  assert.equal(later.bundle.history.snapshots.length, 3); assert.equal(later.bundle.event.deployment.slug, first.bundle.event.deployment.slug);
  assert.equal(later.bundle.history.snapshots.at(-1).projects[1].status, 'stale'); assert.deepEqual(later.failures, ['plot-1']);
  assert.equal(JSON.stringify(first.bundle), preserved);
  await assert.rejects(captureTown({ ...first.bundle.event, name: 'Renamed' }, first.bundle, token, { fetcher: fakeCapture }), /Town name is fixed/);
  let attempts = 0;
  await assert.rejects(captureTown(first.bundle.event, first.bundle, token, { fetcher: async () => { attempts++; return Response.json({ message: token }, { status: 429 }); } }), error => error.code === 'github_rate_limit' && !error.message.includes(token));
  assert.equal(attempts, 1); assert.equal(JSON.stringify(first.bundle), preserved);
  const chinese = townDeployment('开发者小镇', new Date('2026-09-13T10:20:30.123Z'));
  assert.ok(validTownSlug(chinese.slug)); assert.match(chinese.slug, /^town-[a-f0-9]{8}-20260913-102030123$/);
});
