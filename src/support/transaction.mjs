import { formatEther, getAddress, parseEther } from 'ethers';

export const SUPPORT_CHAIN_ID = 11155111;
export const SUPPORT_CHAIN_HEX = '0xaa36a7';
export const SUPPORT_EXPLORER = 'https://sepolia.etherscan.io';
const ZERO = '0x0000000000000000000000000000000000000000';
const HASH = /^0x[0-9a-fA-F]{64}$/;

export class SupportError extends Error {
  constructor(code, message = code) { super(message); this.name = 'SupportError'; this.code = code; }
}

/** Test ETH only. Reject exponents, rounding and zero before any wallet call. */
export function validateAmount(input) {
  const amount = String(input).trim();
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/.test(amount)) throw new SupportError('amount');
  const value = parseEther(amount);
  if (value <= 0n || value > parseEther('1')) throw new SupportError('amount');
  return { amount: formatEther(value), value };
}

export function donationIntent({ projectId, recipient, amount }) {
  let address;
  try { address = getAddress(recipient); } catch { throw new SupportError('recipient'); }
  if (!projectId || address === ZERO) throw new SupportError('recipient');
  return Object.freeze({ projectId, recipient: address, ...validateAmount(amount), chainId: SUPPORT_CHAIN_ID });
}

/** One confirmation is scoped to the currently reviewed sender and immutable intent. */
export function canConfirmDonation({ state, walletAddress, authenticated, ready, acknowledged }) {
  return Boolean(acknowledged && authenticated && ready && state?.phase === 'ready' && !state.critical && state.intent && state.estimate && walletAddress && state.estimate.sender.toLowerCase() === walletAddress.toLowerCase());
}

export function classifyError(error) {
  if (error instanceof SupportError) return error.code;
  const queue = [error], seen = new Set();
  for (let checked = 0; queue.length && checked < 6; checked++) {
    const current = queue.shift(); if (!current || seen.has(current)) continue; seen.add(current);
    const code = current.code, name = current.name;
    const message = `${current.shortMessage || ''} ${current.message || ''}`.toLowerCase();
    if (code === 4001 || code === 'ACTION_REJECTED' || name === 'UserRejectedRequestError' || /user rejected|user denied|user cancelled|user canceled/.test(message)) return 'rejected';
    if (code === 'INSUFFICIENT_FUNDS' || name === 'InsufficientFundsError' || /insufficient funds|insufficient balance|exceeds the balance of the account|exceeds transaction sender account balance/.test(message)) return 'funds';
    if (code === 4902 || /unsupported chain|chain.*not supported/.test(message)) return 'chain';
    if (current.cause) queue.push(current.cause);
    if (current.error) queue.push(current.error);
  }
  return 'network';
}

/** Only an allow-listed stage and classification cross the UI boundary. Never raw RPC data. */
export async function atSupportStage(stage, task) {
  try { return await task(); }
  catch (error) {
    const sanitized = new SupportError(classifyError(error));
    sanitized.stage = ['switch', 'provider', 'chain', 'account', 'balance', 'fee', 'estimate', 'receipt', 'transaction'].includes(stage) ? stage : 'provider';
    throw sanitized;
  }
}

export function sameRecoveryIntent(left, right) {
  try {
    const a = donationIntent(left), b = donationIntent(right);
    return a.projectId === b.projectId && a.recipient === b.recipient && a.value === b.value && getAddress(left.sender) === getAddress(right.sender) && (!left.hash || left.hash.toLowerCase() === String(right.hash).toLowerCase());
  } catch { return false; }
}

export function assertNoLegacyRecovery(storage, key) {
  let raw;
  try { raw = storage.getItem(key); } catch { throw new SupportError('storage'); }
  if (raw !== null) throw new SupportError('legacy_pending');
}

