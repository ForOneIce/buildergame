import type { SupportPanelOptions } from './panel';

type NoticeProps = { t: SupportPanelOptions['t']; acknowledged?: boolean; onAcknowledgeChange?: (value: boolean) => void };

/** Explain the login choice without starting authentication or exposing wallet keys. */
export function WalletHelp({ t, acknowledged = false, onAcknowledgeChange }: NoticeProps) {
  return <div className="support-wallet-help">
    <p className="support-muted">{t('Sign in with email to create or reopen your app wallet, or connect an existing wallet. Signing in does not send funds.', '用邮箱登录可创建或重新访问应用钱包，也可连接已有钱包。登录不会转账。')}</p>
    <details>
      <summary>{t('About your wallet', '了解你的钱包')}</summary>
      <div className="support-help-copy">
        <p>{t('Email verifies your identity; it is not your private key. Privy manages wallet creation and recovery. A new app wallet is separate from your MetaMask wallet and balance. Protect your email account.', '邮箱验证身份，并不是私钥。Privy 处理钱包创建和恢复。新应用钱包与原有 MetaMask 钱包及余额独立。请保护好邮箱账户。')}</p>
        <p>{t('Privy supports exporting your wallet for use in MetaMask. This demo has no export button yet; see the official management guide.', 'Privy 支持导出钱包后在 MetaMask 中使用。本演示版尚未提供导出按钮；管理方法请查看官方指南。')}</p>
        <a href="https://docs.privy.io/wallets/wallets/export" target="_blank" rel="noopener noreferrer">{t('Privy: manage and export your wallet ↗', 'Privy 官方钱包管理与导出说明 ↗')}</a>
      </div>
    </details>
    <p className="support-muted">{t('If connection fails, check your connection before signing in again. Keep the same login to reopen your wallet; email login does not restore an unrelated MetaMask wallet.', '连接失败时请先检查网络。再次访问钱包请使用相同登录方式；邮箱登录不会恢复其它 MetaMask 钱包。')}</p>
    {onAcknowledgeChange && <label className="support-notice-ack"><input type="checkbox" checked={acknowledged} onChange={event => onAcknowledgeChange(event.target.checked)} /><span>{t('I have read and understand how login and my wallet work.', '我已阅读并了解登录与钱包的关系。')}</span></label>}
  </div>;
}

/** Keep risks visible at the decision point, without starting a wallet action. */
export function TransferRisk({ t, acknowledged = false, onAcknowledgeChange }: NoticeProps) {
  return <div className="support-transfer-risk"><p id="support-transfer-risk">{t('Sepolia test ETH only · no monetary value. Verify the recipient and amount. Failed on-chain transfers may still cost network fees; completed transfers cannot be reversed. A refresh, disconnect or site update does not cancel a sent transaction. If pending, check wallet history or the explorer; do not resend.', '仅 Sepolia 测试 ETH，无货币价值。请核对收款人和金额。链上失败仍可能收取网络费；成功转账无法撤销。刷新、断网或站点更新不会取消已发送交易。待确认时请查询钱包记录或区块浏览器，不要重复发送。')}</p>{onAcknowledgeChange && <label className="support-notice-ack"><input type="checkbox" checked={acknowledged} onChange={event => onAcknowledgeChange(event.target.checked)} /><span>{t('I understand the risks of this transfer.', '我已了解本次转账风险。')}</span></label>}</div>;
}
