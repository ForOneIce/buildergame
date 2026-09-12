import test from 'node:test';
import assert from 'node:assert/strict';
import { configuration, publicBundle, assertAppend } from '../src/bundle.mjs';
import { baselineSnapshot, validateManifest } from '../src/model.mjs';
import { capture } from '../server/github.mjs';

const event = () => configuration({ name: 'Snapshot fixture', repositories: ['https://github.com/fixture/project'] });
const fetcher = async url => url.includes('/commits?')
  ? Response.json([{ sha: 'fixture-head' }], { headers: { link: '<https://api.github.com/repos/fixture/project/commits?per_page=1&page=42>; rel="last"' } })
  : Response.json({ name: 'project', private: false, size: 1, default_branch: 'main', stargazers_count: 11, forks_count: 3, owner: { avatar_url: 'https://avatars.githubusercontent.com/u/1' } });

test('new towns begin with an explicit visual baseline, followed by measured observations', async () => {
  const source = event(), original = structuredClone(source);
  const { bundle } = await capture(source, null, null, fetcher);
  assert.deepEqual(source, original, 'Capture does not rewrite its input configuration');
  const [baseline, measured] = bundle.history.snapshots;
  assert.equal(bundle.history.snapshots.length, 2);
  assert.equal(baseline.kind, 'baseline');
  assert.equal(baseline.label, 'Town founded');
  assert.deepEqual(baseline.projects[0], {
    projectId: source.projects[0].id, plot: source.projects[0].plot,
    status: 'baseline', stage: 'land', metrics: null, score: null, rule: null, observedAt: null,
  });
  assert.equal(measured.kind, 'capture');
  assert.equal(measured.label, 'Snapshot 1');
  assert.equal(measured.projects[0].metrics.commits, 42);
  assert.equal(measured.projects[0].status, 'fresh');
  assert.ok(Date.parse(measured.capturedAt) > Date.parse(baseline.capturedAt));
  assert.deepEqual(publicBundle(JSON.parse(JSON.stringify(bundle))), bundle);
});

test('explicit recaptures preserve prior snapshots and order same-millisecond captures', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-09-14T00:00:00.000Z') });
  const { bundle: first } = await capture(event(), null, null, fetcher);
  const imported = publicBundle(JSON.parse(JSON.stringify(first)));
  const { bundle: second } = await capture(imported.event, imported.history, null, fetcher, { label: '  First community showcase  ' });
  assert.equal(second.history.snapshots.length, 3);
  assert.equal(second.history.snapshots.filter(snapshot => snapshot.kind === 'baseline').length, 1);
  assert.deepEqual(second.history.snapshots.slice(0, 2), first.history.snapshots);
  assert.equal(second.history.snapshots[2].label, 'First community showcase');
  assert.ok(Date.parse(second.history.snapshots[2].capturedAt) > Date.parse(first.history.snapshots[1].capturedAt));
  assert.equal(second.history.snapshots[2].projects[0].stage, first.history.snapshots[1].projects[0].stage);
  assert.doesNotThrow(() => assertAppend(first, second));
  const { bundle: third } = await capture(second.event, second.history, null, fetcher, { label: '' });
  assert.equal(third.history.snapshots.at(-1).label, 'Snapshot 3', 'Automatic labels count captures, excluding the baseline');
});

test('legacy backups retain their original history and do not acquire a duplicate or retroactive baseline', async () => {
  const { bundle } = await capture(event(), null, null, fetcher);
  bundle.history.snapshots.shift();
  delete bundle.history.snapshots[0].kind;
  const legacy = publicBundle(bundle), original = structuredClone(legacy);
  const { bundle: next } = await capture(legacy.event, legacy.history, null, fetcher);
  assert.deepEqual(legacy, original);
  assert.equal(next.history.snapshots.length, 2);
  assert.equal(next.history.snapshots.some(snapshot => snapshot.kind === 'baseline'), false);
  assert.deepEqual(next.history.snapshots[0], original.history.snapshots[0]);
  assert.equal(next.history.snapshots[1].label, 'Snapshot 2');
  assert.doesNotThrow(() => assertAppend(legacy, next));
  const displayStart = baselineSnapshot(legacy.event, new Date(Date.parse(legacy.history.snapshots[0].capturedAt) - 1).toISOString());
  assert.equal(displayStart.kind, 'baseline');
  assert.deepEqual(legacy, original, 'A derived display baseline does not mutate stored legacy history');
});

