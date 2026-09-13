import test from 'node:test';
import assert from 'node:assert/strict';
import { assertNoLegacyRecovery, atSupportStage, canConfirmDonation, classifyError, createBrowserTransferGuard, createDonationFlow, createSupportActionGate, donationIntent, estimateDonation, sameRecoveryIntent, SUPPORT_CHAIN_HEX, validateAmount } from '../src/support/transaction.mjs';
import { EstimateGasExecutionError, InsufficientFundsError } from 'viem';

const sender = '0x1111111111111111111111111111111111111111';
const recipient = '0x2222222222222222222222222222222222222222';
const other = '0x3333333333333333333333333333333333333333';
const hash = `0x${'ab'.repeat(32)}`;
const input = { projectId: 'buildergame', recipient, amount: '0.001' };
const value = '0x38d7ea4c68000';
function fixture(overrides = {}) {
  const calls = [], sent = [];
  const responses = {
    eth_chainId: SUPPORT_CHAIN_HEX, eth_accounts: [sender], eth_estimateGas: '0x5208',
    eth_gasPrice: '0x3b9aca00', eth_getBalance: '0xde0b6b3a7640000',
    eth_getTransactionReceipt: { status: '0x1', transactionHash: hash, from: sender, to: recipient },
    eth_getTransactionByHash: { hash, from: sender, to: recipient, value }, ...overrides,
  };
  const adapter = {
    address: sender,
    async request({ method, params }) { calls.push({ method, params }); const result = responses[method]; return typeof result === 'function' ? result() : result; },
    async send(transaction) { sent.push(transaction); return { hash }; },
  };
  return { adapter, responses, calls, sent };
}
const makeFlow = options => createDonationFlow({ timeoutMs: 20, receiptWaitMs: 0, pollMs: 1, ...options });

test('support amount accepts exact wei and rejects zero, negative, rounded, exponent or oversized transfers', () => {
  assert.equal(validateAmount('0.000000000000000001').value, 1n);
  assert.equal(validateAmount(' 0.001 ').amount, '0.001');
  for (const amount of ['0', '-1', '1.01', '1e-3', '.1', '01', '0.1234567890123456789', 'Infinity', '', '0x1']) assert.throws(() => validateAmount(amount));
});

test('support intent validates recipient and is immutable', () => {
  for (const address of ['', '0x0', 'builder.eth', `0x${'0'.repeat(40)}`]) assert.throws(() => donationIntent({ ...input, recipient: address }));
  const intent = donationIntent(input);
  assert.ok(Object.isFrozen(intent)); assert.equal(intent.chainId, 11155111);
});

test('fee review is read-only and includes sender balance plus gas', async () => {
  const f = fixture(), estimate = await estimateDonation(donationIntent(input), f.adapter);
  assert.equal(estimate.fee, '0.000021'); assert.equal(estimate.balance, '1.0');
  assert.equal(f.sent.length, 0); assert.equal(f.calls.find(x => x.method === 'eth_getBalance').params[1], 'pending');
});

test('wrong chain, changed account, self-transfer and insufficient balance cannot reach a wallet send', async () => {
  for (const [overrides, alteredInput, code] of [
    [{ eth_chainId: '0x1' }, input, 'chain'],
    [{ eth_accounts: [other] }, input, 'account'],
    [{}, { ...input, recipient: sender }, 'self'],
    [{ eth_getBalance: '0x1' }, input, 'funds'],
  ]) {
    const f = fixture(overrides), flow = makeFlow();
    await flow.prepare(alteredInput, f.adapter); await flow.send();
    assert.equal(flow.getSnapshot().error, code); assert.equal(f.sent.length, 0); flow.dispose();
  }
});

test('review timeout is bounded and never submits a transaction', async () => {
  const f = fixture({ eth_gasPrice: () => new Promise(() => {}) }), flow = makeFlow();
  await flow.prepare(input, f.adapter);
  assert.equal(flow.getSnapshot().error, 'timeout'); assert.equal(f.sent.length, 0); flow.dispose();
});

