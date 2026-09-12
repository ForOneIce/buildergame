import type { Landscape } from '../types';
type Translate = (en: string, zh: string) => string;

export function objectArt(kind: 'map' | 'plan') {
  return kind === 'map'
    ? '<span class="map-art" aria-hidden="true"><span class="map-fold"></span><span class="map-fold"></span><span class="map-fold"></span><span class="map-route"></span><span class="map-pin">●</span></span>'
    : '<span class="planning-roll" aria-hidden="true"><span class="plan-house"></span></span>';
}

// A schematic, not a prediction of the generated town. 图纸示意，实际布局由项目数据生成。
export function sitePlan(landscape: Landscape, t: Translate) {
  const lots = [[60,65],[182,65],[304,65],[60,226],[182,226],[304,226]];
  return `<figure class="site-plan" data-landscape="${landscape}" aria-label="${t('Illustrative town planning drawing','小镇规划示意图')}"><div class="site-plan-preview"><img id="terrain-thumbnail" src="${import.meta.env.BASE_URL}ui/landscapes/${landscape}.png" alt="${t('Selected landscape preview','已选地形缩略图')}" width="320" height="180"></div><svg viewBox="0 0 460 400" fill="none" aria-hidden="true"><g stroke="currentColor" stroke-width="1.4"><rect x="28" y="34" width="405" height="310" rx="44" stroke-dasharray="5 5" opacity=".45"/><path d="M30 176H430M30 200H430M162 44V176M162 200V332M286 44V176M286 200V332" opacity=".65"/>${lots.map(([x,y])=>`<g><rect x="${x}" y="${y}" width="88" height="88" rx="3"/><rect x="${x+22}" y="${y+20}" width="44" height="44" fill="currentColor" fill-opacity=".08"/><path d="M${x+22} ${y+42}h44m-40 -18l35 35"/><circle cx="${x+74}" cy="${y+72}" r="6"/></g>`).join('')}<g class="plan-water" stroke="#477a70"><path d="M25 81Q73 11 186 44T430 55M25 90Q75 20 186 53T430 64" stroke-width="3"/><ellipse cx="83" cy="335" rx="55" ry="18"/></g><g class="plan-clouds" stroke-dasharray="4 3"><ellipse cx="164" cy="106" rx="135" ry="72"/><ellipse cx="350" cy="108" rx="65" ry="72"/><ellipse cx="226" cy="269" rx="195" ry="74"/></g><path d="M20 18H434M20 12V24M434 12V24M409 321V298m-5 6 5-7 5 7" opacity=".7"/></g></svg><figcaption><span>${t('SITE PLAN · ILLUSTRATIVE','场地规划 · 示意')}</span><span>${t('1 repo = 1 plot','1 个仓库 = 1 个地块')}</span></figcaption></figure>`;
}