/** Exclusive non-transfer actions can time out or be cancelled without stale UI writes. */
export function createSupportActionGate() {
  let generation = 0, busy = false, disposed = false, cancel;
  return {
    get busy() { return busy; },
    async run(task, timeoutMs = 30000) {
      if (disposed || busy) return { status: 'busy' };
      const token = ++generation; busy = true;
      const isCurrent = () => !disposed && generation === token;
      let timer;
      const cancelled = new Promise(resolve => { cancel = () => resolve({ status: 'cancelled' }); });
      try {
        const work = Promise.resolve().then(() => isCurrent() ? task({ isCurrent }) : undefined).then(value => ({ status: 'done', value }), error => ({ status: 'error', error }));
        const result = await Promise.race([work, cancelled, new Promise(resolve => { timer = setTimeout(() => resolve({ status: 'error', error: new SupportError('timeout') }), timeoutMs); })]);
        if (!isCurrent()) return { status: 'cancelled' };
        generation++; // A timed-out task may still settle; its context immediately becomes stale.
        return result;
      } finally { clearTimeout(timer); if (generation === token || generation === token + 1) { busy = false; cancel = undefined; } }
    },
    cancel() { generation++; busy = false; cancel?.(); cancel = undefined; },
    dispose() { disposed = true; this.cancel(); },
  };
}

const PENDING_KEY = 'buildergame.support.pending.v2';
const TRANSFER_LOCK = 'buildergame.support.transfer.v2';
/** Same-origin cooperative guard. Blockchain nonces, not this UI, prevent signed-tx replay. */
export function createBrowserTransferGuard({ eventId, storage, locks = globalThis.navigator?.locks, randomId = () => globalThis.crypto.randomUUID(), assertNoLegacy = () => {} }) {
  if (storage === undefined) { try { storage = globalThis.localStorage; } catch { /* Send fails closed in acquire. */ } }
  let attemptId, release, migratingLegacy = false;
  function read() {
    let raw;
    try { raw = storage?.getItem(PENDING_KEY); } catch { throw new SupportError('storage'); }
    if (!raw) return null;
    try {
      const saved = JSON.parse(raw), intent = donationIntent(saved);
      if (saved.version !== 2 || typeof saved.attemptId !== 'string' || !saved.attemptId || typeof saved.eventId !== 'string' || !['unknown', 'pending'].includes(saved.phase) || (saved.hash && !HASH.test(saved.hash))) throw new Error();
      getAddress(saved.sender);
      return { ...saved, ...intent };
    } catch { throw new SupportError('storage'); }
  }
  function save(checkpoint) {
    if (!attemptId) return;
    let current;
    try { current = read(); } catch { throw new SupportError('storage'); }
    if (current && current.attemptId !== attemptId) throw new SupportError('other_tab');
    try {
      if (checkpoint) {
        const intent = donationIntent(checkpoint), sender = getAddress(checkpoint.sender);
        if (!['pending', 'unknown'].includes(checkpoint.phase) || (checkpoint.hash && !HASH.test(checkpoint.hash))) throw new SupportError('storage');
        storage.setItem(PENDING_KEY, JSON.stringify({ version: 2, attemptId, eventId: current?.eventId || eventId, ...(migratingLegacy || current?.legacyVersion === 1 ? { legacyVersion: 1 } : {}), phase: checkpoint.hash ? 'pending' : 'unknown', projectId: intent.projectId, recipient: intent.recipient, amount: intent.amount, sender, hash: checkpoint.hash || null }));
      }
      else if (current?.attemptId === attemptId) storage.removeItem(PENDING_KEY);
    } catch { throw new SupportError('storage'); }
  }
  return {
    read() { const saved = read(); if (saved) attemptId = saved.attemptId; return saved; },
    save,
    async migrate(saved) {
      // Preserve legacy metadata until a verified result; never overwrite an existing v2 record.
      donationIntent(saved); getAddress(saved.sender);
      if (saved.version !== undefined && saved.version !== 1) throw new SupportError('storage');
      if (!['pending', 'unknown'].includes(saved.phase) || (saved.hash && !HASH.test(saved.hash))) throw new SupportError('storage');
      await this.acquire(true);
      migratingLegacy = true;
      try { save(saved); } finally { migratingLegacy = false; this.release(); }
    },
    async acquire(forLegacyMigration = false) {
      if (!locks?.request || !storage) throw new SupportError('browser_guard');
      if (release) throw new SupportError('other_tab');
      await new Promise((resolve, reject) => {
        let answered = false;
        const answerError = error => { if (!answered) { answered = true; reject(error); } };
        Promise.resolve().then(() => locks.request(TRANSFER_LOCK, { ifAvailable: true }, async lock => {
          if (!lock) { answerError(new SupportError('other_tab')); return; }
          try {
            // The check occurs inside the browser-wide lock, before any wallet request.
            if (read()) throw new SupportError('unfinished');
            if (!forLegacyMigration) assertNoLegacy();
            const probe = `${PENDING_KEY}.probe`; storage.setItem(probe, '1'); storage.removeItem(probe);
            attemptId = randomId();
            const lease = new Promise(done => { release = done; });
            answered = true; resolve();
            await lease;
          } catch (error) { answerError(error instanceof SupportError ? error : new SupportError('storage')); }
        })).catch(answerError);
      });
    },
    release() { release?.(); release = undefined; },
  };
}