test('explicit confirmation sends direct native ETH once, then credits only successful matching receipt and amount', async () => {
  const f = fixture(), credits = [], flow = makeFlow({ onConfirmed: (...args) => credits.push(args) });
  await flow.prepare(input, f.adapter);
  assert.equal(flow.getSnapshot().phase, 'ready'); assert.equal(f.sent.length, 0);
  await Promise.all([flow.send(), flow.send()]);
  assert.equal(f.sent.length, 1); assert.deepEqual(f.sent[0], { to: recipient, value: 1000000000000000n, chainId: 11155111 });
  assert.equal(flow.getSnapshot().phase, 'confirmed'); assert.equal(credits.length, 1);
  await flow.recheck(); await flow.send(); assert.equal(credits.length, 1); assert.equal(f.sent.length, 1); flow.dispose();
});

test('network or selected sender changed after review forces another review', async () => {
  for (const change of ['chain', 'account']) {
    const f = fixture(), flow = makeFlow(); await flow.prepare(input, f.adapter);
    if (change === 'chain') f.responses.eth_chainId = '0x1';
    else { f.adapter.address = other; f.responses.eth_accounts = [other]; }
    await flow.send(); assert.equal(flow.getSnapshot().error, change); assert.equal(f.sent.length, 0); flow.dispose();
  }
});

test('wallet rejection is explicit and cannot credit a coin', async () => {
  const f = fixture(), credits = [], flow = makeFlow({ onConfirmed: x => credits.push(x) });
  f.adapter.send = async () => { throw Object.assign(new Error('User rejected'), { code: 4001 }); };
  await flow.prepare(input, f.adapter); await flow.send();
  assert.equal(flow.getSnapshot().phase, 'error'); assert.equal(flow.getSnapshot().error, 'rejected'); assert.equal(credits.length, 0); flow.dispose();
});

test('lost send response locks transfer as unknown instead of offering blind retry', async () => {
  const f = fixture(), saved = [], flow = makeFlow({ persist: data => saved.push(data) });
  let attempts = 0; f.adapter.send = async () => { attempts++; throw new Error('Connection closed'); };
  await flow.prepare(input, f.adapter); await flow.send(); await flow.send();
  assert.equal(attempts, 1); assert.equal(flow.getSnapshot().phase, 'unknown'); assert.equal(flow.reset(), false);
  assert.equal(saved.at(-1).phase, 'unknown'); assert.equal(saved.at(-1).sender, sender); flow.dispose();
});

test('pending receipt keeps hash and allows only receipt recheck, without resending', async () => {
  const f = fixture({ eth_getTransactionReceipt: null }), credits = [], flow = makeFlow({ onConfirmed: x => credits.push(x) });
  await flow.prepare(input, f.adapter); await flow.send();
  assert.equal(flow.getSnapshot().phase, 'pending'); assert.equal(flow.getSnapshot().hash, hash);
  await flow.send(); await flow.prepare({ ...input, recipient: other }, f.adapter);
  assert.equal(flow.getSnapshot().intent.recipient, recipient); assert.equal(f.sent.length, 1);
  f.responses.eth_getTransactionReceipt = { status: '0x1', transactionHash: hash, from: sender, to: recipient };
  await flow.recheck(); assert.equal(flow.getSnapshot().phase, 'confirmed'); assert.equal(f.sent.length, 1); assert.equal(credits.length, 1); flow.dispose();
});

test('reverted transaction never credits even with a hash', async () => {
  const f = fixture({ eth_getTransactionReceipt: { status: '0x0', transactionHash: hash, from: sender, to: recipient } }), credits = [], flow = makeFlow({ onConfirmed: x => credits.push(x) });
  await flow.prepare(input, f.adapter); await flow.send();
  assert.equal(flow.getSnapshot().phase, 'failed'); assert.equal(flow.getSnapshot().error, 'reverted'); assert.equal(credits.length, 0); flow.dispose();
});

test('mismatched recipient, sender or actual transaction value cannot fake a receipt', async () => {
  for (const overrides of [
    { eth_getTransactionReceipt: { status: '0x1', transactionHash: hash, from: sender, to: other } },
    { eth_getTransactionReceipt: { status: '0x1', transactionHash: hash, from: other, to: recipient } },
    { eth_getTransactionByHash: { from: sender, to: recipient, value: '0x0' } },
  ]) {
    const f = fixture(overrides), credits = [], flow = makeFlow({ onConfirmed: x => credits.push(x) });
    await flow.prepare(input, f.adapter); await flow.send();
    assert.equal(flow.getSnapshot().phase, 'pending'); assert.equal(flow.getSnapshot().error, 'receipt'); assert.equal(credits.length, 0); flow.dispose();
  }
});

