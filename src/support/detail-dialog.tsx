import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { SupportPanelOptions } from './panel';

/** Secondary information stays separate from the concise transfer card. */
export function SupportDetail({ title, children, close, t, page }: { title: string; children: ReactNode; close: () => void; t: SupportPanelOptions['t']; page?: number }) {
  const card = useRef<HTMLElement>(null);
  useEffect(() => {
    const restore = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    card.current?.querySelector<HTMLElement>('button')?.focus();
    return () => { if (restore?.isConnected) restore.focus({ preventScroll: true }); };
  }, []);
  useEffect(() => {
    // Changing pages disables the previous action; move focus before browser blur.
    if (page !== undefined) card.current?.querySelector<HTMLElement>('#support-detail-title')?.focus({ preventScroll: true });
  }, [page]);
  return createPortal(<div className="support-overlay support-detail-overlay" onMouseDown={event => { if (event.target === event.currentTarget) close(); }} onKeyDown={event => {
    event.stopPropagation();
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    if (event.key === 'Tab') {
      const nodes = Array.from(card.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),[tabindex="0"]') || []).filter(node => node.offsetParent !== null);
      const first = nodes[0], last = nodes.at(-1);
      // Paging can disable the focused button. Keep the next Tab inside the dialog.
      if (!nodes.includes(document.activeElement as HTMLElement)) { event.preventDefault(); (event.shiftKey ? last : first)?.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }}><section ref={card} className="support-card support-detail-card paper-panel" role="dialog" aria-modal="true" aria-labelledby="support-detail-title"><div className="support-heading"><h2 id="support-detail-title" tabIndex={-1}>{title}</h2><button type="button" className="hud-button" onClick={close} aria-label={t('Back to support', '返回赞赏')}>×</button></div>{children}</section></div>, document.body);
}
