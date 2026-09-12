export const validTownSlug = value => typeof value === 'string' && value !== 'index' && value.length <= 120 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
export const normalizedTownName = name => name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US');

// No backend or Node APIs: the address travels with each exported public bundle.
export function townDeployment(name, date = new Date()) {
  const normalized = normalizedTownName(name), createdAt = date.toISOString();
  let stem = normalized.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64).replace(/-$/, '');
  if (!stem) {
    let hash = 2166136261;
    for (const character of normalized) hash = Math.imul(hash ^ character.codePointAt(0), 16777619) >>> 0;
    stem = `town-${hash.toString(16).padStart(8, '0')}`;
  }
  return { slug: `${stem}-${createdAt.replace(/[-:.]/g, '').replace('T', '-').replace('Z', '')}`, createdAt };
}