test('restored public checkpoint only checks an existing hash, without a new send', async () => {
  const f = fixture(), credits = [], flow = makeFlow({ onConfirmed: x => credits.push(x) });
  assert.equal(flow.restore({ ...input, sender, phase: 'pending', hash }), true);
  await flow.send(); assert.equal(f.sent.length, 0);
  await flow.recheck(f.adapter); assert.equal(flow.getSnapshot().phase, 'confirmed'); assert.equal(credits.length, 1); assert.equal(f.sent.length, 0); flow.dispose();
});

test('invalid recovery data cannot become confirmed or authorize a transfer', async () => {
  const flow = makeFlow();
  for (const saved of [{ ...input, sender, phase: 'pending', hash: 'not-a-hash' }, { ...input, sender, phase: 'confirmed', hash }, { ...input, sender: 'bad', phase: 'pending', hash }, { ...input, sender, phase: 'pending', hash, version: 99 }]) assert.equal(flow.restore(saved), false);
  assert.equal(flow.getSnapshot().phase, 'idle'); flow.dispose();
});

test('route disposal suppresses late coin animation but saves a late wallet hash for recovery', async () => {
  const f = fixture(), credits = [], saved = [], flow = makeFlow({ onConfirmed: x => credits.push(x), persist: data => saved.push(data) });
  let finish; f.adapter.send = () => new Promise(resolve => { finish = resolve; });
  await flow.prepare(input, f.adapter); const sending = flow.send();
  while (!finish) await new Promise(resolve => setTimeout(resolve, 0));
  flow.dispose(); finish({ hash }); await sending;
  assert.equal(credits.length, 0); assert.equal(saved.at(-1).hash, hash); assert.equal(saved.at(-1).phase, 'pending');
});

test('scene callback error cannot turn confirmed money into pending or failed', async () => {
  const f = fixture(), flow = makeFlow({ onConfirmed: () => { throw new Error('Scene unavailable'); } });
  await flow.prepare(input, f.adapter); await flow.send(); assert.equal(flow.getSnapshot().phase, 'confirmed'); flow.dispose();
});

test('cancelled read-only review releases immediately and ignores a late provider result', async () => {
  const f = fixture(), flow = makeFlow();
  let finish;
  f.responses.eth_chainId = () => new Promise(resolve => { finish = resolve; });
  const reviewing = flow.prepare(input, f.adapter);
  while (!finish) await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(flow.cancelPreparation(), true); assert.equal(flow.getSnapshot().phase, 'idle');
  finish(SUPPORT_CHAIN_HEX); await reviewing;
  assert.equal(flow.getSnapshot().phase, 'idle'); assert.equal(f.sent.length, 0); flow.dispose();
});

test('support action gate cancels hung wallet setup, permits retry, and fences the old result', async () => {
  const gate = createSupportActionGate(); let finish, oldCurrent;
  const old = gate.run(async ({ isCurrent }) => { oldCurrent = isCurrent; await new Promise(resolve => { finish = resolve; }); return isCurrent(); });
  await Promise.resolve(); assert.equal(gate.busy, true); gate.cancel();
  assert.equal((await old).status, 'cancelled'); assert.equal(gate.busy, false);
  const next = await gate.run(async () => 'new connection'); assert.deepEqual(next, { status: 'done', value: 'new connection' });
  finish(); assert.equal(oldCurrent(), false); gate.dispose();
});

test('support action gate bounds timeout, rejects double-clicks, and does not let stale completion clear a new action', async () => {
  const gate = createSupportActionGate(); let current;
  const first = gate.run(async context => { current = context; return new Promise(() => {}); }, 5);
  assert.equal((await gate.run(async () => 'duplicate')).status, 'busy');
  const result = await first; assert.equal(result.status, 'error'); assert.equal(result.error.code, 'timeout'); assert.equal(current.isCurrent(), false);
  assert.equal((await gate.run(async () => true)).status, 'done'); gate.dispose();
});

test('a stalled send becomes unknown without unlocking or retrying, then accepts its late real hash', async () => {
  const f = fixture(), flow = makeFlow({ sendWaitMs: 5 }); let finish;
  f.adapter.send = () => new Promise(resolve => { finish = resolve; });
  await flow.prepare(input, f.adapter); assert.equal(flow.getSnapshot().critical, false);
  const sending = flow.send(); assert.equal(flow.getSnapshot().critical, true);
  await new Promise(resolve => setTimeout(resolve, 15));
  assert.equal(flow.getSnapshot().phase, 'unknown'); assert.equal(flow.getSnapshot().critical, true);
  assert.equal(flow.cancelPreparation(), false); assert.equal(flow.reset(), false);
  finish({ hash }); await sending; assert.equal(flow.getSnapshot().phase, 'confirmed'); assert.equal(flow.getSnapshot().critical, false); flow.dispose();
});

