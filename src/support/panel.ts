import type { Project, TownEvent } from '../types';
import './panel.css';

export type SupportPanelOptions = {
  event: TownEvent;
  t: (en: string, zh: string) => string;
  onConfirmed: (projectId: string, result: { hash: string; amount: string; recipient: string }) => void;
  onLockChange?: (locked: boolean) => void;
};
export type SupportPanel = { open(project?: Project): void; dispose(): void };

/** SDK loading belongs to this optional island, never to town browsing. 按需加载钱包。 */
export function mountSupportPanel(host: HTMLElement, options: SupportPanelOptions): SupportPanel {
  const layer = document.createElement('div');
  layer.className = 'support-island';
  host.append(layer);
  let disposed = false, loading = false, opened = false, generation = 0, loadFailed = false;
  let modulePromise: Promise<typeof import('./wallet-panel')> | undefined;
  let current: Project | undefined, instance: SupportPanel | undefined;
  let restoreFocus: HTMLElement | null = null;
  const appId = import.meta.env.VITE_PRIVY_APP_ID?.trim();

  function close() { opened = false; loading = false; generation++; layer.replaceChildren(); restoreFocus?.isConnected && restoreFocus.focus({ preventScroll: true }); }
  function placeholder(message: string, retry = false, reloadPage = false) {
    layer.replaceChildren();
    if (!opened || disposed) return;
    const overlay = document.createElement('div'); overlay.className = 'support-overlay';
    const card = document.createElement('section');
    card.className = 'support-card paper-panel'; card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'true');
    card.setAttribute('aria-label', options.t('Support a builder', '支持开发者'));
    const title = document.createElement('h2'); title.textContent = options.t('Support a builder', '支持开发者');
    const note = document.createElement('p'); note.textContent = message; note.setAttribute('role', 'status');
    const button = document.createElement('button'); button.type = 'button'; button.className = 'hud-button';
    button.textContent = options.t('Back to town', '返回小镇'); button.onclick = close;
    card.append(title, note);
    if (retry) {
      const again = document.createElement('button'); again.type = 'button'; again.className = 'hud-button';
      again.textContent = reloadPage ? options.t('Reload page', '重新加载页面') : options.t('Try loading again', '重新加载');
      again.onclick = reloadPage ? () => window.location.reload() : load;
      card.append(again);
    }
    card.append(button); overlay.append(card); layer.append(overlay); button.focus();
    overlay.onclick = event => { if (event.target === overlay) close(); };
    card.onkeydown = event => {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key === 'Tab') {
        const buttons = Array.from(card.querySelectorAll('button'));
        const first = buttons[0], last = buttons.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
  }
  async function load() {
    if (disposed || !opened) return;
    if (loadFailed) { placeholder(options.t('The wallet module could not load. After checking your connection, reload this page to download it again.', '钱包模块下载失败，请检查网络后重新加载页面。'), true, true); return; }
    if (loading) { placeholder(options.t('Opening your support card…', '正在打开赞赏卡…')); return; }
    if (!appId) {
      placeholder(options.t('Wallet support is not available on this deployment yet. The town owner needs to finish the Privy setup. You can keep exploring the town.', '当前部署尚未开放钱包赞赏，城镇部署者需要完成 Privy 配置。你可以继续游览小镇。'));
      return;
    }
    loading = true;
    const token = ++generation;
    let timer: ReturnType<typeof setTimeout> | undefined;
    placeholder(options.t('Opening your support card…', '正在打开赞赏卡…'));
    try {
      modulePromise ||= import('./wallet-panel').catch(error => { loadFailed = true; throw error; });
      const { mountWalletPanel } = await Promise.race([modulePromise, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Wallet module timeout')), 25000); })]);
      if (disposed || token !== generation) return;
      layer.replaceChildren();
      instance = mountWalletPanel(layer, { ...options, onConfirmed(id, result) { if (!disposed) options.onConfirmed(id, result); } }, appId);
      if (opened) {
        // The loading card was focused; restore the original trigger before React captures it.
        if (restoreFocus?.isConnected) restoreFocus.focus({ preventScroll: true });
        instance.open(current);
      }
    } catch {
      if (!disposed && token === generation) placeholder(loadFailed ? options.t('The wallet module could not load. After checking your connection, reload this page to download it again.', '钱包模块下载失败，请检查网络后重新加载页面。') : options.t('The wallet download is taking too long. You can return to town or try loading again after checking the connection.', '钱包下载时间较长，可以返回小镇，或检查连接后重试加载。'), true, loadFailed);
    } finally { clearTimeout(timer); if (token === generation) loading = false; }
  }
  return {
    open(project) {
      if (disposed) return;
      restoreFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      current = project; opened = true;
      if (instance) instance.open(project); else void load();
    },
    dispose() { disposed = true; generation++; instance?.dispose(); options.onLockChange?.(false); layer.remove(); },
  };
}
