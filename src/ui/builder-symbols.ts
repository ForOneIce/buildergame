// Original illustrations: one supportive hand, or hands gathering around a shared center.
// 装饰图形；入口名称由旁边的文字提供。
const outline = '#795631';

function personalHand(): string {
  return `<circle cx="64" cy="58" r="45" fill="#afc8ab" opacity=".3"/>
    <path d="M47 87C36 79 29 65 27 54C25 47 28 42 32 42C36 41 39 46 41 50L45 58L42 31C41 26 43 22 47 22C51 22 54 25 54 31L56 47L57 23C57 18 59 14 64 15C69 15 71 19 70 24L69 47L74 27C75 22 79 20 82 22C86 23 87 27 85 32L81 51L87 38C89 33 93 32 96 35C99 37 98 41 96 46L91 68C88 80 82 87 75 89L47 87Z" fill="#fff2d2" stroke="${outline}" stroke-width="2.8" stroke-linejoin="round"/>
    <path d="M45 58C48 65 52 68 57 71M55 62C61 58 69 59 75 62M57 76C62 78 68 79 73 76" fill="none" stroke="#b38958" stroke-width="2.1" stroke-linecap="round"/>
    <path d="M46 87L76 89L75 103L44 101Z" fill="#76a99a" stroke="${outline}" stroke-width="2.8" stroke-linejoin="round"/>
    <path d="M50 91L69 93" stroke="#bad4bb" stroke-width="2.3" stroke-linecap="round"/>
    <path d="m23 25 1-5m-8 12-5-1m88 46 5 2" stroke="#ba955c" stroke-width="2.5" stroke-linecap="round"/>`;
}

function communityHands(): string {
  const colors = ['#79ab9b', '#c8aa76', '#9cb8a2', '#b99770'];
  const hands = colors.map((color, index) => `<g transform="rotate(${index * 90} 64 58)">
    <path d="M42 16L62 10L69 27L48 34Z" fill="${color}" stroke="${outline}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M48 32L65 26C70 29 73 34 77 36L86 40C90 42 91 45 89 48C87 51 84 50 81 49L72 45L78 52C81 55 79 59 76 59C74 59 73 58 71 56L65 50L70 59C72 62 69 66 66 64L59 54L60 62C60 66 55 67 53 63L49 54C45 49 42 45 43 40C43 37 45 34 48 32Z" fill="#fff2d2" stroke="${outline}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M54 36L63 33M51 43C56 40 60 41 63 44" fill="none" stroke="#b38958" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M49 21L57 18" stroke="#f7eccd" stroke-width="2" stroke-linecap="round"/>
  </g>`).join('');
  return `<circle cx="64" cy="58" r="48" fill="#afc8ab" opacity=".23"/>
    <circle cx="64" cy="58" r="31" fill="#86b7a5" opacity=".45"/>${hands}
    <path d="M60 55C58 52 61 49 64 52C67 49 70 52 68 55L64 60Z" fill="#cfab66" stroke="${outline}" stroke-width="1.6" stroke-linejoin="round"/>`;
}

/** Decorative only: accompanying text names the audience. */
export function builderSymbol(mode: 'personal' | 'community'): string {
  return `<svg class="builder-symbol builder-symbol-${mode}" viewBox="0 0 128 116" width="128" height="116" aria-hidden="true" focusable="false">${mode === 'personal' ? personalHand() : communityHands()}</svg>`;
}