test('provider request cancellation is an unknown broadcast outcome, not a safe user rejection', async () => {
  const f = fixture(), flow = makeFlow(); f.adapter.send = async () => { throw new Error('Network request cancelled'); };
  await flow.prepare(input, f.adapter); await flow.send();
  assert.equal(flow.getSnapshot().phase, 'unknown'); assert.equal(flow.getSnapshot().critical, true); flow.dispose();
});

test('recovering an unrelated reverted hash cannot unlock an unresolved transfer', async () => {
  const f = fixture({ eth_getTransactionReceipt: { status: '0x0', transactionHash: hash, from: other, to: recipient } }), flow = makeFlow();
  flow.restore({ ...input, sender, phase: 'pending', hash }); await flow.recheck(f.adapter);
  assert.equal(flow.getSnapshot().phase, 'pending'); assert.equal(flow.getSnapshot().critical, true); assert.equal(flow.getSnapshot().error, 'receipt'); flow.dispose();
});

function browserFixture() {
  const records = new Map(); let held = false;
  const storage = { getItem: key => records.get(key) || null, setItem: (key, value) => records.set(key, value), removeItem: key => records.delete(key) };
  const locks = { async request(name, options, callback) { if (held) return callback(null); held = true; try { return await callback({ name }); } finally { held = false; } } };
  let sequence = 0;
  const guard = () => createBrowserTransferGuard({ eventId: 'test-town', storage, locks, randomId: () => `attempt-${++sequence}` });
  return { records, storage, locks, guard };
}

test('same-origin browser lock rejects simultaneous tabs; persisted unresolved transfer blocks a new send after reload', async () => {
  const browser = browserFixture(), f1 = fixture({ eth_getTransactionReceipt: null }), f2 = fixture();
  const flow1 = makeFlow({ guard: browser.guard() }), flow2 = makeFlow({ guard: browser.guard() });
  await flow1.prepare(input, f1.adapter); await flow1.send();
  assert.equal(flow1.getSnapshot().phase, 'pending'); assert.equal(browser.records.size, 1);
  await flow2.prepare(input, f2.adapter); await flow2.send();
  assert.equal(flow2.getSnapshot().error, 'other_tab'); assert.equal(f2.sent.length, 0);
  flow1.dispose(); await Promise.resolve(); await Promise.resolve();
  await flow2.prepare(input, f2.adapter); await flow2.send();
  assert.equal(flow2.getSnapshot().error, 'unfinished'); assert.equal(f2.sent.length, 0); flow2.dispose();
  const recoveryGuard = browser.guard(), recovery = makeFlow({ guard: recoveryGuard });
  recovery.restore(recoveryGuard.read()); await recovery.recheck(f2.adapter);
  assert.equal(recovery.getSnapshot().phase, 'confirmed'); assert.equal(browser.records.size, 0); assert.equal(f2.sent.length, 0); recovery.dispose();
});

test('missing Web Locks or durable storage prevents send without disabling a read-only review', async () => {
  for (const guard of [
    createBrowserTransferGuard({ eventId: 'test-town', storage: browserFixture().storage, locks: null }),
    createBrowserTransferGuard({ eventId: 'test-town', storage: { getItem() { throw new Error(); } }, locks: browserFixture().locks }),
  ]) {
    const f = fixture(), flow = makeFlow({ guard });
    await flow.prepare(input, f.adapter); assert.equal(flow.getSnapshot().phase, 'ready');
    await flow.send(); assert.equal(flow.getSnapshot().phase, 'error'); assert.equal(flow.getSnapshot().critical, false); assert.equal(f.sent.length, 0); flow.dispose();
  }
});

test('unknown checkpoint version is preserved and fails closed instead of clearing recovery data', async () => {
  const browser = browserFixture(), raw = JSON.stringify({ version: 99, hash });
  browser.records.set('buildergame.support.pending.v2', raw);
  const f = fixture(), flow = makeFlow({ guard: browser.guard() });
  await flow.prepare(input, f.adapter); await flow.send();
  assert.equal(flow.getSnapshot().error, 'storage'); assert.equal(browser.records.get('buildergame.support.pending.v2'), raw); assert.equal(f.sent.length, 0); flow.dispose();
});