function timeout(promise, milliseconds) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => {
    timer = setTimeout(() => reject(new SupportError('timeout')), milliseconds);
  })]).finally(() => clearTimeout(timer));
}

function reader(adapter, timeoutMs) {
  const stages = { eth_chainId: 'chain', eth_accounts: 'account', eth_getBalance: 'balance', eth_gasPrice: 'fee', eth_estimateGas: 'estimate', eth_getTransactionReceipt: 'receipt', eth_getTransactionByHash: 'transaction' };
  return (method, params = []) => atSupportStage(stages[method] || 'provider', () => timeout(Promise.resolve().then(() => adapter.request({ method, params })), timeoutMs));
}

async function assertAccountAndChain(adapter, read) {
  if (Number(await read('eth_chainId')) !== SUPPORT_CHAIN_ID) throw new SupportError('chain');
  let sender;
  try { sender = getAddress(adapter.address); } catch { throw new SupportError('account'); }
  const accounts = await read('eth_accounts');
  if (!Array.isArray(accounts) || !accounts.some(a => String(a).toLowerCase() === sender.toLowerCase())) throw new SupportError('account');
  return sender;
}

/** Every read is bounded. No timeout is ever used to retry a transfer request. */
export async function estimateDonation(intent, adapter, timeoutMs = 12000) {
  const read = reader(adapter, timeoutMs);
  const sender = await assertAccountAndChain(adapter, read);
  if (sender.toLowerCase() === intent.recipient.toLowerCase()) throw new SupportError('self');
  const request = { from: sender, to: intent.recipient, value: `0x${intent.value.toString(16)}` };
  // An unfunded new embedded wallet should show a funding hint before gas estimation fails.
  const balance = BigInt(await read('eth_getBalance', [sender, 'pending']));
  if (balance < intent.value) { const error = new SupportError('funds'); error.stage = 'balance'; throw error; }
  const [gasResult, priceResult] = await Promise.all([read('eth_estimateGas', [request]), read('eth_gasPrice')]);
  const gas = BigInt(gasResult), gasPrice = BigInt(priceResult);
  if (gas <= 0n || gasPrice < 0n || balance < 0n) throw new SupportError('network');
  const fee = gas * gasPrice;
  if (balance < intent.value + fee) throw new SupportError('funds');
  return Object.freeze({ sender, fee: formatEther(fee), balance: formatEther(balance), gas, gasPrice });
}

