import type { Landscape } from '../types';
type Translate = (en: string, zh: string) => string;

export function objectArt(kind: 'map' | 'plan') {
  return kind === 'map'
    ? '<span class="map-art" aria-hidden="true"><span class="map-fold"></span><span class="map-fold"></span><span class="map-fold"></span><span class="map-route"></span><span class="map-pin">●</span></span>'
    : '<span class="planning-roll" aria-hidden="true"><span class="plan-house"></span></span>';
}

// Actual sample terrain; each collection generates its own layout. 实景示例，非最终布局预测。
export function sitePlan(landscape: Landscape, t: Translate) {
  return `<figure class="site-plan" data-landscape="${landscape}" aria-label="${t('Selected town landscape preview','已选小镇地形预览')}"><div class="site-plan-preview"><img id="terrain-thumbnail" src="${import.meta.env.BASE_URL}ui/landscapes/${landscape}.png" alt="${t('Selected landscape preview','已选地形预览')}" width="1280" height="720"></div><figcaption><span>${t('LANDSCAPE PREVIEW','地形预览')}</span><span>${t('Example layout','示例布局')}</span></figcaption></figure>`;
}
