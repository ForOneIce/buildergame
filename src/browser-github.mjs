import { github, capture } from './github-data.mjs';
import { assertAppend, cleanEvent, publicBundle } from './bundle.mjs';
import { safeUrl } from './model.mjs';
import { townDeployment, validTownSlug } from './town-identity.mjs';

function cleanToken(token, required = false) {
  if (token != null && typeof token !== 'string') throw new Error('Enter a GitHub personal access token.');
  const value = token?.trim() || '';
  if (required && !value) throw new Error('Enter a GitHub personal access token.');
  return value;
}
const username = owner => typeof owner === 'string' && /^[a-z0-9-]{1,39}$/i.test(owner);

// Tokens are request arguments only. The application owns their in-memory lifetime.
/**
 * @param {string} token
 * @param {{fetcher?: typeof fetch, signal?: AbortSignal}} [options]
 */
export async function connectToken(token, { fetcher = fetch, signal } = {}) {
  const { data } = await github('/user', cleanToken(token, true), fetcher, { signal });
  if (!data || !username(data.login)) throw new Error('GitHub returned an invalid account profile. Please try again.');
  return { login: data.login, avatar: safeUrl(data.avatar_url) || null };
}

/**
 * @param {string} owner
 * @param {number} [page]
 * @param {string} [token]
 * @param {typeof fetch} [fetcher]
 * @param {{signal?: AbortSignal}} [options]
 */
export async function listRepositories(owner, page = 1, token = '', fetcher = fetch, { signal } = {}) {
  if (!username(owner) || !Number.isInteger(page) || page < 1 || page > 100) throw new Error('Enter a valid GitHub username and repository page.');
  const { data, headers } = await github(`/users/${owner}/repos?type=owner&sort=full_name&per_page=100&page=${page}`, cleanToken(token), fetcher, { signal });
  if (!Array.isArray(data)) throw new Error('GitHub returned an invalid repository list. Please try again.');
  return { owner, nextPage: /rel="next"/.test(headers.get('link') || '') ? page + 1 : null, repositories: data.filter(repo => repo && !repo.private && (!repo.visibility || repo.visibility === 'public')).map(repo => ({ repository: repo.html_url, name: repo.name, description: repo.description || '', fork: Boolean(repo.fork), stars: repo.stargazers_count, builder: { name: repo.owner?.login || owner, url: safeUrl(repo.owner?.html_url) || `https://github.com/${owner}`, avatar: safeUrl(repo.owner?.avatar_url) || undefined } })) };
}

/**
 * @param {import('./types').TownEvent} input
 * @param {import('./types').Bundle | null | undefined} previousBundle
 * @param {string} [token]
 * @param {{label?: string, fetcher?: typeof fetch, signal?: AbortSignal}} [options]
 */
export async function captureTown(input, previousBundle, token = '', { label, fetcher = fetch, signal } = {}) {
  const previous = previousBundle ? publicBundle(previousBundle) : null;
  let event = cleanEvent(input);
  if (previous) {
    if (previous.event.id !== event.id) throw new Error('Snapshot belongs to a different town');
    assertAppend(previous, { ...previous, event });
  }
  event = cleanEvent({ ...event, deployment: event.deployment || townDeployment(event.name) });
  if (!validTownSlug(event.deployment.slug)) throw new Error('Invalid town address. Choose another name or backup.');
  const result = await capture(event, previous?.history, cleanToken(token), fetcher, { label, signal, failFast: true });
  return { ...result, published: false };
}
