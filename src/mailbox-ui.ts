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

/** Playful coins stay in this mounted view, independently of optional wallet support. */
export function mountMailboxUI({ host, projects, snapshot, scene, stopHistory, t }: Options) {
  const layer = document.createElement('div');
  layer.className = 'mailbox-ui';
  layer.innerHTML = `<dialog id="investment-dialog" class="paper-panel" aria-labelledby="investment-title" aria-describedby="investment-note">
    <div class="panel-title"><h2 id="investment-title">${t('Support builders', '投资建设')}</h2><button type="button" id="close-investment" class="hud-button icon-button" aria-label="${t('Close', '关闭')}">${icon('x')}</button></div>
    <div class="demo-wallet-card"><span class="demo-wallet-art" aria-hidden="true">${icon('house')}<i>${icon('coin')}</i></span><div><span class="demo-tag">${t('PLAYFUL COINS', '投币彩蛋')}</span><strong>${t('A little encouragement', '给建设者一点鼓励')}</strong></div></div>
    <p id="investment-note">${t('This coin demo only plays an animation; it sends no wallet transaction. Create a town with receiving addresses to enable wallet-confirmed support. Currently, transfers use Sepolia test ETH only.', '这里的投币仅演示动画，不会触发真实钱包交易。创建小镇并配置收款地址后，可通过钱包确认发起链上赞赏。当前仅支持 Sepolia 测试 ETH。')}</p>
    <label class="mailbox-picker" for="mailbox-project">${t('Choose a garden-house mailbox', '选择花园屋的邮箱')}<select id="mailbox-project"></select></label>
    <p id="mailbox-status" class="mailbox-status" role="status"></p>
    <div class="paired-actions mailbox-actions"><button type="button" id="find-mailbox" class="hud-button">${icon('compass')}${t('Find mailbox', '找到邮箱')}</button><button type="button" id="try-demo-coin" class="hud-button">${icon('coin')}${t('Try a demo coin', '试投金币')}</button></div>
  </dialog>
  <section id="demo-wallet-receipt" class="hud-glass" role="status" aria-live="polite" aria-atomic="true" hidden><span class="receipt-art" aria-hidden="true">${icon('coin')}<b>+1</b></span><div><small>${t('Mailbox · Virtual coin received', '邮箱 · 收到虚拟金币')}</small><strong id="demo-wallet-project"></strong><span id="demo-wallet-balance"></span></div></section>`;
  host.append(layer);
  const get = <T extends HTMLElement>(selector: string) => layer.querySelector<T>(selector)!;
  const dialog = get<HTMLDialogElement>('#investment-dialog');
  const picker = get<HTMLSelectElement>('#mailbox-project');
  const find = get<HTMLButtonElement>('#find-mailbox'), toss = get<HTMLButtonElement>('#try-demo-coin');
  const receipt = get('#demo-wallet-receipt'), status = get('#mailbox-status');
  const button = host.querySelector<HTMLButtonElement>('#sample-invest');
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
  if (button) button.onclick = () => {
    stopHistory(); refresh(); focusSceneOnClose = false;
    host.querySelector<HTMLDetailsElement>('.sample-tour-picker')?.removeAttribute('open');
    button.classList.add('active'); button.setAttribute('aria-expanded', 'true'); dialog.showModal();
  };
  get('#close-investment').onclick = () => dialog.close();
  dialog.onclose = () => {
    button?.classList.remove('active'); button?.setAttribute('aria-expanded', 'false');
    if (disposed) return;
    const target = focusSceneOnClose || !button ? host.querySelector<HTMLCanvasElement>('#scene canvas') : button;
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
      disposed = true; hideReceipt(); counts.clear(); if (button) button.onclick = null;
      dialog.onclose = null; if (dialog.open) dialog.close(); layer.remove();
    },
  };
}
