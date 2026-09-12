import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sampleTown } from '../src/sample.mjs';
import { townDeployment, townStore, validTownSlug } from '../server/towns.mjs';
import { createApi } from '../server/api.mjs';
import { createWebHandler } from '../server/http.mjs';
import { configuration } from '../src/bundle.mjs';

const example = (name, id) => {
  const bundle = sampleTown(); bundle.event.name = name; bundle.event.id = id; bundle.history.eventId = id; return bundle;
};
const storageOptions = dir => ({ directory: join(dir, 'towns'), legacyFile: join(dir, 'default.json'), staticDirectory: join(dir, 'static', 'towns'), staticFile: join(dir, 'static', 'town.json'), clock: () => new Date('2026-09-13T10:20:30.123Z') });
async function temporary(run) {
  const dir = await mkdtemp(join(tmpdir(), 'bg-towns-'));
  try { await run(dir); } finally { await rm(dir, { recursive: true, force: true }); }
}

test('unique towns persist across restart with private ownership and stable public identity', async () => temporary(async dir => {
  const options = storageOptions(dir), store = townStore(options);
  const first = await store.publish(example('Café Garden', 'one'), 'Alice');
  const second = await store.publish(example('Cafe Garden', 'two'), 'Bob');
  assert.match(first.town.slug, /^cafe-garden-20260913-102030123$/);
  assert.match(second.town.slug, /^cafe-garden-20260913-102030123-[a-f0-9]{6}$/);
  assert.equal(first.town.path, `/towns/${first.town.slug}/`);
  assert.equal((await townStore(options).list()).length, 2);
  assert.deepEqual(await townStore(options).get(first.town.slug), first.bundle);
  const persisted = JSON.parse(await readFile(join(options.directory, `${first.town.slug}.json`), 'utf8'));
  assert.equal(persisted.owner, 'alice'); assert.equal('owner' in first.bundle, false);
  assert.equal(await store.readDefault(), null);
  await assert.rejects(store.prepare(first.bundle.event, 'Bob'), error => error.status === 403);
  await assert.rejects(store.publish(example('ＣＡＦÉ   ＧＡＲＤＥＮ', 'other'), 'Bob'), /name already exists/);
  await assert.rejects(store.prepare({ ...first.bundle.event, name: 'Renamed' }, 'Alice'), /names are fixed/);
  const changedAddress = structuredClone(first.bundle); changedAddress.event.deployment.slug = 'another-address';
  await assert.rejects(store.publish(changedAddress, 'Alice'), /address is fixed/);
  const changedHistory = structuredClone(first.bundle); changedHistory.history.snapshots[0].label = 'Rewrite';
  await assert.rejects(store.publish(changedHistory, 'Alice'), /rewrite published history/);
  assert.deepEqual((await store.get(first.town.slug)).history, first.bundle.history);
  assert.equal((await readdir(options.directory)).some(name => name.endsWith('.tmp')), false);
}));

test('repository data is publicly readable and deployer-managed; old default export stays compatible', async () => temporary(async dir => {
  const options = storageOptions(dir); await mkdir(options.staticDirectory, { recursive: true });
  const bundle = example('Repository town', 'repository-town');
  bundle.event.deployment = townDeployment(bundle.event.name, new Date('2026-09-01T00:00:00.000Z'));
  await writeFile(join(options.staticDirectory, `${bundle.event.deployment.slug}.json`), JSON.stringify(bundle));
  await writeFile(join(options.staticDirectory, 'index.json'), JSON.stringify({ towns: [] }));
  const legacy = example('Legacy town', 'legacy'); await writeFile(options.legacyFile, JSON.stringify(legacy));
  const store = townStore(options);
  assert.equal((await store.list()).length, 1);
  assert.deepEqual(await store.get(bundle.event.deployment.slug), bundle);
  await assert.rejects(store.prepare(bundle.event, 'visitor'), error => error.status === 403);
  await assert.rejects(store.prepare(legacy.event, 'visitor'), error => error.status === 403);
  const saved = await store.publish(bundle, 'admin', true);
  assert.equal(saved.town.slug, bundle.event.deployment.slug);
  assert.deepEqual(await store.readDefault(), saved.bundle);
  assert.deepEqual(JSON.parse(await readFile(options.legacyFile, 'utf8')), saved.bundle);
  assert.equal((await store.list()).length, 1);
  await assert.rejects(store.get('../default'), error => error.status === 400);
  await assert.rejects(store.get('x%2fy'), error => error.status === 400);
  await assert.rejects(store.get('index'), error => error.status === 400);
  const reserved = example('Index import', 'reserved'); reserved.event.deployment = { slug: 'index', createdAt: '2026-09-01T00:00:00.000Z' };
  await assert.rejects(store.publish(reserved, 'visitor'), /Invalid/);
  assert.equal(await store.get('missing-town'), null);
  const chinese = townDeployment('开发者小镇'); assert.ok(validTownSlug(chinese.slug)); assert.ok(chinese.slug.startsWith('town-'));
}));

