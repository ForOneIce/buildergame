import { Component, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { PrivyProvider, useCreateWallet, useModalStatus, usePrivy, useSendTransaction, useWallets } from '@privy-io/react-auth';
import { sepolia } from 'viem/chains';
import type { Project } from '../types';
import { recipientForProject } from '../support-config.mjs';
import type { SupportPanel, SupportPanelOptions } from './panel';
import { classifyError, createDonationFlow, SUPPORT_CHAIN_ID, SUPPORT_EXPLORER, validateAmount } from './transaction.mjs';
import type { DonationCheckpoint, DonationFlow, DonationState, WalletAdapter } from './transaction.mjs';

type Request = { version: number; project?: Project; restoreFocus: HTMLElement | null };
type Props = { options: SupportPanelOptions; request: Request; flow: DonationFlow };
const shorten = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;
const busyPhase = (state: DonationState) => ['preparing', 'signing', 'checking'].includes(state.phase);
const lockedPhase = (state: DonationState) => busyPhase(state) || ['pending', 'unknown'].includes(state.phase);

function message(code: string, t: SupportPanelOptions['t']) {
  const copy: Record<string, [string, string]> = {
    amount: ['Enter more than 0 and at most 1 test ETH, with up to 18 decimals.', '请输入大于 0、不超过 1 的测试 ETH，最多 18 位小数。'],
    recipient: ['This project has no valid receiving address.', '项目未配置有效收款地址。'],
    account: ['The connected account changed. Select a wallet and review again.', '连接账号已更改，请选择钱包后重新核对。'],
    chain: ['Use Ethereum Sepolia. The network switch was not completed.', '请使用 Ethereum Sepolia，当前尚未完成网络切换。'],
    self: ['Select a wallet different from the receiving address.', '请使用与收款地址不同的钱包。'],
    funds: ['Not enough Sepolia ETH for the amount and network fee. Add test ETH to the sending wallet, then review again.', '发送钱包的 Sepolia ETH 不足以支付金额与网络费用，请补充测试币后重新核对。'],
    rejected: ['Cancelled in the wallet. No new transfer was submitted by this request.', '已在钱包中取消，本次请求未提交新的转账。'],
    timeout: ['The network did not respond in time. You can try reviewing again.', '网络响应超时，可以重新核对交易。'],
    network: ['The wallet or network is unavailable. Check your connection and try reviewing again.', '钱包或网络暂不可用，请检查连接后重新核对。'],
    receipt: ['The returned transaction could not be verified. Check it in the explorer; do not send it again.', '暂时无法核验返回的交易，请在区块浏览器查看，不要重复发送。'],
    reverted: ['The transaction failed on chain. The support amount did not arrive; the network may still charge a fee.', '交易在链上执行失败，赞赏金额未到账，网络仍可能收取手续费。'],
    unknown: ['The wallet response was interrupted. This transfer may have been sent. Check your wallet history before doing anything else.', '钱包响应中断，这笔交易可能已发送。请先检查钱包交易记录，避免重复转账。'],
  };
  return t(...(copy[code] || copy.network));
}

function WalletPanel({ options, request, flow }: Props) {
  const { t, event } = options;
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { createWallet } = useCreateWallet();
  const { sendTransaction } = useSendTransaction();
  const { isOpen: privyOpen } = useModalStatus();
  const state = useSyncExternalStore(flow.subscribe, flow.getSnapshot, flow.getSnapshot);
  const choices = event.projects.filter(project => recipientForProject(event, project));
  const [visible, setVisible] = useState(true);
  const [projectId, setProjectId] = useState(request.project?.id || choices[0]?.id || '');
  const [amount, setAmount] = useState('0.001');
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [slow, setSlow] = useState(false);
  const [recoveryHash, setRecoveryHash] = useState('');
  const modal = useRef<HTMLElement>(null), alive = useRef(true), action = useRef(false);
  const operation = useRef(0);
  const selectedProject = choices.find(p => p.id === (state.intent?.projectId || projectId));
  const selectedRecipient = state.intent?.recipient || (selectedProject && recipientForProject(event, selectedProject));
  const sortedWallets = [...wallets].sort((a, b) => Number(b.walletClientType === 'privy') - Number(a.walletClientType === 'privy'));
  const wallet = sortedWallets.find(w => w.address === walletAddress) || sortedWallets[0];
  const locked = lockedPhase(state) || working;
  const active = busyPhase(state) || working;
  const transferStarted = ['signing', 'checking', 'pending', 'unknown'].includes(state.phase);

  useEffect(() => () => { alive.current = false; operation.current++; }, []);
  useEffect(() => {
    setVisible(true); setError(null);
    if (!lockedPhase(flow.getSnapshot()) && flow.reset()) {
      setProjectId(request.project?.id || choices[0]?.id || '');
    }
  }, [request.version]);
  useEffect(() => {
    if (ready && walletsReady) { setSlow(false); return; }
    const timer = setTimeout(() => setSlow(true), 15000);
    return () => clearTimeout(timer);
  }, [ready, walletsReady]);
  useEffect(() => {
    if (!visible || privyOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(() => modal.current?.querySelector<HTMLButtonElement>('[data-support-close]')?.focus(), 0);
    return () => { clearTimeout(timer); document.body.style.overflow = previousOverflow; };
  }, [visible, privyOpen]);
  useEffect(() => {
    // A wallet change invalidates the previous quote before the next explicit send.
    if (state.phase === 'ready' && (!wallet || wallet.address.toLowerCase() !== state.estimate?.sender.toLowerCase())) flow.reset();
  }, [wallet?.address, state.phase, state.estimate?.sender]);

  function close() {
    setVisible(false);
    // Cancels only a pre-send review. Submitted transactions continue receipt checks.
    if (!transferStarted && working) operation.current++;
    request.restoreFocus?.isConnected && request.restoreFocus.focus({ preventScroll: true });
  }
  function edit(fn: () => void) { if (!locked && flow.reset()) { fn(); setError(null); } }
  async function review() {
    if (action.current || !wallet || !selectedProject || !selectedRecipient || lockedPhase(flow.getSnapshot())) return;
    try { validateAmount(amount); } catch (e) { setError(classifyError(e)); return; }
    action.current = true; setWorking(true); setError(null);
    const token = ++operation.current;
    try {
      // Privy docs: acquire a fresh provider after switching networks.
      await wallet.switchChain(SUPPORT_CHAIN_ID);
      if (!alive.current || token !== operation.current) return;
      const provider = await wallet.getEthereumProvider();
      if (!alive.current || token !== operation.current) return;
      const sender = wallet.address, embedded = wallet.walletClientType === 'privy';
      const adapter: WalletAdapter = {
        address: sender,
        request: args => provider.request(args),
        send: transaction => embedded
          ? sendTransaction(transaction, {
              address: sender, sponsor: false,
              uiOptions: {
                showWalletUIs: true, isCancellable: true,
                description: t(`Support ${selectedProject.name} · Sepolia test ETH`, `支持 ${selectedProject.name} · Sepolia 测试 ETH`),
                buttonText: t('Confirm test transfer', '确认测试转账'),
                successHeader: t('Transaction submitted', '交易已提交'),
                successDescription: t('Return to BuilderGame to verify the on-chain receipt.', '返回 BuilderGame 核验链上回执。'),
              },
            })
          : provider.request({ method: 'eth_sendTransaction', params: [{ from: sender, to: transaction.to, value: `0x${transaction.value.toString(16)}`, chainId: `0x${transaction.chainId.toString(16)}` }] }) as Promise<string>,
      };
      await flow.prepare({ projectId: selectedProject.id, recipient: selectedRecipient, amount }, adapter);
    } catch (e) { if (alive.current && token === operation.current) setError(classifyError(e)); }
    finally { action.current = false; if (alive.current) setWorking(false); }
  }
  async function makeWallet() {
    if (action.current) return;
    action.current = true; setWorking(true); setError(null);
    try { const created = await createWallet(); if (alive.current) { setWalletAddress(created.address); flow.reset(); } }
    catch (e) { if (alive.current) setError(classifyError(e)); }
    finally { action.current = false; if (alive.current) setWorking(false); }
  }
  async function disconnect() {
    if (locked || action.current) return;
    action.current = true; setWorking(true);
    try { await logout(); if (alive.current) { flow.reset(); setWalletAddress(''); } }
    catch (e) { if (alive.current) setError(classifyError(e)); }
    finally { action.current = false; if (alive.current) setWorking(false); }
  }
  async function copyAddress() {
    if (!wallet) return;
    try { await navigator.clipboard.writeText(wallet.address); if (alive.current) setCopied(true); }
    catch { if (alive.current) setCopied(false); }
  }
  async function recheck() {
    if (action.current || !wallet) return;
    action.current = true; setWorking(true); setError(null);
    try {
      await wallet.switchChain(SUPPORT_CHAIN_ID);
      if (!alive.current) return;
      const provider = await wallet.getEthereumProvider();
      if (!alive.current) return;
      await flow.recheck({ address: wallet.address, request: args => provider.request(args), send: async () => { throw new Error('Receipt-only recovery cannot send transactions'); } });
    } catch (e) { if (alive.current) setError(classifyError(e)); }
    finally { action.current = false; if (alive.current) setWorking(false); }
  }
  function recoverHash() {
    const saved = flow.getSnapshot();
    if (!saved.intent || !saved.estimate || !/^0x[0-9a-fA-F]{64}$/.test(recoveryHash.trim())) { setError('receipt'); return; }
    flow.restore({ ...saved.intent, sender: saved.estimate.sender, phase: 'pending', hash: recoveryHash.trim() });
    setError(null);
  }
  function statusText() {
    if (state.phase === 'unknown') return message('unknown', t);
    if (state.phase === 'pending') return `${state.error && state.error !== 'pending' ? message(state.error, t) + ' ' : ''}${t('A transaction hash is saved. Check its status below; do not resend it.', '交易哈希已保留，请检查下方状态，不要重复发送。')}`;
    if (state.phase === 'confirmed') return t(`${state.intent?.amount} test ETH reached the configured wallet. Thanks for supporting this builder!`, `${state.intent?.amount} 测试 ETH 已到达配置的钱包，感谢支持这位开发者！`);
    if (state.phase === 'signing') return t('Review the wallet prompt and confirm there. Closing this card does not cancel a wallet request.', '请在钱包窗口核对并确认。关闭此卡片不会取消已打开的钱包请求。');
    if (state.phase === 'checking') return t('Submitted. Waiting for a successful Sepolia receipt…', '已提交，正在等待 Sepolia 成功回执…');
    if (state.phase === 'preparing' || working) return t('Checking the wallet, network, balance and fee…', '正在检查钱包、网络、余额与手续费…');
    if (state.error) return message(state.error, t);
    return error ? message(error, t) : '';
  }
  function keydown(e: React.KeyboardEvent) {
    if (privyOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    if (e.key !== 'Tab') return;
    const nodes = Array.from(modal.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),[tabindex="0"]') || []).filter(n => n.offsetParent !== null);
    const first = nodes[0], last = nodes.at(-1);
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  }
  if (!visible) return null;
  return <div className="support-overlay" onMouseDown={e => { if (e.target === e.currentTarget && !privyOpen) close(); }} onKeyDown={keydown}>
    <section ref={modal} className="support-card paper-panel" role="dialog" aria-modal={!privyOpen} aria-labelledby="support-title">
      <div className="support-heading"><div><span className="support-testnet">Ethereum Sepolia · {t('Testnet', '测试网')}</span><h2 id="support-title">{t('Support a builder', '支持开发者')}</h2></div><button type="button" className="hud-button" data-support-close aria-label={t('Close', '关闭')} onClick={close}>×</button></div>
      {choices.length ? <>
        <label>{t('Project', '项目')}<select value={state.intent?.projectId || projectId} disabled={locked || state.phase === 'confirmed'} onChange={e => edit(() => setProjectId(e.target.value))}>{choices.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label>
        <div className="support-project"><strong>{selectedProject?.name}</strong><span className="support-muted">{selectedProject?.repository}</span><div><small>{t('Receiving address · Set by the town creator', '收款地址 · 由城镇创建者配置')}</small><a className="support-address" href={`${SUPPORT_EXPLORER}/address/${selectedRecipient}`} target="_blank" rel="noopener noreferrer">{selectedRecipient}</a></div><small>{t('Check that this address belongs to the builder. BuilderGame does not verify ownership.', '请核对地址是否属于该开发者，BuilderGame 不验证地址归属。')}</small></div>
      </> : <p>{t('This town has no projects with a receiving address.', '小镇尚无配置收款地址的项目。')}</p>}
      {!ready || !walletsReady ? <p role="status">{slow ? t('Wallet connection is taking longer than usual. Check your connection or ask the town owner to verify the Privy setup.', '钱包连接时间较长，请检查网络，或联系城镇部署者核对 Privy 配置。') : t('Preparing wallet connection…', '正在准备钱包连接…')}</p> : !authenticated ? <div className="support-actions"><button type="button" className="hud-button" onClick={() => { setError(null); login(); }}>{t('Continue with email or wallet', '使用邮箱或钱包继续')}</button><p className="support-muted">{t('Email sign-in can create a Privy wallet. You will still need Sepolia test ETH for the amount and network fee.', '邮箱登录可创建 Privy 钱包；发送金额与手续费仍需要 Sepolia 测试 ETH。')}</p></div> : <>
        <div className="support-wallet-row"><div><small>{t('Sending wallet', '发送钱包')}</small><strong className="support-address">{wallet ? shorten(wallet.address) : t('No wallet yet', '尚未创建钱包')}</strong></div><button type="button" className="hud-button" disabled={locked} onClick={() => void disconnect()}>{t('Disconnect', '断开连接')}</button></div>
        {sortedWallets.length > 1 && <label>{t('Choose a wallet', '选择钱包')}<select disabled={locked} value={wallet?.address || ''} onChange={e => edit(() => setWalletAddress(e.target.value))}>{sortedWallets.map(w => <option key={w.address} value={w.address}>{w.walletClientType === 'privy' ? 'Privy' : w.meta.name || 'Wallet'} · {shorten(w.address)}</option>)}</select></label>}
        {!sortedWallets.some(w => w.walletClientType === 'privy') && <button type="button" className="hud-button" disabled={locked} onClick={() => void makeWallet()}>{t('Create a Privy wallet', '创建 Privy 钱包')}</button>}
        {wallet && <><details><summary>{t('Wallet address · Receive test ETH', '钱包地址 · 接收测试 ETH')}</summary><code className="support-address">{wallet.address}</code><button type="button" className="hud-button support-copy" onClick={() => void copyAddress()}>{copied ? t('Copied', '已复制') : t('Copy address', '复制地址')}</button><p className="support-muted">{t('Receive Sepolia ETH at this address before sending support. Test ETH has no monetary value.', '赞赏前请先向此地址转入 Sepolia ETH。测试 ETH 没有货币价值。')}</p></details>
          <label>{t('Amount · test ETH', '金额 · 测试 ETH')}<input inputMode="decimal" type="text" autoComplete="off" value={state.intent?.amount || amount} disabled={locked || state.phase === 'confirmed'} onChange={e => edit(() => setAmount(e.target.value))} aria-describedby="support-amount-note" /></label>
          <p id="support-amount-note" className="support-muted">{t('Direct to the configured wallet. No platform fee. The sending wallet pays the network fee.', '直达配置的钱包，不收平台费用，网络手续费由发送钱包支付。')}</p>
        </>}
      </>}
      {state.estimate && state.estimate.gas > 0n && <div className="support-quote"><div><span>{t('Wallet balance', '钱包余额')}</span><span>{state.estimate.balance} test ETH</span></div><div><span>{t('Estimated network fee', '预计网络手续费')}</span><span>≈ {state.estimate.fee} test ETH</span></div><small>{t('The final network fee is shown in your wallet before confirmation.', '最终网络手续费以钱包确认页显示为准。')}</small></div>}
      {statusText() && <p className="support-status" data-kind={error ? 'error' : state.phase} role="status" aria-live="polite">{statusText()}</p>}
      {state.hash && <a className="support-address" href={`${SUPPORT_EXPLORER}/tx/${state.hash}`} target="_blank" rel="noopener noreferrer">{t('View Sepolia transaction', '查看 Sepolia 交易')} ↗<br />{state.hash}</a>}
      {state.phase === 'unknown' && <div className="support-project"><a href={`${SUPPORT_EXPLORER}/address/${state.estimate?.sender}`} target="_blank" rel="noopener noreferrer">{t('Check the sending wallet history', '检查发送钱包交易记录')} ↗</a><label>{t('Transaction hash from your wallet', '钱包记录中的交易哈希')}<input value={recoveryHash} onChange={e => setRecoveryHash(e.target.value)} placeholder="0x…" autoComplete="off" /></label><button type="button" className="hud-button" onClick={recoverHash}>{t('Find this transaction', '查找这笔交易')}</button></div>}
      <div className="support-actions">
        {authenticated && wallet && choices.length > 0 && ['idle', 'error', 'failed'].includes(state.phase) && <button type="button" className="hud-button" disabled={!ready || !walletsReady || working} onClick={() => void review()}>{t('Review test transfer', '核对测试转账')}</button>}
        {state.phase === 'ready' && <button type="button" className="hud-button" onClick={() => void flow.send()}>{t(`Confirm ${state.intent?.amount} test ETH`, `确认 ${state.intent?.amount} 测试 ETH`)}</button>}
        {state.phase === 'pending' && <button type="button" className="hud-button" disabled={!wallet || !ready || working} onClick={() => void recheck()}>{t('Check confirmation', '检查交易确认')}</button>}
        {state.phase === 'confirmed' && <button type="button" className="hud-button" onClick={close}>{t('Back to town', '返回小镇')}</button>}
      </div>
      {(active || state.phase === 'pending' || state.phase === 'unknown') && <p className="support-close-note">{t('A submitted transfer continues even if you close this card. Its public recovery details stay in this browser tab when storage is available; reconnect to check after returning.', '关闭卡片后已提交交易仍会继续。浏览器存储可用时，此标签页会保留公开的交易恢复信息，返回后可连接钱包检查。')}</p>}
      <p className="support-muted">{t('Testnet demonstration only. Support does not change house growth or give ownership, shares or financial returns.', '仅限测试网演示。赞赏不改变房屋成长，也不授予所有权、股份或财务回报。')}</p>
    </section>
  </div>;
}

class WalletBoundary extends Component<{ children: ReactNode; t: SupportPanelOptions['t']; request: Request }, { failed: boolean; dismissed: boolean }> {
  state = { failed: false, dismissed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidUpdate(previous: Readonly<{ children: ReactNode; t: SupportPanelOptions['t']; request: Request }>) {
    if (this.state.failed && previous.request.version !== this.props.request.version) this.setState({ dismissed: false });
  }
  close = () => {
    this.setState({ dismissed: true });
    this.props.request.restoreFocus?.isConnected && this.props.request.restoreFocus.focus({ preventScroll: true });
  };
  render() {
    if (this.state.failed) return this.state.dismissed ? null : <div className="support-overlay" onMouseDown={e => { if (e.target === e.currentTarget) this.close(); }} onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); this.close(); } if (e.key === 'Tab') e.preventDefault(); }}><section className="support-card paper-panel" role="dialog" aria-modal="true" aria-labelledby="support-error-title"><h2 id="support-error-title">{this.props.t('Wallet unavailable', '钱包暂不可用')}</h2><p>{this.props.t('The wallet could not initialize. The town remains available; reload before trying the wallet again.', '钱包初始化失败，小镇仍可正常使用。请重新加载后再尝试钱包功能。')}</p><button type="button" autoFocus className="hud-button" onClick={this.close}>{this.props.t('Back to town', '返回小镇')}</button></section></div>;
    return this.props.children;
  }
}

export function mountWalletPanel(host: HTMLElement, options: SupportPanelOptions, appId: string): SupportPanel {
  const root = createRoot(host);
  const storageKey = `buildergame.support.pending.v1:${options.event.id}`;
  const flow = createDonationFlow({ onConfirmed: options.onConfirmed, persist(checkpoint) {
    try { if (checkpoint) sessionStorage.setItem(storageKey, JSON.stringify(checkpoint)); else sessionStorage.removeItem(storageKey); } catch { /* Storage is optional. */ }
  } });
  const restore = () => { try { const saved = sessionStorage.getItem(storageKey); if (saved) flow.restore(JSON.parse(saved) as DonationCheckpoint); } catch { /* Invalid or unavailable storage cannot send anything. */ } };
  restore();
  let version = 0, disposed = false;
  return {
    open(project) {
      if (disposed) return;
      if (['idle', 'unknown'].includes(flow.getSnapshot().phase)) restore();
      const request = { version: ++version, project, restoreFocus: document.activeElement instanceof HTMLElement ? document.activeElement : null };
      root.render(<WalletBoundary t={options.t} request={request}><PrivyProvider appId={appId} config={{
        loginMethods: ['email', 'wallet'], defaultChain: sepolia, supportedChains: [sepolia],
        appearance: { theme: '#fff5d5', accentColor: '#397d72', walletChainType: 'ethereum-only', showWalletLoginFirst: false, landingHeader: options.t('Support a builder', '支持开发者') },
        embeddedWallets: { ethereum: { createOnLogin: 'users-without-wallets' }, showWalletUIs: true },
      }}><WalletPanel options={options} request={request} flow={flow} /></PrivyProvider></WalletBoundary>);
    },
    dispose() { disposed = true; flow.dispose(); root.unmount(); },
  };
}