test('baseline validation forbids invented observations, later baselines and missing provenance', async () => {
  const { bundle } = await capture(event(), null, null, fetcher);
  for (const alter of [
    value => { value.history.snapshots[0].projects[0].metrics = { commits: 0, stars: 0, forks: 0 }; },
    value => { value.history.snapshots[0].projects[0].observedAt = value.history.snapshots[0].capturedAt; },
    value => { value.history.snapshots[0].projects[0].stage = 'foundation'; },
    value => { delete value.history.snapshots[0].kind; },
    value => { value.history.snapshots[1].kind = 'baseline'; },
    value => { value.history.snapshots[0].kind = 'invented'; },
  ]) {
    const invalid = structuredClone(bundle); alter(invalid);
    assert.throws(() => publicBundle(invalid));
  }
});

test('zero projects, invalid labels and mismatched histories fail before fetching GitHub', async () => {
  assert.throws(() => configuration({ name: 'Empty', repositories: [] }), /1–200 projects/);
  const empty = event(); empty.projects = [];
  let requests = 0;
  const unexpectedFetch = async () => { requests++; throw new Error('Unexpected request'); };
  await assert.rejects(capture(empty, null, null, unexpectedFetch), /1–200 projects/);
  for (const label of ['x'.repeat(121), 42, {}]) await assert.rejects(capture(event(), null, null, unexpectedFetch, { label }), /label/);
  const { bundle } = await capture(event(), null, null, fetcher);
  const other = event();
  await assert.rejects(capture(other, bundle.history, null, unexpectedFetch), /mismatch/);
  assert.equal(requests, 0);
});

test('partial initial fetch failures remain unknown after the visual baseline', async () => {
  const source = configuration({ name: 'Partial fixture', repositories: ['https://github.com/fixture/project', 'https://github.com/fixture/missing'] });
  const { bundle, failures } = await capture(source, null, null, url => url.includes('/missing') ? Promise.resolve(Response.json({}, { status: 404 })) : fetcher(url));
  assert.deepEqual(failures, ['plot-1']);
  assert.equal(bundle.history.snapshots[0].projects[1].status, 'baseline');
  const unknown = bundle.history.snapshots[1].projects[1];
  assert.equal(unknown.status, 'unknown'); assert.equal(unknown.stage, null); assert.equal(unknown.metrics, null);
});

test('portable deployment metadata is cleaned, validated and fixed after its first assignment', async () => {
  const source = event();
  source.residentMap = { enabled: true, fetchProfiles: false };
  source.projects[0].builder.locationText = 'Example region';
  source.projects[0].builder.location = { label: 'Example region', lat: 10, lon: 20, source: 'manual' };
  const { bundle: legacy } = await capture(source, null, null, fetcher);
  const assigned = structuredClone(legacy);
  assigned.event.deployment = { slug: 'snapshot-fixture-20260914-000000000', createdAt: '2026-09-14T00:00:00.000Z', secret: 'do-not-export' };
  const portable = publicBundle(assigned);
  assert.deepEqual(portable.event.deployment, { slug: assigned.event.deployment.slug, createdAt: assigned.event.deployment.createdAt });
  assert.deepEqual(portable.event.projects[0].builder.location, source.projects[0].builder.location);
  assert.equal(portable.event.projects[0].builder.locationText, 'Example region');
  assert.doesNotThrow(() => assertAppend(legacy, portable), 'Legacy towns can receive deployment metadata once');
  for (const alter of [
    value => { value.event.name = 'Renamed town'; },
    value => { value.event.deployment.slug = 'different-town'; },
    value => { value.event.deployment.createdAt = '2026-09-15T00:00:00.000Z'; },
    value => { delete value.event.deployment; },
  ]) {
    const invalid = structuredClone(portable); alter(invalid);
    assert.throws(() => assertAppend(portable, invalid), /fixed/);
  }
  for (const deployment of [
    { slug: '../outside', createdAt: '2026-09-14T00:00:00.000Z' },
    { slug: 'UPPERCASE', createdAt: '2026-09-14T00:00:00.000Z' },
    { slug: 'x'.repeat(121), createdAt: '2026-09-14T00:00:00.000Z' },
    { slug: 'valid-slug', createdAt: '2026-09-14' },
    { slug: 'valid-slug', createdAt: 'not-a-date' },
  ]) {
    const invalid = event(); invalid.deployment = deployment;
    assert.throws(() => validateManifest(invalid));
  }
});