test('authenticated builders own their towns; visitors read them without exposing OAuth secrets', async () => temporary(async dir => {
  let handler, user = 'alice', userId = 1, requests = 0;
  const server = createServer((req, res) => handler(req, res));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const env = { PUBLIC_ORIGIN: origin, GITHUB_CLIENT_ID: 'test', GITHUB_CLIENT_SECRET: 'client-private', TOWN_DATA_FILE: join(dir, 'default.json'), TOWN_DATA_DIR: join(dir, 'towns') };
  const fetcher = async url => {
    if (url.includes('access_token')) return Response.json({ access_token: 'oauth-private' });
    if (url.endsWith('/user')) return Response.json({ login: user, id: userId });
    requests++;
    if (url.includes('/commits?')) return Response.json([{ sha: 'head' }]);
    return Response.json({ name: 'project', private: false, default_branch: 'main', size: 1, stargazers_count: 3, forks_count: 2, owner: { login: user } });
  };
  const options = { fetcher, staticDirectory: join(dir, 'static'), staticFile: join(dir, 'static.json') };
  handler = createApi(env, options);
  const post = (data, cookie = '') => fetch(`${origin}/api/capture`, { method: 'POST', headers: { origin, cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const signIn = async () => {
    const start = await fetch(`${origin}/api/auth/login`, { redirect: 'manual' });
    assert.equal(start.status, 302);
    const state = new URL(start.headers.get('location')).searchParams.get('state');
    const finish = await fetch(`${origin}/api/auth/callback?state=${state}&code=code`, { headers: { cookie: `bg_state=${state}` }, redirect: 'manual' });
    assert.equal(finish.status, 302); return finish.headers.getSetCookie()[0].split(';')[0];
  };
  try {
    const event = configuration({ name: 'Alice place', repositories: ['https://github.com/alice/project'] });
    assert.equal((await post({ event, publish: true })).status, 401);
    const preview = await post({ event, publish: false }); assert.equal(preview.status, 200);
    const portable = await preview.json(); assert.equal(portable.published, false); assert.ok(validTownSlug(portable.bundle.event.deployment.slug));
    assert.equal((await (await fetch(`${origin}/api/towns`)).json()).towns.length, 0);
    assert.deepEqual(await readdir(dir), [], 'Anonymous captures produce portable exports without server writes');
    const alice = await signIn();
    const session = await (await fetch(`${origin}/api/session`, { headers: { cookie: alice } })).json();
    assert.equal(session.canPublish, true); assert.equal(session.isDeployer, false);
    const creation = await post({ event, publish: true, label: 'Launch day' }, alice); assert.equal(creation.status, 200);
    const first = await creation.json(); assert.equal(first.bundle.history.snapshots.length, 2); assert.equal(first.bundle.history.snapshots.at(-1).label, 'Launch day');
    assert.ok(first.town.path.startsWith('/towns/')); assert.equal(first.published, true);
    const publicRead = await (await fetch(`${origin}/api/towns/${first.town.slug}`)).json(); assert.deepEqual(publicRead, first.bundle);
    const directory = await (await fetch(`${origin}/api/towns`)).json(); assert.equal(directory.towns.length, 1);
    assert.equal(JSON.stringify({ first, publicRead, directory, session }).includes('oauth-private'), false);
    assert.equal((await readFile(join(dir, 'towns', `${first.town.slug}.json`), 'utf8')).includes('oauth-private'), false);
    assert.equal(JSON.stringify(directory).includes('owner'), false);
    assert.equal(await (await fetch(`${origin}/api/town`)).json(), null);
    user = 'bob'; userId = 2; const bob = await signIn(); const before = requests;
    assert.equal((await post({ event: first.bundle.event, previous: first.bundle, publish: true }, bob)).status, 403);
    assert.equal(requests, before, 'Ownership is checked before repository capture');
    const duplicate = configuration({ name: '  ALICE   PLACE ', repositories: ['https://github.com/bob/project'] });
    assert.equal((await post({ event: duplicate, publish: true }, bob)).status, 409);
    const bobEvent = configuration({ name: 'Bob place', repositories: ['https://github.com/bob/project'] });
    const bobTown = await post({ event: bobEvent, publish: true }, bob); assert.equal(bobTown.status, 200);
    assert.equal((await post({ event: first.bundle.event, publish: true }, alice)).status, 409);
    await new Promise(resolve => setTimeout(resolve, 3));
    const update = await post({ event: first.bundle.event, previous: first.bundle, publish: true, label: 'Aftercare' }, alice);
    assert.equal(update.status, 200); const next = await update.json(); assert.equal(next.bundle.history.snapshots.length, 3); assert.equal(next.town.slug, first.town.slug);
    handler = createApi(env, options);
    assert.deepEqual(await (await fetch(`${origin}/api/towns/${first.town.slug}`)).json(), next.bundle);
    assert.equal((await (await fetch(`${origin}/api/towns`)).json()).towns.length, 2);
    assert.equal((await fetch(`${origin}/api/towns/missing`)).status, 404);
    user = 'alice'; userId = 99; const reusedName = await signIn();
    assert.equal((await post({ event: next.bundle.event, previous: next.bundle, publish: true }, reusedName)).status, 403);
    user = 'alice-renamed'; userId = 1; const renamed = await signIn();
    const renamedUpdate = await post({ event: next.bundle.event, previous: next.bundle, publish: true }, renamed);
    assert.equal(renamedUpdate.status, 200);
  } finally { await new Promise(resolve => server.close(resolve)); }
}));

test('production town subpaths reload the app with root-based assets and reject traversal', async () => temporary(async dir => {
  await mkdir(join(dir, 'assets')); await writeFile(join(dir, 'index.html'), '<!doctype html><html><head><script src="./assets/app.js"></script></head><body>Town</body></html>');
  await writeFile(join(dir, 'assets', 'app.js'), 'export default 1;');
  const server = createServer(createWebHandler({ root: dir, api: (_req, res) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"ok":true}'); } }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    const canonical = await fetch(`${origin}/towns/alice-20260913?view=map`, { redirect: 'manual' });
    assert.equal(canonical.status, 308); assert.equal(canonical.headers.get('location'), '/towns/alice-20260913/?view=map');
    const page = await fetch(`${origin}/towns/alice-20260913/`); assert.equal(page.status, 200);
    const html = await page.text(); assert.ok(html.indexOf('<base href="/">') < html.indexOf('<script'));
    assert.equal((await fetch(`${origin}/assets/app.js`)).status, 200);
    assert.equal((await fetch(`${origin}/towns/unsafe%20name/`)).status, 404);
    assert.equal((await fetch(`${origin}/%2e%2e%5cserver%5capi.mjs`)).status, 404);
    assert.equal((await fetch(`${origin}/towns/alice-20260913/`, { method: 'POST' })).status, 405);
    assert.deepEqual(await (await fetch(`${origin}/api/towns`)).json(), { ok: true });
  } finally { await new Promise(resolve => server.close(resolve)); }
}));
