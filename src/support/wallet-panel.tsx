import { Component, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { PrivyProvider, useCreateWallet, useModalStatus, usePrivy, useSendTransaction, useWallets } from '@privy-io/react-auth';
import { sepolia } from 'viem/chains';
import type { Project } from '../types';
import { recipientForProject } from '../support-config.mjs';
import type { SupportPanel, SupportPanelOptions } from './panel';
import { WalletHelp, TransferRisk } from './wallet-help';
import { canConfirmDonation, classifyError, createBrowserTransferGuard, createDonationFlow, createSupportActionGate, SUPPORT_CHAIN_ID, SUPPORT_EXPLORER, validateAmount } from './transaction.mjs';
import type { DonationCheckpoint, DonationFlow, DonationState, WalletAdapter } from './transaction.mjs';

type Request = { version: number; project?: Project; restoreFocus: HTMLElement | null };
type Props = { options: SupportPanelOptions; request: Request; flow: DonationFlow; retryConnection(): void };
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
    rejected: ['Cancelled before submission. This request sent no transfer and charged no network fee.', '已在提交前取消，本次请求没有发送转账，也不收取网络手续费。'],
    timeout: ['The wallet or network did not respond in time. Close any unfinished wallet prompt before trying this step again.', '钱包或网络响应超时，请先关闭未完成的钱包提示，再重试当前步骤。'],
    network: ['The wallet or network is unavailable. Check your connection.', '钱包或网络暂不可用，请检查连接。'],
    receipt: ['The returned transaction could not be verified. Check it in the explorer; do not send it again.', '暂时无法核验返回的交易，请在区块浏览器查看，不要重复发送。'],
    reverted: ['The transaction failed on chain. The support amount did not arrive; the network may still charge a fee.', '交易在链上执行失败，赞赏金额未到账，网络仍可能收取手续费。'],
    unknown: ['The wallet response was interrupted. This transfer may have been sent. Check your wallet history before doing anything else.', '钱包响应中断，这笔交易可能已发送。请先检查钱包交易记录，避免重复转账。'],
    wallet_wait: ['The wallet has not returned a result. The request may still be open or already sent. Check the wallet; do not start another transfer.', '钱包尚未返回结果，请求可能仍在等待，也可能已发送。请检查钱包，不要重复发起转账。'],
    other_tab: ['Another BuilderGame tab is handling a transfer. Finish checking it there before starting another.', '另一个 BuilderGame 标签页正在处理转账，请先在那里确认结果。'],
    unfinished: ['A previous transfer needs confirmation. Reopen this support panel to recover and check it before sending again.', '上一笔交易尚待确认，请重新打开赞赏面板恢复并检查交易。'],
    storage: ['Transaction recovery storage is unavailable. Sending is disabled until browser storage is available; existing transfers must be checked in the wallet.', '交易恢复存储不可用，暂不开放发送。请恢复浏览器存储；已有交易需在钱包中核对。'],
    browser_guard: ['This browser cannot safely coordinate transfers between tabs. Use a current browser over HTTPS or localhost. Town exploration still works.', '此浏览器无法协调多个标签页的转账，请使用支持此功能的新版浏览器，通过 HTTPS 或 localhost 访问。小镇游览仍可使用。'],
    copy: ['Copy was blocked. Select and copy the displayed address manually.', '复制被浏览器阻止，请手动选中并复制显示的地址。'],
    setup: ['The wallet could not initialize. Check the network and Privy application settings, then reconnect.', '钱包未能初始化，请检查网络与 Privy 应用配置后重新连接。'],
    acknowledgement: ['Read the notice and check the acknowledgement before continuing.', '请阅读说明并勾选已知后继续。'],
  };
  return t(...(copy[code] || copy.network));
}

