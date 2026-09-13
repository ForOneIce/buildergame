import type { Project, Snapshot } from './types';
import type { createTown } from './town';
import { appearance } from './town-assets';
import { html } from './game-ui';
import { icon } from './ui/icons';

type Options = {
  host: HTMLElement;
  projects: Project[];
  snapshot: () => Snapshot;
  scene: () => ReturnType<typeof createTown> | undefined;
  stopHistory: () => void;
  t: (en: string, zh: string) => string;
};

/** Sample-only play money stays in this mounted view. 演示金币只保留在当前视图。 */
export function mountMailboxUI({ host, projects, snapshot, scene, stopHistory, t }: Options) {
  const layer = document.createElement('div');
  layer.className = 'mailbox-ui';
  layer.innerHTML = `<dialog id="investment-dialog" class="paper-panel" aria-labelledby="investment-title" aria-describedby="investment-note">
    <div class="panel-title"><h2 id="investment-title">${t('Support builders', '投资建设')}</h2><button type="button" id="close-investment" class="hud-button icon-button" aria-label="${t('Close', '关闭')}">${icon('x')}</button></div>
    <div class="demo-wallet-card"><span class="demo-wallet-art" aria-hidden="true">${icon('wallet')}<i>${icon('coin')}</i></span><div><span class="demo-tag">${t('PLAY DEMO', '虚拟演示')}</span><strong>${t('Wallet not connected', '钱包未连接')}</strong><button type="button" id="connect-demo-wallet" class="hud-button" disabled>${t('Connect wallet · Coming later', '连接钱包 · 稍后开放')}</button></div></div>
    <p id="investment-note">${t('Drop a coin into a garden-house mailbox and watch it arrive. Demo coins have no monetary value; no wallet or transaction is involved.', '向花园屋的邮箱投一枚金币，看看入账效果。演示金币没有货币价值，无需钱包，不产生交易。')}</p>
    <details class="support-ideas"><summary>${t('Future ways to support a town', '未来可以怎样赞助小镇')}</summary><ul><li>${t('Support a project through its own mailbox.', '通过邮箱，赞助你喜欢的项目。')}</li><li>${t('A personal town could use one builder’s wallet.', '个人小镇可以共用一个开发者钱包。')}</li><li>${t('A community could set up a shared maintenance fund.', '社区可以设置共同维护基金。')}</li></ul><p>${t('Ideas for a future version. No payments, ownership or financial returns are offered here.', '以上为后续版本构想；当前不提供支付、所有权或投资回报。')}</p></details>
    <label class="mailbox-picker" for="mailbox-project">${t('Choose a garden-house mailbox', '选择花园屋的邮箱')}<select id="mailbox-project"></select></label>
    <p id="mailbox-status" class="mailbox-status" role="status"></p>
    <div class="paired-actions mailbox-actions"><button type="button" id="find-mailbox" class="hud-button">${icon('compass')}${t('Find mailbox', '找到邮箱')}</button><button type="button" id="try-demo-coin" class="hud-button">${icon('coin')}${t('Try a demo coin', '试投金币')}</button></div>
  </dialog>
  <section id="demo-wallet-receipt" class="hud-glass" role="status" aria-live="polite" aria-atomic="true" hidden><span class="receipt-art" aria-hidden="true">${icon('wallet')}<b>+1</b></span><div><small>${t('Demo wallet · Coin received', '演示钱包 · 金币已入账')}</small><strong id="demo-wallet-project"></strong><span id="demo-wallet-balance"></span></div></section>`;
  host.append(layer);
  const get = <T extends HTMLElement>(selector: string) => layer.querySelector<T>(selector)!;
  const dialog = get<HTMLDialogElement>('#investment-dialog');
  const picker = get<HTMLSelectElement>('#mailbox-project');
  const find = get<HTMLButtonElement>('#find-mailbox'), toss = get<HTMLButtonElement>('#try-demo-coin');
  const receipt = get('#demo-wallet-receipt'), status = get('#mailbox-status');
  const button = host.querySelector<HTMLButtonElement>('#sample-invest')!;
  const counts = new Map<string, number>();
  let disposed = false, hideTimer: ReturnType<typeof setTimeout> | undefined;
  let snapshotId = snapshot().id;
  let focusSceneOnClose = false;
  const eligible = () => projects.filter(p => snapshot().projects.some(r => r.projectId === p.id && appearance(r.stage) === 5));

  function hideReceipt() { clearTimeout(hideTimer); receipt.hidden = true; receipt.classList.remove('coin-arrived'); }
  function refresh() {
    hideReceipt();
    if (snapshotId !== snapshot().id) { counts.clear(); snapshotId = snapshot().id; }
    const selected = picker.value, choices = eligible();
    picker.innerHTML = choices.map(p => `<option value="${html(p.id)}">${html(p.name)}</option>`).join('');
    if (choices.some(p => p.id === selected)) picker.value = selected;
    picker.disabled = find.disabled = toss.disabled = choices.length === 0 || !scene();
    status.textContent = !scene() ? t('The 3D scene is unavailable. Reload to try the mailbox demo.', '3D 场景暂不可用，请重新加载后体验邮箱演示。') : !choices.length ? t('No garden houses in this snapshot. Choose a later moment on the timeline.', '这个快照还没有花园屋，请选择时间线中较后的时刻。') : '';
  }
  button.onclick = () => {
    stopHistory(); refresh(); focusSceneOnClose = false;
    host.querySelector<HTMLDetailsElement>('.sample-tour-picker')?.removeAttribute('open');
    button.classList.add('active'); button.setAttribute('aria-expanded', 'true'); dialog.showModal();
  };
  get('#close-investment').onclick = () => dialog.close();
  dialog.onclose = () => {
    button.classList.remove('active'); button.setAttribute('aria-expanded', 'false');
    if (disposed) return;
    const target = focusSceneOnClose ? host.querySelector<HTMLCanvasElement>('#scene canvas') : button;
    if (target) { target.tabIndex = 0; target.focus({ preventScroll: true }); }
  };
  function tryMailbox(send: boolean) {
    const id = picker.value, current = scene();
    if (disposed || !eligible().some(p => p.id === id) || !current?.focusMailbox(id)) {
      status.textContent = t('The mailbox is still loading. Try again in a moment.', '邮箱仍在加载中，请稍后重试。'); return;
    }
    if (send && !current.tossCoin(id)) {
      status.textContent = t('A coin is on its way. Let it arrive, then try again.', '一枚金币正在投递中，等它落入邮箱后再试。'); return;
    }
    focusSceneOnClose = true; dialog.close();
  }
  find.onclick = () => tryMailbox(false); toss.onclick = () => tryMailbox(true);
  return {
    refresh,
    credit(id: string) {
      if (disposed || !eligible().some(p => p.id === id)) return;
      const project = projects.find(p => p.id === id)!;
      const count = (counts.get(id) || 0) + 1; counts.set(id, count);
      clearTimeout(hideTimer); receipt.classList.remove('coin-arrived'); receipt.hidden = false;
      receipt.dataset.demoTotal = String(count);
      get('#demo-wallet-project').textContent = project.name;
      get('#demo-wallet-balance').textContent = t(`${count} demo ${count === 1 ? 'coin' : 'coins'} · This visit only`, `${count} 枚演示金币 · 仅本次游览`);
      void receipt.offsetWidth; receipt.classList.add('coin-arrived');
      hideTimer = setTimeout(hideReceipt, 4400);
    },
    dispose() {
      disposed = true; hideReceipt(); counts.clear(); button.onclick = null;
      dialog.onclose = null; if (dialog.open) dialog.close(); layer.remove();
    },
  };
}