/** Modal closure preserves this flow; route disposal suppresses late UI callbacks. */
export function createDonationFlow({ onConfirmed = () => {}, persist = () => {}, guard, timeoutMs = 12000, receiptWaitMs = 90000, pollMs = 3000, sendWaitMs = 120000 } = {}) {
  let state = { phase: 'idle', intent: null, estimate: null, hash: null, error: null, errorStage: null, critical: false };
  let adapter, disposed = false, revision = 0, confirmationReported = false;
  const listeners = new Set();
  function checkpoint() {
    if (!state.intent || !state.estimate || !['signing', 'checking', 'pending', 'unknown'].includes(state.phase)) return null;
    return { phase: state.hash ? 'pending' : 'unknown', projectId: state.intent.projectId, recipient: state.intent.recipient, amount: state.intent.amount, sender: state.estimate.sender, hash: state.hash };
  }
  let sendTimer;
  const save = value => { try { guard?.save(value); persist(value); } catch { /* Mandatory pre-send storage is checked separately. */ } };
  const update = patch => {
    if (disposed) return;
    state = { ...state, ...patch };
    save(checkpoint());
    listeners.forEach(listener => listener());
  };
  const active = token => !disposed && token === revision;
  const locked = () => ['preparing', 'signing', 'pending', 'checking', 'unknown'].includes(state.phase);
  const reset = () => {
    if (disposed || locked()) return false;
    revision++; adapter = undefined; confirmationReported = false;
    update({ phase: 'idle', intent: null, estimate: null, hash: null, error: null, errorStage: null, critical: false });
    return true;
  };

  async function checkReceipt(token) {
    const read = reader(adapter, timeoutMs), started = Date.now();
    update({ phase: 'checking', error: null });
    try {
      do {
        if (!active(token)) return;
        if (Number(await read('eth_chainId')) !== SUPPORT_CHAIN_ID) throw new SupportError('chain');
        const receipt = await read('eth_getTransactionReceipt', [state.hash]);
        if (!active(token)) return;
        if (receipt) {
          if (String(receipt.transactionHash).toLowerCase() !== state.hash.toLowerCase()) throw new SupportError('receipt');
          if (![0, 1].includes(Number(receipt.status)) || String(receipt.to).toLowerCase() !== state.intent.recipient.toLowerCase() || String(receipt.from).toLowerCase() !== state.estimate.sender.toLowerCase()) throw new SupportError('receipt');
          // Confirm the actual transferred value, not just the receipt's successful status.
          const transaction = await read('eth_getTransactionByHash', [state.hash]);
          if (!active(token)) return;
          if (!transaction || String(transaction.hash).toLowerCase() !== state.hash.toLowerCase() || BigInt(transaction.value) !== state.intent.value || String(transaction.to).toLowerCase() !== state.intent.recipient.toLowerCase() || String(transaction.from).toLowerCase() !== state.estimate.sender.toLowerCase()) throw new SupportError('receipt');
          if (Number(receipt.status) === 0) { update({ phase: 'failed', error: 'reverted', critical: false }); guard?.release(); return; }
          update({ phase: 'confirmed', error: null, critical: false }); guard?.release();
          if (!confirmationReported && active(token)) {
            confirmationReported = true;
            try { onConfirmed(state.intent.projectId, { hash: state.hash, amount: state.intent.amount, recipient: state.intent.recipient }); }
            catch { /* A scene callback cannot change a confirmed blockchain result. */ }
          }
          return;
        }
        if (Date.now() - started >= receiptWaitMs) break;
        await new Promise(resolve => setTimeout(resolve, pollMs));
      } while (active(token));
      if (active(token)) update({ phase: 'pending', error: 'pending' });
    } catch (error) {
      if (active(token)) update({ phase: 'pending', error: classifyError(error), errorStage: error?.stage || null });
    }
  }

  return {
    getSnapshot: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    reset,
    cancelPreparation() {
      if (disposed || state.critical || state.phase !== 'preparing') return false;
      revision++; adapter = undefined;
      update({ phase: 'idle', intent: null, estimate: null, hash: null, error: null, critical: false });
      return true;
    },
    restore(saved) {
      if (disposed || !saved || !['idle', 'unknown', 'pending'].includes(state.phase)) return false;
      try {
        if (saved.version !== undefined && ![1, 2].includes(saved.version)) return false;
        const intent = donationIntent(saved), sender = getAddress(saved.sender);
        if (!['pending', 'unknown'].includes(saved.phase) || (saved.hash && !HASH.test(saved.hash))) return false;
        revision++;
        update({ phase: saved.hash ? 'pending' : 'unknown', intent, estimate: { sender, fee: '0.0', balance: '0.0', gas: 0n, gasPrice: 0n }, hash: saved.hash || null, error: saved.hash ? 'pending' : 'unknown', critical: true });
        return true;
      } catch { return false; }
    },
    async prepare(input, walletAdapter) {
      if (!reset()) return;
      const token = revision;
      update({ phase: 'preparing' });
      try {
        const intent = donationIntent(input);
        adapter = walletAdapter;
        const estimate = await estimateDonation(intent, adapter, timeoutMs);
        if (active(token)) update({ phase: 'ready', intent, estimate, error: null });
      } catch (error) {
        if (active(token)) update({ phase: 'error', error: classifyError(error), errorStage: error?.stage || null });
      }
    },
    async send() {
      if (disposed || state.phase !== 'ready') return;
      const token = revision, intent = state.intent, reviewedSender = state.estimate.sender;
      update({ phase: 'preparing', error: null, critical: true });
      try {
        await guard?.acquire();
        if (!active(token)) { guard?.release(); return; }
        // Recheck the network/account/balance immediately before opening a wallet prompt.
        const estimate = await estimateDonation(intent, adapter, timeoutMs);
        if (!active(token)) return;
        if (estimate.sender.toLowerCase() !== reviewedSender.toLowerCase()) throw new SupportError('account');
        update({ phase: 'signing', estimate });
        guard?.save(checkpoint()); // Without durable recovery metadata, do not open a send request.
      } catch (error) {
        if (active(token)) update({ phase: 'error', error: classifyError(error), errorStage: error?.stage || null, critical: false });
        guard?.release();
        return;
      }
      try {
        sendTimer = setTimeout(() => { if (active(token) && state.phase === 'signing') update({ phase: 'unknown', error: 'wallet_wait' }); }, sendWaitMs);
        // Explicit send only; no automatic transaction retries, even after a lost response.
        const result = await adapter.send({ to: intent.recipient, value: intent.value, chainId: SUPPORT_CHAIN_ID });
        clearTimeout(sendTimer);
        const hash = typeof result === 'string' ? result : result?.hash;
        if (!HASH.test(hash || '')) throw new SupportError('unknown');
        // A route may unmount while the wallet is open. Keep the public hash for recovery.
        if (!active(token)) { save({ phase: 'pending', projectId: intent.projectId, recipient: intent.recipient, amount: intent.amount, sender: reviewedSender, hash }); return; }
        update({ phase: 'pending', hash, error: null });
        await checkReceipt(token);
      } catch (error) {
        clearTimeout(sendTimer);
        const kind = classifyError(error);
        if (!active(token)) { if (['rejected', 'funds', 'chain'].includes(kind)) { save(null); guard?.release(); } return; }
        // A lost broadcast response could still mean it was sent. Never offer blind resend.
        const definitelyNotSent = ['rejected', 'funds', 'chain'].includes(kind);
        update({ phase: definitelyNotSent ? 'error' : 'unknown', error: kind, critical: !definitelyNotSent });
        if (definitelyNotSent) guard?.release();
      }
    },
    async recheck(walletAdapter) {
      if (disposed || state.phase !== 'pending' || !state.hash) return;
      if (walletAdapter) adapter = walletAdapter;
      if (!adapter) { update({ error: 'account' }); return; }
      await checkReceipt(revision);
    },
    dispose() { disposed = true; revision++; listeners.clear(); clearTimeout(sendTimer); guard?.release(); },
  };
}