test('legacy checkpoint migration preserves the original intent and never sends', async () => {
  const browser = browserFixture(), guard = browser.guard();
  await guard.migrate({ ...input, sender, phase: 'pending', hash });
  const saved = guard.read(); assert.equal(saved.hash, hash); assert.equal(saved.recipient, recipient); assert.equal(saved.eventId, 'test-town');
  const flow = makeFlow({ guard }), f = fixture(); flow.restore(saved); await flow.recheck(f.adapter);
  assert.equal(flow.getSnapshot().phase, 'confirmed'); assert.equal(f.sent.length, 0); assert.equal(browser.records.size, 0); flow.dispose();
});

test('confirmation requires acknowledgement, current sender, authentication and a fresh ready quote', async () => {
  const f = fixture(), flow = makeFlow(); await flow.prepare(input, f.adapter);
  const checked = { state: flow.getSnapshot(), walletAddress: sender, authenticated: true, ready: true, acknowledged: true };
  assert.equal(canConfirmDonation(checked), true);
  for (const change of [{ acknowledged: false }, { authenticated: false }, { ready: false }, { walletAddress: other }, { state: { ...checked.state, critical: true } }, { state: { ...checked.state, phase: 'pending' } }]) assert.equal(canConfirmDonation({ ...checked, ...change }), false);
  assert.equal(f.sent.length, 0); flow.dispose();
});

test('closing before a queued wallet setup starts never opens a late wallet prompt', async () => {
  const gate = createSupportActionGate(); let starts = 0;
  const queued = gate.run(async () => { starts++; }); gate.cancel(); await queued;
  assert.equal(starts, 0); assert.equal(gate.busy, false); gate.dispose();
});

test('actual viem insufficient-funds error and its estimate wrapper show funding guidance instead of network failure', () => {
  const cause = new InsufficientFundsError(), wrapped = new EstimateGasExecutionError(cause, {});
  assert.equal(classifyError(cause), 'funds'); assert.equal(classifyError(wrapped), 'funds');
});

test('empty embedded wallet is identified before any gas estimate request', async () => {
  const f = fixture({ eth_getBalance: '0x0', eth_estimateGas: () => { throw new Error('Gas estimate should not run'); } }), flow = makeFlow();
  await flow.prepare(input, f.adapter);
  assert.equal(flow.getSnapshot().error, 'funds'); assert.equal(flow.getSnapshot().errorStage, 'balance');
  assert.equal(f.calls.some(call => call.method === 'eth_estimateGas'), false); assert.equal(f.sent.length, 0); flow.dispose();
});

test('RPC diagnostics expose only allow-listed stage and classified error, never raw provider details', async () => {
  const raw = 'mock private RPC details';
  await assert.rejects(atSupportStage('balance', async () => { throw Error(raw); }), error => error.code === 'network' && error.stage === 'balance' && error.message === 'network' && error.cause === undefined && !JSON.stringify(error).includes(raw));
});

test('malformed and unknown legacy records block new transfers and are never silently removed', async () => {
  for (const raw of ['{broken', JSON.stringify({version:99,phase:'unknown'}), JSON.stringify({...input,sender,phase:'unknown',hash:null})]) {
    const browser = browserFixture(), legacy = new Map([['legacy',raw]]), storage = {getItem:key=>legacy.get(key) ?? null};
    const guard = createBrowserTransferGuard({eventId:'test-town',storage:browser.storage,locks:browser.locks,randomId:()=> 'legacy-guard-fixture',assertNoLegacy:()=>assertNoLegacyRecovery(storage,'legacy')});
    const f = fixture(), flow = makeFlow({guard}); await flow.prepare(input,f.adapter); await flow.send();
    assert.equal(flow.getSnapshot().error,'legacy_pending'); assert.equal(f.sent.length,0); assert.equal(legacy.get('legacy'),raw); flow.dispose();
  }
});

test('legacy terminal matching rejects a different project, recipient, sender, amount or transaction hash', () => {
  const saved = {...input,sender,phase:'pending',hash};
  assert.equal(sameRecoveryIntent(saved,saved),true);
  for(const change of [{projectId:'another-project'},{recipient:other},{sender:other},{amount:'0.002'},{hash:'0x'+'cd'.repeat(32)}]) assert.equal(sameRecoveryIntent(saved,{...saved,...change}),false);
});
