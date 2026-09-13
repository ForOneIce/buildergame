// Original geometric UI drawings. Labels belong to the surrounding control.
const drawings: Record<string, string> = {
  coin: '<ellipse cx="12" cy="12" rx="9" ry="10"/><ellipse cx="12" cy="12" rx="6" ry="7"/><path d="m12 8 1.1 2.7 2.9.3-2.2 2 .6 3-2.4-1.5L9.6 16l.6-3L8 11l2.9-.3Z"/>',
  wallet: '<path d="M4 7V5l14-2v4M3 7h17v14H3V7Z"/><path d="M20 12h-6v5h6M17 14.5h.1"/>',
  house: '<path d="M3 11 12 3l9 8M5 10v11h5v-7h4v7h5V10"/>',
  map: '<path d="m2.5 5 6-2 7 3 6-2v16l-6 2-7-3-6 2V5Zm6-2v16m7-13v16"/>',
  plan: '<path d="M5 4h14v16H5zM5 4H3v5m16 11h2v-5M8 11l4-4 4 4M9 10v6h6v-6M9 18h6"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
  projects: '<path d="M3 9h7v12H3zM14 13h7v8h-7zM13 3h8v6h-8zM5.5 12h2m-2 4h2M16.5 16h2"/>',
  settings: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  upload: '<path d="M12 15V3m-5 5 5-5 5 5M4 16v5h16v-5"/>',
  user: '<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  github: '<circle cx="7" cy="5" r="2.5"/><circle cx="7" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M7 7.5v9M18 7.5v3c0 3-3 4-7 4H7"/>',
  language: '<path d="M3 5h10M8 2v3m3 0c0 6-4 9-8 10m1-7c1 3 3 5 7 7m2 6 4-11 4 11m-6-4h4"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  arrow: '<path d="M3 12h18m-7-7 7 7-7 7"/>',
  plus: '<path d="M12 4v16M4 12h16"/>',
  minus: '<path d="M4 12h16"/>',
  reset: '<path d="M5 8a8 8 0 1 1-1 9M5 3v5h5"/>',
  play: '<path d="m7 3 14 9-14 9V3Z"/>',
  pause: '<path d="M7 4v16M17 4v16"/>',
  mountain: '<path d="m2 21 8-17 5 10 3-6 5 13H2Zm5-11 3 2 3-2"/>',
  cloud: '<path d="M6 19a5 5 0 0 1-1-10 7 7 0 0 1 13-2 6 6 0 0 1 0 12H6Z"/>',
  history: '<path d="M4 4h13v16H4zM7 7h5M7 11h3"/><circle cx="17" cy="16" r="5"/><path d="M17 13v3l2 1"/>',
  flag: '<path d="M5 22V3m0 1c5-4 9 4 15 0v10c-6 4-10-4-15 0"/>',
  search: '<circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
};

const aliases: Record<string, string> = {
  'user-round': 'user', 'layout-grid': 'projects', x: 'close',
  'arrow-right': 'arrow', 'rotate-ccw': 'reset', building: 'house',
};

/** Decorative SVG; keep a visible or accessible name on its button/link. */
export function icon(name: string): string {
  return `<svg class="ui-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${drawings[aliases[name] || name] || drawings.compass}</svg>`;
}
