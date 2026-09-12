import { cleanEvent } from './bundle.mjs';
import { repositoryKey } from './model.mjs';

// Drafts can be incomplete; capture still uses the full configuration validator.
// 草稿允许未填完；创建快照时仍需通过完整配置校验。
export function planningDraft(input) {
  if (input?.kind !== 'buildergame-plan/v1') throw new Error('Expected a buildergame-plan/v1 draft');
  const text = (value, limit) => {
    if (typeof value !== 'string' || value.length > limit) throw new Error('Invalid planning draft field');
    return value;
  };
  if (!['personal', 'hackathon'].includes(input.collection) || !['flat', 'valley', 'clouds'].includes(input.landscape)) throw new Error('Invalid planning draft mode');
  if (!Array.isArray(input.selected) || input.selected.length > 200) throw new Error('Invalid draft repository selection');
  const selected = [...new Set(input.selected.map(url => { repositoryKey(url); return url; }))];
  const weights = Object.fromEntries(['commits', 'stars', 'forks'].map(key => {
    const value = input.weights?.[key];
    if (!Number.isFinite(value) || value < 0) throw new Error('Invalid planning draft weight');
    return [key, value];
  }));
  // Explicit fields only: no session, credentials, or arbitrary imported properties.
  return { kind: 'buildergame-plan/v1', collection: input.collection, landscape: input.landscape,
    title: text(input.title, 80), username: text(input.username, 100), repoText: text(input.repoText, 100000),
    selected, weights, publish: input.publish === true,
    configuration: input.configuration ? cleanEvent(input.configuration) : null };
}
