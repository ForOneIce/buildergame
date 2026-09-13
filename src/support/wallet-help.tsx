import type { SupportPanelOptions } from './panel';

type NoticeProps = { t: SupportPanelOptions['t']; acknowledged?: boolean; onAcknowledgeChange?: (value: boolean) => void; onDetails?: () => void };

/** Explain the login choice without starting authentication or exposing wallet keys. */
export function WalletHelp({ t, acknowledged = false, onAcknowledgeChange, onDetails }: NoticeProps) {
  return <div className="support-wallet-help">
    <p className="support-muted">{t('Email opens your app wallet. You can also use an existing wallet. Signing in does not send funds.', '邮箱登录可访问应用钱包，也可使用已有钱包。登录不会转账。')}</p>
    {onDetails && <button type="button" className="support-text-action" onClick={onDetails}>{t('How your wallet works', '了解登录与钱包')}</button>}
    {onAcknowledgeChange && <label className="support-notice-ack"><input type="checkbox" checked={acknowledged} onChange={event => onAcknowledgeChange(event.target.checked)} /><span>{t('I have read and understand how login and my wallet work.', '我已阅读并了解登录与钱包的关系。')}</span></label>}
  </div>;
}

/** Keep risks visible at the decision point, without starting a wallet action. */
export function TransferRisk({ t, acknowledged = false, onAcknowledgeChange, onDetails }: NoticeProps) {
  return <div className="support-transfer-risk"><p id="support-transfer-risk">{t('Transfers cannot be reversed. Network fees may apply, even if a transfer fails.', '转账无法撤销；链上失败也可能收取网络费。')}</p>{onDetails && <button type="button" className="support-text-action" onClick={onDetails}>{t('Read the transfer notice', '阅读转账须知')}</button>}{onAcknowledgeChange && <label className="support-notice-ack"><input type="checkbox" checked={acknowledged} onChange={event => onAcknowledgeChange(event.target.checked)} /><span>{t('I understand the risks of this transfer.', '我已了解本次转账风险。')}</span></label>}</div>;
}
