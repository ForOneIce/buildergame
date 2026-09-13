import test from 'node:test';
import assert from 'node:assert/strict';
import { createDonationFlow, donationIntent, estimateDonation, SUPPORT_CHAIN_HEX, validateAmount } from '../src/support/transaction.mjs';

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
  for (const saved of [{ ...input, sender, phase: 'pending', hash: 'not-a-hash' }, { ...input, sender, phase: 'confirmed', hash }, { ...input, sender: 'bad', phase: 'pending', hash }]) assert.equal(flow.restore(saved), false);
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
