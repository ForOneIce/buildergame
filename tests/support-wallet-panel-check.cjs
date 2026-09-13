const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
const baseUrl = process.env.DEMO_URL || 'http://127.0.0.1:5173/';
const sender = '0x1111111111111111111111111111111111111111';
const recipient = '0x2222222222222222222222222222222222222222';

// Only the external Privy dependency is replaced. The shipped React panel,
// acknowledgement controls, transaction controller and browser lock run unchanged.
function sdkStub(reactUrl) { return `
import React from ${JSON.stringify(reactUrl)};
const f = window.__walletFixture;
const listeners = new Set();
const changed = () => { f.revision++; listeners.forEach(fn => fn()); };
function useFixture() { React.useSyncExternalStore(fn => { listeners.add(fn); return () => listeners.delete(fn); }, () => f.revision); }
const provider = { async request({method}) {
  f.requests.push(method);
  const replies = { eth_chainId: '0xaa36a7', eth_accounts: [${JSON.stringify(sender)}], eth_estimateGas: '0x5208', eth_gasPrice: '0x3b9aca00', eth_getBalance: '0xde0b6b3a7640000', eth_getTransactionReceipt: null };
  if (!(method in replies)) throw Error('Unexpected fixture RPC: ' + method);
  return replies[method];
}};
const wallet = { address: ${JSON.stringify(sender)}, walletClientType: 'privy', meta: {name:'Local Privy fixture'},
  async switchChain() { f.switchCalls++; if (f.hangSwitch) await new Promise(resolve => { f.finishSwitch = resolve; }); },
  async getEthereumProvider() { f.providerCalls++; return provider; }
};
export function PrivyProvider({children}) { return children; }
export function usePrivy() { useFixture(); return { ready:true, authenticated:f.authenticated, login() { f.loginCalls++; f.authenticated=true; changed(); }, async logout() { f.authenticated=false; changed(); } }; }
export function useWallets() { useFixture(); return {ready:true,wallets:f.authenticated?[wallet]:[]}; }
export function useCreateWallet() { return {async createWallet() { throw Error('Fixture never creates a wallet'); }}; }
export function useModalStatus() { return {isOpen:false}; }
export function useSendTransaction() { return {sendTransaction() { f.sendCalls++; return new Promise((resolve,reject) => { f.rejectSend = () => reject(Object.assign(Error('User rejected fixture transaction'), {code:4001})); }); }}; }
`; }

