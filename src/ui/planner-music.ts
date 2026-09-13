import trackUrl from '../../music/Miniature Sky.mp3?url';

/** One lazy loop for the planning desk. 离开图纸页立即停止。 */
export function createPlannerMusic(host: HTMLElement, initiallyEnabled: boolean) {
  let enabled = initiallyEnabled, active = false, activated = false, disposed = false, away = false;
  let audio: HTMLAudioElement | undefined, starting = false, revision = 0;
  const available = typeof window.Audio === 'function';
  const wanted = () => active && enabled && activated && !document.hidden && !away && !disposed;

  function pause(reset = false) {
    audio?.pause();
    if (reset && audio) {
      try { audio.currentTime = 0; } catch { /* Metadata may not be loaded yet. */ }
    }
  }
  function sync() {
    if (!wanted()) { pause(!active); return; }
    if (!available || starting) return;
    try {
      if (!audio) {
        audio = new window.Audio();
        audio.preload = 'none'; audio.loop = true; audio.volume = .16;
        audio.src = trackUrl;
      }
      if (!audio.paused) return;
      // A failed media load may recover on a later deliberate interaction.
      if (audio.error) audio.load();
      starting = true;
      const attempt = revision;
      void audio.play().catch(() => { /* Autoplay/network failure never blocks planning. */ }).finally(() => {
        starting = false;
        if (!wanted()) pause(!active);
        else if (attempt !== revision) sync();
      });
    } catch { starting = false; }
  }
  function gesture(event: Event) {
    if (!event.isTrusted || !(event.target instanceof Node) || !host.contains(event.target)) return;
    if (event instanceof PointerEvent && event.button !== 0) return;
    if (event instanceof KeyboardEvent && !['Enter', ' '].includes(event.key)) return;
    activated = true;
    // The first attempt to mute must not unlock a brief burst of music.
    if (enabled && event.target instanceof Element && event.target.closest('[data-sound-toggle]')) return;
    sync();
  }
  const visibility = () => { revision++; sync(); };
  const pageHide = () => { revision++; away = true; pause(); };
  const pageShow = () => { revision++; away = false; sync(); };
  document.addEventListener('pointerdown', gesture, true);
  document.addEventListener('keydown', gesture, true);
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('pagehide', pageHide);
  window.addEventListener('pageshow', pageShow);
  return {
    get available() { return available; },
    setActive(value: boolean) { if (active !== value) { revision++; active = value; sync(); } },
    setEnabled(value: boolean) { if (enabled !== value) { revision++; enabled = value; sync(); } },
    dispose() {
      disposed = true; pause();
      if (audio) { audio.removeAttribute('src'); audio.load(); }
      document.removeEventListener('pointerdown', gesture, true);
      document.removeEventListener('keydown', gesture, true);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', pageHide);
      window.removeEventListener('pageshow', pageShow);
    },
  };
}
