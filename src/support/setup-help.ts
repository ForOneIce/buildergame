import './setup-help.css';

type Translate = (en: string, zh: string) => string;

/** Optional extension disclosure. Acknowledgment enables configuration, never a wallet action. */
export function bindSupportSetupHelp(settings: HTMLDetailsElement, t: Translate, acknowledged: boolean, onAcknowledged: () => void) {
  const inputs = Array.from(settings.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('#support-recipient, #support-recipients'));
  inputs.forEach(input => input.disabled = !acknowledged);
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'text-button'; button.dataset.supportGuide = '';
  button.textContent = t('Wallet support notice', '钱包赞赏使用须知');
  settings.querySelector('.helper')?.after(button);
  let dialog: HTMLDialogElement | undefined;

  function show() {
    if (!settings.isConnected || dialog?.open) return;
    const restore = document.activeElement instanceof HTMLElement ? document.activeElement : button;
    dialog = document.createElement('dialog');
    dialog.className = 'paper-panel support-setup-guide';
    dialog.setAttribute('aria-labelledby', 'support-guide-title');
    dialog.innerHTML = `<div class="support-guide-heading"><h2 id="support-guide-title">${t('Before enabling wallet support', '启用钱包赞赏前')}</h2><button type="button" class="hud-button icon-button" data-guide-close aria-label="${t('Close', '关闭')}">×</button></div>
      <p class="support-guide-intro">${t('Optional · Ethereum Sepolia test ETH only, with no monetary value. Your town works without this extension.', '可选功能 · 仅限 Ethereum Sepolia 测试 ETH，无货币价值。不启用也能正常使用小镇。')}</p>
      <div class="support-guide-sections">
        <section><h3>${t('Your receiving wallet', '收款钱包')}</h3><p>${t('Use a dedicated project wallet, separate from your everyday wallet. Confirm each builder’s address and keep access secure. Addresses in exported town files and on-chain transfers are public. Never enter a private key or recovery phrase.', '使用项目专用钱包，与日常个人钱包分开。核实各开发者的地址并妥善保管访问权限。导出的小镇文件中的地址和链上交易会公开。切勿填写私钥或助记词。')}</p></section>
        <section><h3>${t('Changing an address', '变更收款地址')}</h3><p>${t('New addresses apply after visitors load updated town data. Older tabs may still use the old address. Sent transfers keep their original destination and cannot be reversed by BuilderGame. Keep access to the old wallet.', '游客加载更新的小镇数据后才会使用新地址，旧标签页可能仍用旧地址。已发送交易的目标不变，BuilderGame 无法撤销。请保留旧钱包的访问权限。')}</p></section>
        <section><h3>${t('Deployment and service updates', '部署与服务更新')}</h3><p>${t('Configure Privy for your site origin; update its allowed origins when changing the domain or port. Check service usage limits and billing. Avoid forced refreshes during transfers and preserve pending-record compatibility when updating the app.', '为站点配置 Privy；更换域名或端口时更新允许来源，并关注服务额度和账单。应用更新时避免在交易中强制刷新页面，并保留对待确认记录的兼容。')}</p></section>
        <section><h3>${t('Interrupted transfers', '交易中断与恢复')}</h3><p>${t('A page error does not cancel a sent transaction. Recovery depends on the same browser and site origin with saved data intact. Check wallet history or the explorer before trying again. Senders pay network fees, including for on-chain failures. Support gives no ownership or financial return.', '页面出错不会取消已发送交易。恢复依赖同一浏览器、同一站点来源及保留的数据。再次操作前先查钱包记录或区块浏览器。网络费由付款方承担，链上失败也可能收费。赞赏不提供所有权或财务回报。')}</p></section>
      </div>
      <a href="https://docs.privy.io/basics/get-started/account" target="_blank" rel="noopener noreferrer">${t('Privy setup documentation ↗', 'Privy 官方配置说明 ↗')}</a>
      <label class="support-notice-ack"><input type="checkbox" data-guide-ack><span>${t('I have read and understand the wallet support notice.', '我已阅读并了解钱包赞赏使用须知。')}</span></label>
      <p class="support-guide-footnote">${t('This acknowledgment only enables configuration. It does not connect a wallet or authorize a transfer.', '此确认仅开放配置，不会连接钱包或授权转账。')}</p>
      <div class="paired-actions"><button type="button" class="hud-button" data-guide-cancel>${t('Back to planning', '返回规划')}</button><button type="button" class="hud-button" data-guide-continue disabled>${t('Continue configuration', '继续配置')}</button></div>`;
    settings.closest('#app')!.append(dialog);
    const current = dialog;
    const checkbox = current.querySelector<HTMLInputElement>('[data-guide-ack]')!;
    const proceed = current.querySelector<HTMLButtonElement>('[data-guide-continue]')!;
    checkbox.onchange = () => { proceed.disabled = !checkbox.checked; };
    proceed.onclick = () => {
      if (!checkbox.checked) return;
      acknowledged = true;
      inputs.forEach(input => input.disabled = false);
      onAcknowledged();
      current.close('acknowledged');
    };
    current.querySelector<HTMLButtonElement>('[data-guide-close]')!.onclick = () => current.close();
    current.querySelector<HTMLButtonElement>('[data-guide-cancel]')!.onclick = () => current.close();
    current.addEventListener('close', () => {
      current.remove();
      if (!acknowledged) settings.open = false;
      if (current.returnValue === 'acknowledged') inputs[0]?.focus({ preventScroll: true });
      else if (restore.isConnected) restore.focus({ preventScroll: true });
    }, { once: true });
    current.showModal();
  }
  button.onclick = show;
  settings.addEventListener('toggle', () => { if (settings.open && !acknowledged) show(); });
  if (settings.open && !acknowledged) queueMicrotask(show);
}