async function scenario(browser, name, authenticated, run) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1080 }, reducedMotion: 'reduce' });
  const audit = { errors: [], external: [], mutations: [], realSDK: 0 };
  let reactUrl = '/node_modules/.vite/deps/react.js';
  const fixtureUrl = new URL(`__wallet-ui-${name}`, baseUrl).href;
  try {
    await context.addInitScript(auth => {
      window.__walletFixture = { authenticated: auth, revision: 0, loginCalls: 0, sendCalls: 0, switchCalls: 0, providerCalls: 0, requests: [], locks: [], confirmations: 0, hangSwitch: false };
    }, authenticated);
    await context.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url());
      if (!['GET', 'HEAD'].includes(request.method())) { audit.mutations.push(url.href); return route.abort(); }
      if (url.origin !== new URL(baseUrl).origin && /^https?:$/.test(url.protocol)) { audit.external.push(url.href); return route.abort(); }
      if (url.href === fixtureUrl) return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Local wallet UI fixture</title><link rel="stylesheet" href="/src/support/panel.css"></head><body><button id="launcher">Open fixture</button><main id="fixture"></main></body></html>' });
      if (url.pathname === '/src/support/wallet-panel.tsx') {
        const response = await route.fetch(), source = await response.text();
        reactUrl = source.match(/from "([^"\n]+\/react\.js[^"\n]*)"/)?.[1] || reactUrl;
        const pattern = /"[^"\n]*@privy-io_react-auth\.js[^"\n]*"/g;
        assert.match(source, pattern);
        return route.fulfill({ response, body: source.replace(pattern, '"/__privy-wallet-ui-stub.js"') });
      }
      if (url.pathname === '/__privy-wallet-ui-stub.js') return route.fulfill({ contentType: 'text/javascript', body: sdkStub(reactUrl) });
      if (url.pathname.includes('@privy-io_react-auth')) { audit.realSDK++; return route.abort(); }
      return route.continue();
    });
    const page = await context.newPage(); page.on('pageerror', error => audit.errors.push(error.message));
    await page.goto(fixtureUrl);
    await page.evaluate(async ({receivingAddress, recoveryMode}) => {
      if (recoveryMode) localStorage.setItem('buildergame.support.pending.v2', JSON.stringify({version:2,attemptId:'local-recovery-fixture',eventId:'local-wallet-fixture',phase:recoveryMode,projectId:'fixture-project',recipient:receivingAddress,amount:'0.001',sender:'0x1111111111111111111111111111111111111111',hash:recoveryMode==='pending'?'0x'+'ab'.repeat(32):null}));
      const {mountWalletPanel} = await import('/src/support/wallet-panel.tsx');
      const project = {id:'fixture-project',name:'Local project',repository:'https://github.com/example/project',description:'Fixture only',builder:{name:'Fixture builder'},color:'#397d72',plot:{x:0,z:0}};
      const event = {id:'local-wallet-fixture',name:'Local wallet fixture',collectionType:'personal',projects:[project],support:{version:1,chainId:11155111,recipient:receivingAddress}};
      window.__walletFixture.panel = mountWalletPanel(document.querySelector('#fixture'), {event,t:en=>en,onConfirmed(){window.__walletFixture.confirmations++;},onLockChange(value){window.__walletFixture.locks.push(value);}}, 'local-ui-test-only');
      document.querySelector('#launcher').onclick = () => window.__walletFixture.panel.open(project);
    }, {receivingAddress:recipient,recoveryMode:name.startsWith('recover-')?name.replace('recover-',''):null});
    await page.locator('#launcher').click(); await page.locator('.support-card').waitFor();
    await run(page);
    assert.deepEqual(audit.errors, []); assert.deepEqual(audit.external, []); assert.deepEqual(audit.mutations, []); assert.equal(audit.realSDK, 0);
    assert.equal(await page.evaluate(() => window.__walletFixture.confirmations), 0);
    await page.evaluate(() => window.__walletFixture.panel.dispose());
    console.log(`${name}: passed; real SDK requests 0; external requests 0; no authentication or blockchain transactions.`);
  } finally { await context.close(); }
}

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_BIN ? { executablePath: process.env.BROWSER_BIN } : { channel: 'chrome' }) });
  try {
    await scenario(browser, 'acknowledgements-and-transfer-lock', false, async page => {
      const card = page.locator('.support-card');
      assert.equal((await card.innerText()).includes(recipient), false, 'Receiving address is masked by default');
      const login = page.getByRole('button', { name: 'Continue with email or wallet' });
      assert.equal(await login.isDisabled(), true); await login.evaluate(button => button.click());
      assert.equal(await page.evaluate(() => window.__walletFixture.loginCalls), 0);
      await page.locator('.support-wallet-help input[type=checkbox]').check(); await login.evaluate(button => { button.click(); button.click(); });
      assert.equal(await page.evaluate(() => window.__walletFixture.loginCalls), 1);
      await page.getByRole('button', { name: 'Review test transfer' }).click();
      const confirm = page.getByRole('button', { name: /^Confirm .* test ETH$/ });
      await confirm.waitFor(); assert.equal(await confirm.isDisabled(), true);
      await confirm.evaluate(button => button.click()); assert.equal(await page.evaluate(() => window.__walletFixture.sendCalls), 0);
      await page.locator('.support-transfer-risk input[type=checkbox]').check(); assert.equal(await confirm.isEnabled(), true);
      await page.getByLabel('Amount · test ETH', { exact: true }).fill('0.002');
      await page.getByRole('button', { name: 'Review test transfer' }).click(); await confirm.waitFor();
      assert.equal(await page.locator('.support-transfer-risk input[type=checkbox]').isChecked(), false);
      assert.equal(await confirm.isDisabled(), true, 'Changing the amount requires a new acknowledgement');
      await page.locator('.support-transfer-risk input[type=checkbox]').check();
      await confirm.evaluate(button => { button.click(); button.click(); });
      await page.waitForFunction(() => window.__walletFixture.sendCalls === 1);
      assert.equal(await page.getByRole('button', { name: 'Close', exact: true }).isDisabled(), true);
      await page.keyboard.press('Escape'); assert.equal(await card.isVisible(), true);
      assert.equal(await page.getByLabel('Amount · test ETH', { exact: true }).isDisabled(), true);
      assert.equal(await page.evaluate(() => window.__walletFixture.locks.at(-1)), true);
      await page.evaluate(() => window.__walletFixture.rejectSend());
      await page.waitForFunction(() => window.__walletFixture.locks.at(-1) === false);
      assert.match(await page.locator('.support-status').last().innerText(), /no network fee/);
      assert.equal(await page.getByRole('button', { name: 'Close', exact: true }).isEnabled(), true);
      assert.equal(await page.evaluate(() => window.__walletFixture.sendCalls), 1);
    });
    await scenario(browser, 'cancel-hung-review-and-reopen', true, async page => {
      await page.evaluate(() => { window.__walletFixture.hangSwitch = true; });
      await page.getByRole('button', { name: 'Review test transfer' }).click();
      await page.waitForFunction(() => window.__walletFixture.switchCalls === 1);
      await page.getByRole('button', { name: 'Close', exact: true }).click();
      await page.evaluate(() => { window.__walletFixture.hangSwitch = false; });
      await page.locator('#launcher').click();
      await page.getByRole('button', { name: 'Review test transfer' }).click();
      await page.getByRole('button', { name: /^Confirm .* test ETH$/ }).waitFor();
      await page.evaluate(() => window.__walletFixture.finishSwitch());
      assert.equal(await page.evaluate(() => window.__walletFixture.providerCalls), 1, 'Cancelled setup cannot resume into a second provider review');
      assert.equal(await page.evaluate(() => window.__walletFixture.sendCalls), 0);
    });
    for (const mode of ['pending','unknown']) await scenario(browser, `recover-${mode}`, false, async page => {
      assert.equal(await page.locator('.support-wallet-help input[type=checkbox]').count(), 0, 'Recovery is not gated by a new login acknowledgement');
      const reconnect = page.getByRole('button', {name:'Reconnect to check this transfer'});
      assert.equal(await reconnect.isEnabled(), true); await reconnect.click();
      if (mode === 'unknown') {
        await page.getByLabel('Transaction hash from your wallet').fill('0x'+'ab'.repeat(32));
        await page.getByRole('button', {name:'Find this transaction'}).click();
      }
      assert.equal(await page.locator('.support-transfer-risk input[type=checkbox]').count(), 0);
      await page.getByRole('button', {name:'Check confirmation'}).click();
      await page.waitForFunction(() => window.__walletFixture.requests.includes('eth_getTransactionReceipt'));
      assert.equal(await page.evaluate(() => window.__walletFixture.sendCalls), 0, 'Recovery only reads a saved transaction');
      assert.equal(await page.getByRole('button', {name:'Close',exact:true}).isDisabled(), true);
    });
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
