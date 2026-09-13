export type InterfaceCue = 'hover' | 'click' | 'map' | 'open' | 'close' | 'success';

const clips: Record<InterfaceCue, { file: string; gain: number }> = {
  hover: { file: 'hover.ogg', gain: .3 },
  click: { file: 'click.ogg', gain: .55 },
  map: { file: 'map-open.ogg', gain: .65 },
  open: { file: 'panel-open.ogg', gain: .75 },
  close: { file: 'panel-close.ogg', gain: .12 },
  success: { file: 'success.ogg', gain: .8 },
};
const preference = 'bg-sound-enabled';
const actionable = 'button,a[href],summary,[role="button"],input[type="checkbox"],input[type="radio"]';

/** One quiet, gesture-unlocked mixer for every screen. 音效不自动播放。 */
export function createInterfaceAudio(host: HTMLElement) {
  let enabled = true;
  try { enabled = localStorage.getItem(preference) !== 'off'; } catch { /* Session-only preference. */ }
  const Audio = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  let context: AudioContext | undefined, master: GainNode | undefined, disposed = false;
  let epoch = 0, intent = 0, tabAt = -Infinity, lastHover = -Infinity, lastAction = -Infinity;
  const loading = new Map<InterfaceCue, Promise<AudioBuffer | undefined>>();
  const requests = new Set<AbortController>();
  const voices = new Set<{ source: AudioBufferSourceNode; gain: GainNode }>();

  function stop() {
    epoch++; intent++;
    for (const voice of voices) {
      voice.source.onended = null;
      try { voice.source.stop(); } catch { /* Already ended. */ }
      voice.source.disconnect(); voice.gain.disconnect();
    }
    voices.clear();
  }
  function load(cue: InterfaceCue): Promise<AudioBuffer | undefined> {
    const cached = loading.get(cue); if (cached) return cached;
    const request = new AbortController(); requests.add(request);
    const deadline = setTimeout(() => request.abort(), 5000);
    const audio = context!;
    const result = fetch(`${import.meta.env.BASE_URL}audio/ui/${clips[cue].file}`, { signal: request.signal })
      .then(response => { if (!response.ok) throw Error('Sound unavailable'); return response.arrayBuffer(); })
      .then(bytes => audio.decodeAudioData(bytes))
      .catch(() => undefined)
      .finally(() => { clearTimeout(deadline); requests.delete(request); });
    loading.set(cue, result); return result;
  }
  function unlock(event: Event) {
    if (!event.isTrusted || !enabled || disposed || document.hidden || !Audio) return;
    try {
      if (!context) {
        context = new Audio({ latencyHint: 'interactive' });
        master = context.createGain(); master.gain.value = .18; master.connect(context.destination);
        for (const cue of Object.keys(clips) as InterfaceCue[]) void load(cue);
      }
      if (context.state === 'suspended') void context.resume().then(() => {
        if ((!enabled || document.hidden || disposed) && context?.state === 'running') void context.suspend().catch(() => {});
      }).catch(() => {});
    } catch { /* Audio support never blocks the interface. */ }
  }
  async function play(cue: InterfaceCue) {
    if (!enabled || disposed || document.hidden || !context || !master || context.state !== 'running') return;
    const now = performance.now();
    if (cue === 'hover') {
      if (now - lastHover < 140 || now - lastAction < 160) return;
      lastHover = now;
    } else {
      if (cue !== 'success' && now - lastAction < 70) return;
      lastAction = now;
    }
    const generation = epoch, ticket = ++intent;
    const buffer = await load(cue);
    // Do not replay delayed sounds after navigation, mute, or a newer interaction.
    if (!buffer || disposed || !enabled || document.hidden || context.state !== 'running' || generation !== epoch || ticket !== intent || performance.now() - now > 450) return;
    try {
      if (voices.size >= 2) {
        const oldest = voices.values().next().value!;
        oldest.source.stop(); oldest.source.disconnect(); oldest.gain.disconnect(); voices.delete(oldest);
      }
      const source = context.createBufferSource(), gain = context.createGain();
      source.buffer = buffer; gain.gain.value = clips[cue].gain;
      source.connect(gain); gain.connect(master);
      const voice = { source, gain }; voices.add(voice);
      source.onended = () => { source.disconnect(); gain.disconnect(); voices.delete(voice); };
      source.start();
    } catch { /* Silent failure on unsupported/closed audio devices. */ }
  }
  const inside = (event: Event) => event.target instanceof Node && host.contains(event.target);
  const target = (event: Event) => event.target instanceof Element ? event.target.closest<HTMLElement>(actionable) : null;
  const active = (element: HTMLElement | null) => element && !element.matches(':disabled,[aria-disabled="true"]') && !element.closest('[inert]');
  const pointerDown = (event: PointerEvent) => { if (inside(event) && event.button === 0) unlock(event); };
  const keyDown = (event: KeyboardEvent) => {
    if (!inside(event) || !event.isTrusted) return;
    if (event.key === 'Tab') tabAt = performance.now();
    else tabAt = -Infinity;
    if (['Enter', ' ', 'Escape'].includes(event.key)) unlock(event);
  };
  const click = (event: MouseEvent) => {
    if (!inside(event) || !event.isTrusted || event.button !== 0) return;
    const element = target(event); if (!active(element) || element!.hasAttribute('data-sound-toggle')) return;
    unlock(event);
    if (element!.matches('#try-demo-coin')) return; // The arrival owns this action's coin cue.
    let cue: InterfaceCue = 'click';
    if (element!.matches('[data-enter],[data-tour-landscape],[data-mode],#map-home')) cue = 'map';
    else if (element!.matches('[data-create],[data-project],[data-visit],#sample-invest,#player-login,#show-projects,#random-explore,#next-project')) cue = 'open';
    else if (element!.matches('.close,[id^="close-"]')) cue = 'close';
    else if (element!.tagName === 'SUMMARY') cue = element!.parentElement?.hasAttribute('open') ? 'close' : 'open';
    void play(cue);
  };
  const hover = (event: PointerEvent) => {
    if (!inside(event) || !event.isTrusted || event.pointerType !== 'mouse' || event.buttons || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const element = target(event);
    if (!active(element) || element!.hasAttribute('data-sound-toggle') || (event.relatedTarget instanceof Node && element!.contains(event.relatedTarget))) return;
    void play('hover');
  };
  const focus = (event: FocusEvent) => {
    if (inside(event) && performance.now() - tabAt < 200 && active(target(event))) void play('hover');
  };
  const cancel = (event: Event) => { if (inside(event) && event.isTrusted) void play('close'); };
  function quiet() { stop(); if (context?.state === 'running') void context.suspend().catch(() => {}); }
  const visibility = () => { if (document.hidden) quiet(); };
  document.addEventListener('pointerdown', pointerDown, true);
  document.addEventListener('keydown', keyDown, true);
  document.addEventListener('click', click, true);
  document.addEventListener('pointerover', hover, true);
  document.addEventListener('focusin', focus, true);
  document.addEventListener('cancel', cancel, true);
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('pagehide', quiet);
  return {
    get enabled() { return enabled; },
    get available() { return Boolean(Audio); },
    play,
    toggle(event: Event) {
      enabled = !enabled;
      try { localStorage.setItem(preference, enabled ? 'on' : 'off'); } catch { /* Keep the session setting. */ }
      if (!enabled) quiet();
      else { unlock(event); void play('click'); }
    },
    dispose() {
      disposed = true; stop(); requests.forEach(request => request.abort()); requests.clear(); loading.clear();
      if (context) void context.close().catch(() => {});
      document.removeEventListener('pointerdown', pointerDown, true);
      document.removeEventListener('keydown', keyDown, true);
      document.removeEventListener('click', click, true);
      document.removeEventListener('pointerover', hover, true);
      document.removeEventListener('focusin', focus, true);
      document.removeEventListener('cancel', cancel, true);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', quiet);
    },
  };
}
