const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const baseUrl = process.env.DEMO_URL || 'http://127.0.0.1:5173/';
const sender = '0x1111111111111111111111111111111111111111';
const recipient = '0x2222222222222222222222222222222222222222';
async function screenshot(page, name) {
  const directory = process.env.WALLET_UI_SCREENSHOT_DIR;
  if (!directory) return;
  fs.mkdirSync(directory, {recursive:true});
  await page.screenshot({path:path.join(directory,`${name}.png`)});
}

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
  if (method === 'eth_getBalance' && f.emptyWallet) return '0x0';
  const replies = { eth_chainId: '0xaa36a7', eth_accounts: [${JSON.stringify(sender)}], eth_estimateGas: '0x5208', eth_gasPrice: '0x3b9aca00', eth_getBalance: '0xde0b6b3a7640000', eth_getTransactionReceipt: f.completeReceipt ? {status:'0x1',transactionHash:'0x'+'ab'.repeat(32),from:${JSON.stringify(sender)},to:${JSON.stringify(recipient)}} : null, eth_getTransactionByHash:{hash:'0x'+'ab'.repeat(32),from:${JSON.stringify(sender)},to:${JSON.stringify(recipient)},value:'0x38d7ea4c68000'} };
  if (!(method in replies)) throw Error('Unexpected fixture RPC: ' + method);
  return replies[method];
}};
const wallet = { address: ${JSON.stringify(sender)}, walletClientType: 'privy', meta: {name:'Local Privy fixture'},
  async switchChain() { f.switchCalls++; if (f.hangSwitch) await new Promise(resolve => { f.finishSwitch = resolve; }); },
  async getEthereumProvider() { f.providerCalls++; return provider; }
};
export function PrivyProvider({children}) { return children; }
export function usePrivy() { useFixture(); return { ready:true, authenticated:f.authenticated, login() { f.loginCalls++; f.authenticated=true; changed(); }, async logout() { f.authenticated=false; changed(); } }; }
export function useWallets() { useFixture(); return {ready:true,wallets:f.authenticated?(f.multipleWallets?[wallet,{...wallet,address:'0x3333333333333333333333333333333333333333',walletClientType:'metamask',meta:{name:'External fixture'}}]:[wallet]):[]}; }
export function useCreateWallet() { return {async createWallet() { throw Error('Fixture never creates a wallet'); }}; }
export function useModalStatus() { return {isOpen:false}; }
export function useSendTransaction() { return {sendTransaction() { f.sendCalls++; return new Promise((resolve,reject) => { f.rejectSend = () => reject(Object.assign(Error('User rejected fixture transaction'), {code:4001})); }); }}; }
`; }

async function scenario(browser, name, authenticated, run, { viewport = { width: 1280, height: 720 }, language = 'en', community = false, recoveryMode = name.startsWith('recover-') ? name.replace('recover-', '') : null } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
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
      if (url.href === fixtureUrl) return route.fulfill({ contentType: 'text/html', body: `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Local wallet UI fixture</title>${['ui/theme','style','flow','map-ui','mailbox-ui','ui/audio-control','support/panel'].map(path=>`<link rel="stylesheet" href="/src/${path}.css">`).join('')}</head><body><button id="launcher">Open fixture</button><main id="fixture"></main></body></html>` });
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
    await page.evaluate(async ({receivingAddress, recoveryMode, language, community}) => {
      window.__walletFixture.multipleWallets = community;
      if (recoveryMode) {
        const phase = recoveryMode === 'other-intent' ? 'pending' : recoveryMode;
        localStorage.setItem('buildergame.support.pending.v2', JSON.stringify({version:2,attemptId:'local-recovery-fixture',eventId:recoveryMode==='other-intent'?'another-town':'local-wallet-fixture',phase,projectId:'fixture-project',recipient:receivingAddress,amount:'0.001',sender:'0x1111111111111111111111111111111111111111',hash:phase==='pending'?'0x'+'ab'.repeat(32):null}));
        if (recoveryMode === 'other-intent') {
          window.__walletFixture.legacyRaw = JSON.stringify({phase:'unknown',projectId:'fixture-project',recipient:receivingAddress,amount:'0.002',sender:'0x1111111111111111111111111111111111111111',hash:null});
          sessionStorage.setItem('buildergame.support.pending.v1:local-wallet-fixture',window.__walletFixture.legacyRaw);
          window.__walletFixture.completeReceipt = true;
        }
      }
      const {mountWalletPanel} = await import('/src/support/wallet-panel.tsx');
      const project = {id:'fixture-project',name:'Local project',repository:'https://github.com/example/project',description:'Fixture only',builder:{name:'Fixture builder'},color:'#397d72',plot:{x:0,z:0}};
      const event = {id:'local-wallet-fixture',name:'Local wallet fixture',collectionType:'personal',projects:[project],support:{version:1,chainId:11155111,recipient:receivingAddress}};
      if (community) {
        event.projects.push({...project,id:'another-project',name:'Another public community project',repository:'https://github.com/example/another'});
        event.collectionType='hackathon';
        event.support={version:1,chainId:11155111,projectRecipients:{'example/project':receivingAddress,'example/another':receivingAddress}};
      }
      window.__walletFixture.panel = mountWalletPanel(document.querySelector('#fixture'), {event,t:(en,zh)=>language==='zh'?zh:en,onConfirmed(){window.__walletFixture.confirmations++;},onLockChange(value){window.__walletFixture.locks.push(value);}}, 'local-ui-test-only');
      document.querySelector('#launcher').onclick = () => window.__walletFixture.panel.open(project);
    }, {receivingAddress:recipient,recoveryMode,language,community});
    await page.locator('#launcher').click(); await page.locator('.support-main-card').waitFor();
    await run(page);
    assert.deepEqual(audit.errors, []); assert.deepEqual(audit.external, []); assert.deepEqual(audit.mutations, []); assert.equal(audit.realSDK, 0);
    assert.equal(await page.evaluate(() => window.__walletFixture.confirmations), 0);
    await page.evaluate(() => window.__walletFixture.panel.dispose());
    console.log(`${name}: passed; real SDK requests 0; external requests 0; no authentication or blockchain transactions.`);
  } finally { await context.close(); }
}

async function fitsWithoutScroll(page, label, selector = '.support-main-card') {
  const layout = await page.locator(selector).evaluate(card => {
    const bounds = card.getBoundingClientRect();
    const actions = [...card.querySelectorAll('button,a,input,select')].filter(node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden');
    return { height:card.clientHeight, contentHeight:card.scrollHeight, width:card.clientWidth, contentWidth:card.scrollWidth,
      withinViewport:bounds.top>=0 && bounds.left>=0 && bounds.bottom<=innerHeight+1 && bounds.right<=innerWidth+1,
      clipped:actions.filter(node=>{const r=node.getBoundingClientRect();return r.top<bounds.top || r.bottom>bounds.bottom+1 || r.left<bounds.left || r.right>bounds.right+1;}).map(node=>node.textContent||node.getAttribute('aria-label')||node.tagName) };
  });
  assert.ok(layout.contentHeight<=layout.height+1, `${label}: card scrolls vertically ${JSON.stringify(layout)}`);
  assert.ok(layout.contentWidth<=layout.width+1, `${label}: card scrolls horizontally ${JSON.stringify(layout)}`);
  assert.equal(layout.withinViewport,true,`${label}: card exceeds viewport`);
  assert.deepEqual(layout.clipped,[],`${label}: actions clipped`);
}

async function detailRoundTrip(page, trigger, label, run) {
  await trigger.click();
  const detail = page.locator('.support-detail-card'); await detail.waitFor();
  assert.equal(await page.locator('.support-main-card').getAttribute('inert'),'');
  assert.equal(await detail.evaluate(node=>node.contains(document.activeElement)),true,`${label}: initial focus enters secondary card`);
  await fitsWithoutScroll(page,label,'.support-detail-card');
  const close = detail.getByRole('button',{name:/Back to support|返回赞赏/});
  await close.focus(); await page.keyboard.press('Shift+Tab');
  assert.equal(await detail.evaluate(node=>node.contains(document.activeElement)),true,`${label}: reverse Tab is trapped`);
  await page.keyboard.press('Tab'); assert.equal(await close.evaluate(node=>node===document.activeElement),true,`${label}: forward Tab wraps`);
  if (run) await run(detail);
  await page.keyboard.press('Escape'); await detail.waitFor({state:'detached'});
  assert.equal(await page.locator('.support-main-card').isVisible(),true,`${label}: Escape only closes secondary card`);
  assert.equal(await page.locator('.support-main-card').getAttribute('inert'),null);
  assert.equal(await trigger.evaluate(node=>node===document.activeElement),true,`${label}: focus restores to trigger`);
}

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_BIN ? { executablePath: process.env.BROWSER_BIN } : { channel: 'chrome' }) });
  try {
    await scenario(browser, 'acknowledgements-and-transfer-lock', false, async page => {
      const card = page.locator('.support-main-card');
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
    await scenario(browser, 'recover-other-intent', false, async page => {
      await page.getByRole('button',{name:'Reconnect to check this transfer'}).click();
      await page.getByRole('button',{name:'Check confirmation'}).click();
      await page.waitForFunction(() => window.__walletFixture.locks.at(-1) === false);
      assert.equal(await page.evaluate(() => sessionStorage.getItem('buildergame.support.pending.v1:local-wallet-fixture') === window.__walletFixture.legacyRaw),true,'A verified transfer from another town must not erase this town’s unrelated legacy record');
      assert.equal(await page.evaluate(() => window.__walletFixture.sendCalls),0);
    });
    for (const language of ['en','zh']) for (const viewport of [{width:1280,height:720},{width:390,height:844}]) {
      const name = `${language}-${viewport.width}x${viewport.height}`;
      await scenario(browser, `compact-${name}`, false, async page => {
        const text = (en,zh)=>language==='zh'?zh:en;
        await fitsWithoutScroll(page,`${name} guest`);
        await detailRoundTrip(page,page.getByRole('button',{name:text('Review full receiving address','核对完整收款地址')}),`${name} recipient`,async detail=>{
          assert.ok((await detail.innerText()).includes(recipient),'An explicit recipient detail reveals the address');
        });
        await detailRoundTrip(page,page.getByRole('button',{name:text('How your wallet works','了解登录与钱包')}),`${name} login`);
        await page.locator('.support-wallet-help input[type=checkbox]').check();
        await page.getByRole('button',{name:text('Continue with email or wallet','使用邮箱或钱包继续')}).click();
        const review = page.getByRole('button',{name:text('Review test transfer','核对测试转账')}); await review.waitFor();
        await fitsWithoutScroll(page,`${name} authenticated`);
        assert.equal((await page.locator('.support-main-card').innerText()).includes(sender),false,'Sending address is masked by default');
        await detailRoundTrip(page,page.getByRole('button',{name:/0x1111.*1111/}),`${name} wallet`);
        await review.click();
        const confirm = page.getByRole('button',{name:/^Confirm .* test ETH$|^确认 .* 测试 ETH$/}); await confirm.waitFor();
        await fitsWithoutScroll(page,`${name} ready`);
        await screenshot(page,`wallet-ready-${name}`);
        await detailRoundTrip(page,page.getByRole('button',{name:text('Read the transfer notice','阅读转账须知')}),`${name} risks`,async detail=>{
          assert.match(await detail.innerText(),/1 \/ 2/);
          await detail.getByRole('button',{name:text('Next','下一页')}).click();
          assert.match(await detail.innerText(),/2 \/ 2/);
          await fitsWithoutScroll(page,`${name} risks page 2`,'.support-detail-card');
          await screenshot(page,`wallet-notice-${name}`);
          assert.equal(await detail.evaluate(node=>node.contains(document.activeElement)),true,`${name} paging keeps focus inside`);
          await page.keyboard.press('Tab');
          assert.equal(await detail.evaluate(node=>node.contains(document.activeElement)),true,`${name} Tab after paging remains in secondary card`);
          await detail.getByRole('button',{name:text('Previous','上一页')}).click();
          assert.match(await detail.innerText(),/1 \/ 2/);
        });
        assert.equal(await confirm.isDisabled(),true,'Reading detail never substitutes for explicit acknowledgement');
        await page.locator('.support-transfer-risk input[type=checkbox]').check(); await confirm.click();
        await page.waitForFunction(()=>window.__walletFixture.sendCalls===1);
        await fitsWithoutScroll(page,`${name} signing`);
        await detailRoundTrip(page,page.getByRole('button',{name:text('Help','查看说明')}),`${name} critical help`);
        assert.equal(await page.getByRole('button',{name:text('Close','关闭'),exact:true}).isDisabled(),true,'Secondary Escape preserves transfer lock');
        await page.evaluate(()=>window.__walletFixture.rejectSend());
        await page.waitForFunction(()=>window.__walletFixture.locks.at(-1)===false);
        await fitsWithoutScroll(page,`${name} rejected`);
        await page.evaluate(()=>{window.__walletFixture.emptyWallet=true;});
        await review.click(); await page.waitForFunction(()=>/Not enough Sepolia ETH|Sepolia ETH 不足/.test(document.querySelector('.support-status[data-kind="error"]')?.textContent||''));
        await fitsWithoutScroll(page,`${name} insufficient funds`);
      },{language,viewport});
      for (const recoveryMode of ['pending','unknown']) await scenario(browser,`compact-${recoveryMode}-${name}`,false,async page=>{
        const text=(en,zh)=>language==='zh'?zh:en;
        await fitsWithoutScroll(page,`${name} ${recoveryMode} guest`);
        await page.getByRole('button',{name:text('Reconnect to check this transfer','重新连接以检查这笔交易')}).click();
        await page.getByRole('button',{name:/0x1111.*1111/}).waitFor();
        await fitsWithoutScroll(page,`${name} ${recoveryMode} connected`);
        if (recoveryMode==='unknown') await screenshot(page,`wallet-recovery-${name}`);
        await detailRoundTrip(page,page.getByRole('button',{name:text('Help','查看说明')}),`${name} ${recoveryMode} help`);
        assert.equal(await page.getByRole('button',{name:text('Close','关闭'),exact:true}).isDisabled(),true);
        assert.equal(await page.evaluate(()=>window.__walletFixture.sendCalls),0);
      },{language,viewport,recoveryMode});
      await scenario(browser,`compact-community-${name}`,true,async page=>{
        const text=(en,zh)=>language==='zh'?zh:en;
        await fitsWithoutScroll(page,`${name} community selector`);
        await detailRoundTrip(page,page.getByRole('button',{name:/0x1111.*1111/}),`${name} multiple wallets`,async detail=>{
          assert.equal(await detail.getByLabel(text('Choose a wallet','选择钱包')).count(),1);
        });
        await page.getByRole('button',{name:text('Review test transfer','核对测试转账')}).click();
        await page.getByRole('button',{name:/^Confirm .* test ETH$|^确认 .* 测试 ETH$/}).waitFor();
        await fitsWithoutScroll(page,`${name} community ready`);
        await page.getByRole('combobox',{name:/^Project|^项目/}).selectOption('another-project');
        assert.equal(await page.locator('.support-transfer-risk input[type=checkbox]').count(),0,'Changing project invalidates the reviewed intent');
      },{language,viewport,community:true});
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
