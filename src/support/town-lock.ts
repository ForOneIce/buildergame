/** Lock the game, while leaving its wallet island and body-level Privy portals usable. */
export function createTownInteractionLock(host: HTMLElement) {
  const previous = new Map<HTMLElement, boolean>();
  let locked = false;
  const apply = () => {
    for (const child of Array.from(host.children)) {
      if (!(child instanceof HTMLElement) || child.classList.contains('support-island')) continue;
      if (!previous.has(child)) previous.set(child, child.inert);
      child.inert = true;
    }
  };
  const observer = new MutationObserver(() => { if (locked) apply(); });
  return {
    get locked() { return locked; },
    set(value: boolean) {
      if (value === locked) return;
      locked = value;
      if (locked) {
        apply();
        observer.observe(host, { childList: true });
      } else {
        observer.disconnect();
        for (const [element, inert] of previous) element.inert = inert;
        previous.clear();
      }
    },
  };
}
