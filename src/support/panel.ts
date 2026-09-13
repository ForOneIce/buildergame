import type { Project, TownEvent } from '../types';
import './panel.css';

export type SupportPanelOptions = {
  event: TownEvent;
  t: (en: string, zh: string) => string;
  onConfirmed: (projectId: string, result: { hash: string; amount: string; recipient: string }) => void;
};
export type SupportPanel = { open(project?: Project): void; dispose(): void };

/** SDK loading belongs to this optional island, never to town browsing. 按需加载钱包。 */
export function mountSupportPanel(host: HTMLElement, options: SupportPanelOptions): SupportPanel {
  const layer = document.createElement('div');
  layer.className = 'support-island';
  host.append(layer);
  let disposed = false, loading = false, opened = false;
  let current: Project | undefined, instance: SupportPanel | undefined;
  let restoreFocus: HTMLElement | null = null;
  const appId = import.meta.env.VITE_PRIVY_APP_ID?.trim();

  function close() { opened = false; layer.replaceChildren(); restoreFocus?.isConnected && restoreFocus.focus({ preventScroll: true }); }
  function placeholder(message: string, retry = false) {
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
      again.textContent = options.t('Try loading again', '重新加载'); again.onclick = load;
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
    if (disposed || loading || !opened) return;
    if (!appId) {
      placeholder(options.t('Wallet support is not available on this deployment yet. The town owner needs to finish the Privy setup. You can keep exploring the town.', '当前部署尚未开放钱包赞赏，城镇部署者需要完成 Privy 配置。你可以继续游览小镇。'));
      return;
    }
    loading = true;
    placeholder(options.t('Opening your support card…', '正在打开赞赏卡…'));
    try {
      const { mountWalletPanel } = await import('./wallet-panel');
      if (disposed) return;
      layer.replaceChildren();
      instance = mountWalletPanel(layer, { ...options, onConfirmed(id, result) { if (!disposed) options.onConfirmed(id, result); } }, appId);
      if (opened) {
        // The loading card was focused; restore the original trigger before React captures it.
        if (restoreFocus?.isConnected) restoreFocus.focus({ preventScroll: true });
        instance.open(current);
      }
    } catch {
      if (!disposed) placeholder(options.t('The wallet panel could not load. Check your connection and try again.', '钱包面板加载失败，请检查网络后重试。'), true);
    } finally { loading = false; }
  }
  return {
    open(project) {
      if (disposed) return;
      restoreFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      current = project; opened = true;
      if (instance) instance.open(project); else void load();
    },
    dispose() { disposed = true; instance?.dispose(); layer.remove(); },
  };
}
