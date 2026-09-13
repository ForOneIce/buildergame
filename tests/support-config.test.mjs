import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanSupport, recipientForProject, hasSupport, SUPPORT_CHAIN_ID } from '../src/support-config.mjs';
import { configuration, cleanEvent, publicBundle } from '../src/bundle.mjs';
import { baselineSnapshot, validateManifest } from '../src/model.mjs';
import { planningDraft } from '../src/planning-draft.mjs';

// Public address fixtures only. These are never used as transaction destinations.
const address = '0x52908400098527886E0F7030069857D2E4169EE7';
const secondAddress = '0x0000000000000000000000000000000000000001';
const metadata = { version: 1, chainId: SUPPORT_CHAIN_ID };
const repositories = ['https://github.com/example/first', 'https://github.com/other/second'];
const town = (options = {}) => configuration({ name: 'Support fixture', repositories, ...options });
const draft = () => ({ kind: 'buildergame-plan/v1', collection: 'personal', landscape: 'flat', title: '', username: '', repoText: '', selected: [], weights: { commits: 1, stars: 3, forks: 6 }, publish: false });
const bundle = event => ({ format: 'buildergame/v1', event, history: { schemaVersion: 1, eventId: event.id, sampleData: false, snapshots: [baselineSnapshot(event, '2026-09-13T00:00:00.000Z')] } });

test('legacy towns, public backups, and drafts retain their optional-free shape', () => {
  const event = town();
  assert.equal(hasSupport(event), false);
  assert.equal(recipientForProject(event, event.projects[0]), undefined);
  assert.equal(Object.hasOwn(event, 'support'), false);
  const backup = bundle(event);
  assert.deepEqual(publicBundle(JSON.parse(JSON.stringify(backup))), backup);
  const savedDraft = planningDraft(draft());
  assert.equal(Object.hasOwn(savedDraft, 'supportRecipient'), false);
  assert.equal(Object.hasOwn(savedDraft, 'supportRecipientsText'), false);
  for (const empty of [undefined, null, {}, metadata, { ...metadata, projectRecipients: {} }]) {
    assert.equal(cleanSupport(empty, 'hackathon', event.projects), undefined);
  }
  assert.equal(cleanSupport({ ...metadata, recipient: '' }, 'personal', event.projects), undefined);
});

test('personal towns normalize one address and resolve it only for member projects', () => {
  const event = town({ collectionType: 'personal', support: { ...metadata, recipient: ` ${address.toLowerCase()} ` } });
  assert.equal(hasSupport(event), true);
  assert.deepEqual(event.support, { ...metadata, recipient: address });
  assert.equal(recipientForProject(event, event.projects[0]), address);
  assert.equal(recipientForProject(event, event.projects[1]), address);
  assert.equal(recipientForProject(event, { repository: 'https://github.com/unknown/repo' }), undefined);
  assert.equal(recipientForProject(event, undefined), undefined);
});

test('community towns use matched canonical repository keys without organizer fallback', () => {
  const event = town({ support: { ...metadata, projectRecipients: { 'Example/First': address.toLowerCase() } } });
  assert.deepEqual(event.support.projectRecipients, { 'example/first': address });
  assert.equal(recipientForProject(event, event.projects[0]), address);
  assert.equal(recipientForProject(event, event.projects[1]), undefined);
  const extended = town({ support: { ...metadata, projectRecipients: { 'example/first': address, 'other/second': secondAddress } } });
  assert.equal(recipientForProject(extended, extended.projects[1]), secondAddress);
  assert.throws(() => town({ support: { ...metadata, recipient: address } }), /personal/);
  assert.throws(() => town({ collectionType: 'personal', support: { ...metadata, projectRecipients: {} } }), /one support recipient/);
});

test('invalid addresses, malformed settings, and unsupported networks fail closed', () => {
  for (const invalid of ['', 'not-an-address', 'alice.eth', '0x1234', '0x0000000000000000000000000000000000000000', '0x52908400098527886E0F7030069857D2E4169Ee7', 10, null]) {
    assert.throws(() => town({ support: { ...metadata, projectRecipients: { 'example/first': invalid } } }), /address|recipient|checksum/);
  }
  for (const input of [false, [], '0x123', { version: 2, chainId: SUPPORT_CHAIN_ID, recipient: address }, { version: 1, chainId: 1, recipient: address }, { version: 1, chainId: 84532, recipient: address }, { version: 1, chainId: '11155111', recipient: address }, { recipient: address }, { ...metadata, recipient: address, projectRecipients: {} }]) {
    assert.throws(() => cleanSupport(input, 'personal', town().projects));
  }
  assert.throws(() => cleanSupport({ ...metadata, projectRecipients: [] }, 'hackathon', town().projects), /map/);
  const event = town();
  event.support = { version: 1, chainId: 1, projectRecipients: { 'example/first': address } };
  assert.throws(() => validateManifest(event), /Sepolia/);
});

test('community recipient maps reject unmatched, malformed, or duplicated repository keys', () => {
  for (const projectRecipients of [
    { 'missing/repo': address },
    { 'https://github.com/example/first': address },
    { '../first': address },
    { 'example/first': address, 'Example/First': secondAddress },
  ]) assert.throws(() => town({ support: { ...metadata, projectRecipients } }));
});

test('only public support data survives configuration and backup export/import', () => {
  const event = town({ collectionType: 'personal', support: { ...metadata, recipient: address, token: 'fixture-secret', privateKey: 'fixture-secret', provider: { secret: 'fixture-secret' } } });
  event.session = 'fixture-secret';
  event.support.token = 'fixture-secret';
  const exported = publicBundle(bundle(event));
  assert.equal(JSON.stringify(exported).includes('fixture-secret'), false);
  assert.deepEqual(exported.event.support, { ...metadata, recipient: address });
  assert.deepEqual(publicBundle(JSON.parse(JSON.stringify(exported))), exported);
  assert.deepEqual(cleanEvent(event).support, exported.event.support);
  const community = bundle(town({ support: { ...metadata, projectRecipients: { 'example/first': address } } }));
  assert.deepEqual(publicBundle(JSON.parse(JSON.stringify(community))), community);
});

test('incomplete support drafts round-trip and strip unrelated credential fields', () => {
  const input = { ...draft(), supportRecipient: '0x5290', supportRecipientsText: 'example/first = 0x123\nother/second =', privateKey: 'fixture-secret', token: 'fixture-secret', session: { accessToken: 'fixture-secret' } };
  const saved = planningDraft(input);
  assert.equal(saved.supportRecipient, input.supportRecipient);
  assert.equal(saved.supportRecipientsText, input.supportRecipientsText);
  assert.equal(JSON.stringify(saved).includes('fixture-secret'), false);
  assert.deepEqual(planningDraft(JSON.parse(JSON.stringify(saved))), saved);
  assert.throws(() => planningDraft({ ...draft(), supportRecipient: 42 }), /draft field/);
  assert.throws(() => planningDraft({ ...draft(), supportRecipient: '0'.repeat(101) }), /draft field/);
  assert.throws(() => planningDraft({ ...draft(), supportRecipientsText: 'x'.repeat(30001) }), /draft field/);
});
