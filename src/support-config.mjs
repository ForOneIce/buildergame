import { getAddress } from 'ethers/address';

// Optional public recipient metadata. No keys, sessions, or provider settings are exported.
// 中文：仅保存公开收款地址；未配置的项目继续使用原有投币彩蛋。
export const SUPPORT_CHAIN_ID = 11155111;

function check(condition, message) { if (!condition) throw new Error(message); }
function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function recipient(value) {
  check(typeof value === 'string' && value.trim().length > 0, 'A support recipient must be an Ethereum address');
  let address;
  try { address = getAddress(value.trim()); } catch { throw new Error('Invalid support recipient address or checksum'); }
  check(address !== '0x0000000000000000000000000000000000000000', 'The zero address cannot receive builder support');
  return address;
}
function repoKey(value) {
  check(typeof value === 'string' && /^[\w.-]+\/[\w.-]+$/.test(value), 'Support recipients must use owner/repository keys');
  const key = value.replace(/\.git$/, '').toLowerCase();
  check(key.split('/').every(part => part && part !== '.' && part !== '..'), 'Invalid support repository key');
  return key;
}
function projectKey(project) {
  try {
    const url = new URL(project.repository);
    check(url.protocol === 'https:' && url.hostname === 'github.com' && !url.username && !url.password && !url.search && !url.hash, 'Invalid support project repository');
    return repoKey(url.pathname.replace(/^\//, '').replace(/\/$/, ''));
  } catch { throw new Error('Invalid support project repository'); }
}

/** @returns {import('./types').SupportConfiguration | undefined} */
export function cleanSupport(input, collectionType, projects = []) {
  if (input === undefined || input === null) return undefined;
  check(object(input), 'Invalid support configuration');
  const hasRecipient = input.recipient !== undefined;
  const hasMap = input.projectRecipients !== undefined;
  const hasMetadata = input.version !== undefined || input.chainId !== undefined;
  if (!hasRecipient && !hasMap && !hasMetadata) return undefined;
  check(input.version === 1, 'Support configuration version must be 1');
  check(input.chainId === SUPPORT_CHAIN_ID, 'Builder support currently uses Ethereum Sepolia only');
  check(!(hasRecipient && hasMap), 'Use one personal recipient or project recipients, never both');
  check(collectionType === undefined || ['personal', 'hackathon'].includes(collectionType), 'Invalid support collection type');
  if (hasRecipient) {
    check(collectionType === 'personal', 'A shared support recipient is only available for personal towns');
    if (input.recipient === '') return undefined;
    return { version: 1, chainId: SUPPORT_CHAIN_ID, recipient: recipient(input.recipient) };
  }
  if (hasMap) {
    check(collectionType !== 'personal', 'Personal towns use one support recipient');
    check(object(input.projectRecipients), 'Project support recipients must be a repository-address map');
    const entries = Object.entries(input.projectRecipients);
    check(entries.length <= 200, 'Provide at most 200 project support recipients');
    if (!entries.length) return undefined;
    const known = new Set(projects.map(projectKey));
    const seen = new Set();
    const mapped = entries.map(([repository, value]) => {
      const key = repoKey(repository);
      check(known.has(key), `Support recipient does not match a town repository: ${key}`);
      check(!seen.has(key), `Duplicate support recipient repository: ${key}`);
      seen.add(key);
      return [key, recipient(value)];
    });
    return { version: 1, chainId: SUPPORT_CHAIN_ID, projectRecipients: Object.fromEntries(mapped) };
  }
  return undefined;
}

export function recipientForProject(event, project) {
  const support = cleanSupport(event?.support, event?.collectionType, event?.projects);
  if (!support || !project) return undefined;
  const key = projectKey(project);
  if (!event.projects.some(candidate => projectKey(candidate) === key)) return undefined;
  return event.collectionType === 'personal' ? support.recipient : support.projectRecipients?.[key];
}

export function hasSupport(event) {
  return Boolean(cleanSupport(event?.support, event?.collectionType, event?.projects));
}