function WalletPanel({ options, request, flow, retryConnection }: Props) {
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
  const [working, setWorking] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [recipientCopied, setRecipientCopied] = useState(false);
  const [slow, setSlow] = useState(false);
  const [recoveryHash, setRecoveryHash] = useState('');
  const [loginAcknowledged, setLoginAcknowledged] = useState(false);
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);
  const modal = useRef<HTMLElement>(null), alive = useRef(true);
  const operation = useRef(0), [gate] = useState(() => createSupportActionGate());
  const selectedProject = choices.find(p => p.id === (state.intent?.projectId || projectId));
  const selectedRecipient = state.intent?.recipient || (selectedProject && recipientForProject(event, selectedProject));
  const sortedWallets = [...wallets].sort((a, b) => Number(b.walletClientType === 'privy') - Number(a.walletClientType === 'privy'));
  const wallet = sortedWallets.find(w => w.address === walletAddress) || sortedWallets[0];
  const locked = lockedPhase(state) || Boolean(working);
  const active = busyPhase(state) || Boolean(working);
  const canConfirm = canConfirmDonation({ state, walletAddress: wallet?.address, authenticated, ready: ready && walletsReady, acknowledged: riskAcknowledged });
  useEffect(() => { alive.current = true; return () => { alive.current = false; operation.current++; gate.dispose(); }; }, []);
  useEffect(() => {
    setVisible(true); setError(null); setLoginAcknowledged(false);
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
    if (!state.critical) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [state.critical]);
  useEffect(() => {
    if (!visible || privyOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(() => modal.current?.querySelector<HTMLElement>('button:not(:disabled),summary,a[href],input:not(:disabled)')?.focus(), 0);
    return () => { clearTimeout(timer); document.body.style.overflow = previousOverflow; };
  }, [visible, privyOpen, state.critical]);
  useEffect(() => {
    // A wallet change invalidates the previous quote before the next explicit send.
    if (state.phase === 'ready' && (!wallet || wallet.address.toLowerCase() !== state.estimate?.sender.toLowerCase())) flow.reset();
  }, [wallet?.address, state.phase, state.estimate?.sender]);
  useEffect(() => setCopied(false), [wallet?.address]);
  useEffect(() => setRecipientCopied(false), [selectedRecipient]);
  useEffect(() => setRiskAcknowledged(false), [state.intent, wallet?.address, selectedRecipient, amount]);

  function close() {
    if (flow.getSnapshot().critical) return;
    setVisible(false);
    operation.current++; gate.cancel(); setWorking(null); flow.cancelPreparation();
    request.restoreFocus?.isConnected && request.restoreFocus.focus({ preventScroll: true });
  }
  async function runAction(kind: string, task: (context: { isCurrent(): boolean }) => Promise<void>, timeoutMs = 30000) {
    if (gate.busy || !alive.current) return;
    const token = ++operation.current; setWorking(kind); setError(null);
    const result = await gate.run(task, timeoutMs);
    if (!alive.current || token !== operation.current) return;
    setWorking(null);
    if (result.status === 'error') { flow.cancelPreparation(); setError(classifyError(result.error)); }
  }
  function beginLogin() {
    if (gate.busy || authenticated || privyOpen) return;
    if (!flow.getSnapshot().critical && !loginAcknowledged) { setError('acknowledgement'); return; }
    void runAction('login', async () => { login(); });
  }
  function edit(fn: () => void) { if (!locked && flow.reset()) { fn(); setError(null); } }
  async function review() {
    if (gate.busy || !wallet || !selectedProject || !selectedRecipient || lockedPhase(flow.getSnapshot())) return;
    try { validateAmount(amount); } catch (e) { setError(classifyError(e)); return; }
    setRiskAcknowledged(false);
    await runAction('review', async ({ isCurrent }) => {
      // Privy docs: acquire a fresh provider after switching networks.
      await wallet.switchChain(SUPPORT_CHAIN_ID);
      if (!isCurrent()) return;
      const provider = await wallet.getEthereumProvider();
      if (!isCurrent()) return;
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
    });
  }
  async function makeWallet() {
    await runAction('create', async ({ isCurrent }) => { const created = await createWallet(); if (isCurrent()) { setWalletAddress(created.address); flow.reset(); } });
  }
  async function disconnect() {
    if (locked) return;
    await runAction('disconnect', async ({ isCurrent }) => { await logout(); if (isCurrent()) { flow.reset(); setWalletAddress(''); } });
  }
  async function copyAddress() {
    if (!wallet) return;
    try { await navigator.clipboard.writeText(wallet.address); if (alive.current) setCopied(true); }
    catch { if (alive.current) { setCopied(false); setError('copy'); } }
  }
  async function copyRecipient() {
    if (!selectedRecipient) return;
    try { await navigator.clipboard.writeText(selectedRecipient); if (alive.current) setRecipientCopied(true); }
    catch { if (alive.current) setError('copy'); }
  }
  async function recheck() {
    if (gate.busy || !wallet) return;
    await runAction('recheck', async ({ isCurrent }) => {
      await wallet.switchChain(SUPPORT_CHAIN_ID);
      if (!isCurrent()) return;
      const provider = await wallet.getEthereumProvider();
      if (!isCurrent()) return;
      await flow.recheck({ address: wallet.address, request: args => provider.request(args), send: async () => { throw new Error('Receipt-only recovery cannot send transactions'); } });
    }, 120000);
  }
  function recoverHash() {
    const saved = flow.getSnapshot();
    if (!saved.intent || !saved.estimate || !/^0x[0-9a-fA-F]{64}$/.test(recoveryHash.trim())) { setError('receipt'); return; }
    flow.restore({ ...saved.intent, sender: saved.estimate.sender, phase: 'pending', hash: recoveryHash.trim() });
    setError(null);
  }
  function confirmTransfer() {
    if (!canConfirmDonation({ state: flow.getSnapshot(), walletAddress: wallet?.address, authenticated, ready: ready && walletsReady, acknowledged: riskAcknowledged })) {
      setError(riskAcknowledged ? 'account' : 'acknowledgement'); return;
    }
    setError(null); void flow.send();
  }
  function statusText() {
    const localError = error ? message(error, t) + ' ' : '';
    if (state.phase === 'unknown') return localError + message(state.error === 'wallet_wait' ? 'wallet_wait' : 'unknown', t);
    if (state.phase === 'pending') return `${localError}${state.error && state.error !== 'pending' ? t('The receipt could not be verified yet. ', '暂时无法核验回执。') : ''}${t('A transaction hash is saved. Check its status below; do not resend it.', '交易哈希已保留，请检查下方状态，不要重复发送。')}`;
    if (state.phase === 'confirmed') return t(`${state.intent?.amount} test ETH reached the configured wallet. Thanks for supporting this builder!`, `${state.intent?.amount} 测试 ETH 已到达配置的钱包，感谢支持这位开发者！`);
    if (state.phase === 'signing') return t('Review the wallet prompt and confirm or cancel there. The town stays locked until the result is known.', '请在钱包提示中确认或取消，小镇会保持锁定，直到交易结果明确。');
    if (state.phase === 'checking') return t('Submitted. Waiting for a successful Sepolia receipt…', '已提交，正在等待 Sepolia 成功回执…');
    if (working === 'create') return t('Creating your wallet… Close any unfinished wallet prompt before retrying.', '正在创建钱包…重试前请先关闭未完成的钱包提示。');
    if (working === 'login') return t('Opening wallet sign-in…', '正在打开钱包登录…');
    if (working === 'disconnect') return t('Disconnecting the wallet…', '正在断开钱包连接…');
    if (state.phase === 'preparing' || working) return t('Checking the wallet, network, balance and fee…', '正在检查钱包、网络、余额与手续费…');
    if (state.error) return message(state.error, t) + (state.phase === 'error' && state.error !== 'rejected' ? t(' No transfer was submitted; this request charged no network fee.', ' 本次未提交转账，也不收取网络手续费。') : '');
    return error ? message(error, t) : '';
  }
  function keydown(e: React.KeyboardEvent) {
    if (privyOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    if (e.key !== 'Tab') return;
    const nodes = Array.from(modal.current?.querySelectorAll<HTMLElement>('button:not(:disabled),summary,a[href],input:not(:disabled),select:not(:disabled),[tabindex="0"]') || []).filter(n => n.offsetParent !== null);
    const first = nodes[0], last = nodes.at(-1);
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  }
  if (!visible) return null;
  return <div className="support-overlay" onMouseDown={e => { if (e.target === e.currentTarget && !privyOpen) close(); }} onKeyDown={keydown}>
    <section ref={modal} className="support-card paper-panel" role="dialog" aria-modal={!privyOpen} aria-labelledby="support-title">
      <div className="support-heading"><div><span className="support-testnet">Ethereum Sepolia · {t('Testnet', '测试网')}</span><h2 id="support-title">{t('Support a builder', '支持开发者')}</h2></div><button type="button" className="hud-button" data-support-close aria-label={t('Close', '关闭')} disabled={state.critical} onClick={close}>×</button></div>
      {state.critical && <p id="support-transaction-lock" className="support-status" role="status">{t('Transfer in progress · Town controls are locked. Confirm or cancel in your wallet, or check the saved transaction below. Do not refresh or start another transfer.', '转账处理中 · 小镇操作已锁定。请在钱包中确认或取消，或检查下方已保存的交易。请勿刷新或重复转账。')}</p>}
      {choices.length ? <>
        <label>{t('Project', '项目')}<select value={state.intent?.projectId || projectId} disabled={locked || state.phase === 'confirmed'} onChange={e => edit(() => setProjectId(e.target.value))}>{choices.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label>
        <div className="support-project"><strong>{selectedProject?.name || state.intent?.projectId}</strong><span className="support-muted">{selectedProject?.repository}</span><div><small>{t('Receiving address · Set by the town creator', '收款地址 · 由城镇创建者配置')}</small>{selectedRecipient && <details key={selectedRecipient}><summary className="support-address">{shorten(selectedRecipient)} · {t('Review full address', '核对完整地址')}</summary><a className="support-address" href={`${SUPPORT_EXPLORER}/address/${selectedRecipient}`} target="_blank" rel="noopener noreferrer">{selectedRecipient} ↗</a><button type="button" className="hud-button support-copy" onClick={() => void copyRecipient()}>{recipientCopied ? t('Copied', '已复制') : t('Copy receiving address', '复制收款地址')}</button></details>}</div><small>{t('Check that this address belongs to the builder. BuilderGame does not verify ownership.', '请核对地址是否属于该开发者，BuilderGame 不验证地址归属。')}</small></div>
      </> : <p>{t('This town has no projects with a receiving address.', '小镇尚无配置收款地址的项目。')}</p>}
      {!ready || !walletsReady ? <div className="support-actions"><p role="status">{slow ? message('setup', t) : t('Preparing wallet connection…', '正在准备钱包连接…')}</p>{slow && !['preparing', 'signing', 'checking'].includes(state.phase) && <button type="button" className="hud-button" onClick={retryConnection}>{t('Reconnect wallet service', '重新连接钱包服务')}</button>}</div> : !authenticated ? <div className="support-actions"><WalletHelp t={t} acknowledged={loginAcknowledged} onAcknowledgeChange={state.critical ? undefined : setLoginAcknowledged} /><button type="button" className="hud-button" disabled={Boolean(working) || (!state.critical && !loginAcknowledged)} onClick={beginLogin}>{state.critical ? t('Reconnect to check this transfer', '重新连接以检查这笔交易') : t('Continue with email or wallet', '使用邮箱或钱包继续')}</button></div> : <>
        <div className="support-wallet-row"><div><small>{t('Sending wallet', '发送钱包')}</small><strong className="support-address">{wallet ? shorten(wallet.address) : t('No wallet yet', '尚未创建钱包')}</strong></div><button type="button" className="hud-button" disabled={locked} onClick={() => void disconnect()}>{t('Disconnect', '断开连接')}</button></div>
        {sortedWallets.length > 1 && <label>{t('Choose a wallet', '选择钱包')}<select disabled={locked} value={wallet?.address || ''} onChange={e => edit(() => setWalletAddress(e.target.value))}>{sortedWallets.map(w => <option key={w.address} value={w.address}>{w.walletClientType === 'privy' ? 'Privy' : w.meta.name || 'Wallet'} · {shorten(w.address)}</option>)}</select></label>}
        {!sortedWallets.some(w => w.walletClientType === 'privy') && <button type="button" className="hud-button" disabled={locked} onClick={() => void makeWallet()}>{t('Create a Privy wallet', '创建 Privy 钱包')}</button>}
        {wallet && <><details><summary>{t('Wallet address · Receive test ETH', '钱包地址 · 接收测试 ETH')}</summary><code className="support-address">{wallet.address}</code><button type="button" className="hud-button support-copy" onClick={() => void copyAddress()}>{copied ? t('Copied', '已复制') : t('Copy address', '复制地址')}</button><p className="support-muted">{t('Receive Sepolia ETH at this address before sending support. Test ETH has no monetary value.', '赞赏前请先向此地址转入 Sepolia ETH。测试 ETH 没有货币价值。')}</p></details>
          <label>{t('Amount · test ETH', '金额 · 测试 ETH')}<input inputMode="decimal" type="text" autoComplete="off" value={state.intent?.amount || amount} disabled={locked || state.phase === 'confirmed'} onChange={e => edit(() => setAmount(e.target.value))} aria-describedby="support-amount-note" /></label>
          <p id="support-amount-note" className="support-muted">{t('Direct to the configured wallet. No platform fee. The sending wallet pays the network fee.', '直达配置的钱包，不收平台费用，网络手续费由发送钱包支付。')}</p>
          <TransferRisk t={t} acknowledged={riskAcknowledged} onAcknowledgeChange={state.phase === 'ready' ? setRiskAcknowledged : undefined} />
        </>}
      </>}
      {state.estimate && state.estimate.gas > 0n && <div className="support-quote"><div><span>{t('Wallet balance', '钱包余额')}</span><span>{state.estimate.balance} test ETH</span></div><div><span>{t('Estimated network fee', '预计网络手续费')}</span><span>≈ {state.estimate.fee} test ETH</span></div><small>{t('The final network fee is shown in your wallet before confirmation.', '最终网络手续费以钱包确认页显示为准。')}</small></div>}
      {statusText() && <p className="support-status" data-kind={error ? 'error' : state.phase} role="status" aria-live="polite">{statusText()}</p>}
      {state.hash && <a className="support-address" href={`${SUPPORT_EXPLORER}/tx/${state.hash}`} target="_blank" rel="noopener noreferrer">{t('View Sepolia transaction', '查看 Sepolia 交易')} ↗<br />{state.hash}</a>}
      {state.phase === 'unknown' && <div className="support-project"><a href={`${SUPPORT_EXPLORER}/address/${state.estimate?.sender}`} target="_blank" rel="noopener noreferrer">{t('Check the sending wallet history', '检查发送钱包交易记录')} ↗</a><label>{t('Transaction hash from your wallet', '钱包记录中的交易哈希')}<input value={recoveryHash} onChange={e => setRecoveryHash(e.target.value)} placeholder="0x…" autoComplete="off" /></label><button type="button" className="hud-button" onClick={recoverHash}>{t('Find this transaction', '查找这笔交易')}</button></div>}
      <div className="support-actions">
        {authenticated && wallet && choices.length > 0 && ['idle', 'error', 'failed'].includes(state.phase) && <button type="button" className="hud-button" disabled={!ready || !walletsReady || Boolean(working)} onClick={() => void review()}>{t('Review test transfer', '核对测试转账')}</button>}
        {state.phase === 'ready' && <button type="button" className="hud-button" aria-describedby="support-transfer-risk" disabled={!canConfirm} onClick={confirmTransfer}>{t(`Confirm ${state.intent?.amount} test ETH`, `确认 ${state.intent?.amount} 测试 ETH`)}</button>}
        {state.phase === 'pending' && <button type="button" className="hud-button" disabled={!wallet || !ready || Boolean(working)} onClick={() => void recheck()}>{t('Check confirmation', '检查交易确认')}</button>}
        {state.phase === 'confirmed' && <button type="button" className="hud-button" onClick={close}>{t('Back to town', '返回小镇')}</button>}
      </div>
      {(active || state.phase === 'pending' || state.phase === 'unknown') && <p className="support-close-note">{t('The public transaction reference is saved in this browser for recovery across tabs and reloads. A submitted transaction cannot be cancelled by closing the page.', '公开的交易引用会保存在此浏览器中，供跨标签页和刷新后恢复。关闭页面不会取消已提交的交易。')}</p>}
      <p className="support-muted">{t('Testnet demonstration only. Support does not change house growth or give ownership, shares or financial returns.', '仅限测试网演示。赞赏不改变房屋成长，也不授予所有权、股份或财务回报。')}</p>
    </section>
  </div>;
}

type BoundaryProps = { children: ReactNode; t: SupportPanelOptions['t']; request: Request; flow: DonationFlow; retryConnection(): void };
class WalletBoundary extends Component<BoundaryProps, { failed: boolean; dismissed: boolean }> {
  state = { failed: false, dismissed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidUpdate(previous: Readonly<BoundaryProps>) {
    if (this.state.failed && previous.request.version !== this.props.request.version) this.setState({ dismissed: false });
  }
  close = () => {
    if (this.props.flow.getSnapshot().critical) return;
    this.setState({ dismissed: true });
    this.props.request.restoreFocus?.isConnected && this.props.request.restoreFocus.focus({ preventScroll: true });
  };
  render() {
    const state = this.props.flow.getSnapshot();
    if (this.state.failed) return this.state.dismissed ? null : <div className="support-overlay" onMouseDown={e => { if (e.target === e.currentTarget) this.close(); }} onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); this.close(); } if (e.key === 'Tab') { const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')); const first = buttons[0], last = buttons.at(-1); if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); } } }}><section className="support-card paper-panel" role="dialog" aria-modal="true" aria-labelledby="support-error-title"><h2 id="support-error-title">{this.props.t('Wallet unavailable', '钱包暂不可用')}</h2><p>{state.critical ? this.props.t('The wallet interface stopped responding. Your transfer is still unresolved and town controls remain locked. Reconnect to check the saved transaction.', '钱包界面停止响应，交易结果尚未明确，小镇操作保持锁定。请重新连接以检查已保存的交易。') : this.props.t('The wallet could not initialize. You can reconnect this service or return to the town.', '钱包初始化失败，可以重新连接服务，或返回小镇。')}</p><button type="button" autoFocus className="hud-button" disabled={state.phase === 'signing'} onClick={this.props.retryConnection}>{this.props.t('Reconnect wallet service', '重新连接钱包服务')}</button><button type="button" className="hud-button" disabled={state.critical} onClick={this.close}>{this.props.t('Back to town', '返回小镇')}</button></section></div>;
    return this.props.children;
  }
}

export function mountWalletPanel(host: HTMLElement, options: SupportPanelOptions, appId: string): SupportPanel {
  const root = createRoot(host);
  const guard = createBrowserTransferGuard({ eventId: options.event.id });
  let recoveryEvent = options.event.id;
  const flow = createDonationFlow({ guard, onConfirmed(id, result) { if (recoveryEvent === options.event.id) options.onConfirmed(id, result); } });
  const legacyKey = `buildergame.support.pending.v1:${options.event.id}`;
  const restore = () => {
    try {
      const saved = guard.read();
      if (saved) { recoveryEvent = saved.eventId; flow.restore(saved); return; }
      const legacy = sessionStorage.getItem(legacyKey);
      if (legacy) {
        const checkpoint = JSON.parse(legacy) as DonationCheckpoint;
        if (flow.restore(checkpoint)) void guard.migrate(checkpoint).then(() => {
          if (['confirmed', 'failed'].includes(flow.getSnapshot().phase)) guard.save(null);
        }).catch(() => { /* Keep the original record; recovery must not authorize a new send. */ });
      }
    } catch { /* Unknown versions and malformed recovery data are retained; acquire fails closed. */ }
  };
  restore();
  let version = 0, generation = 0, disposed = false, request: Request = { version: 0, restoreFocus: null };
  const unsubscribe = flow.subscribe(() => {
    if (!disposed) {
      const state = flow.getSnapshot();
      if (['confirmed', 'failed'].includes(state.phase)) { try { sessionStorage.removeItem(legacyKey); } catch { /* Keep metadata if storage is blocked. */ } }
      options.onLockChange?.(state.critical); render();
    }
  });
  const retryConnection = () => { if (disposed || flow.getSnapshot().phase === 'signing') return; generation++; render(); };
  function render() {
      root.render(<WalletBoundary key={generation} t={options.t} request={request} flow={flow} retryConnection={retryConnection}><PrivyProvider appId={appId} config={{
        loginMethods: ['email', 'wallet'], defaultChain: sepolia, supportedChains: [sepolia],
        appearance: { theme: '#fff5d5', accentColor: '#397d72', walletChainType: 'ethereum-only', showWalletLoginFirst: false, landingHeader: options.t('Support a builder', '支持开发者') },
        embeddedWallets: { ethereum: { createOnLogin: 'users-without-wallets' }, showWalletUIs: true },
      }}><WalletPanel options={options} request={request} flow={flow} retryConnection={retryConnection} /></PrivyProvider></WalletBoundary>);
  }
  return {
    open(project) {
      if (disposed) return;
      if (['idle', 'unknown', 'error'].includes(flow.getSnapshot().phase)) {
        if (flow.getSnapshot().phase === 'error' && ['unfinished', 'other_tab'].includes(flow.getSnapshot().error || '')) flow.reset();
        restore();
      }
      if (!flow.getSnapshot().critical) recoveryEvent = options.event.id;
      request = { version: ++version, project, restoreFocus: document.activeElement instanceof HTMLElement ? document.activeElement : null };
      options.onLockChange?.(flow.getSnapshot().critical);
      render();
    },
    dispose() { disposed = true; unsubscribe(); flow.dispose(); root.unmount(); options.onLockChange?.(false); },
  };
}
