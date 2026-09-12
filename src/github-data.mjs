import { assert, repositoryKey, makeRecord, baselineSnapshot, validateManifest, validateSnapshots, safeUrl } from './model.mjs';
import { publicBundle, cleanEvent } from './bundle.mjs';
import { matchLocation } from './locations.mjs';

class GitHubRequestError extends Error {}
const requestError = (message, code, extra = {}) => Object.assign(new GitHubRequestError(message), { code, ...extra });
const cancelled = () => requestError('GitHub request cancelled. Previous snapshots are unchanged.', 'cancelled', { name: 'AbortError' });
const stopCapture = (error, options) => options.signal?.aborted || error.code === 'cancelled' || (options.failFast && ['github_auth', 'github_rate_limit', 'github_forbidden', 'network', 'timeout'].includes(error.code));
function responseError(response) {
  const status = response.status, headers = response.headers;
  const rawReset = Number(headers.get('x-ratelimit-reset')), reset = rawReset > 0 && rawReset < 8640000000000 ? new Date(rawReset * 1000).toISOString() : null;
  const rawRetry = Number(headers.get('retry-after')), retryAfter = Number.isFinite(rawRetry) && rawRetry > 0 ? Math.ceil(rawRetry) : null;
  if (status === 401) return requestError('GitHub did not accept this token. Check that it is valid and has not expired.', 'github_auth', { status });
  if (status === 429 || (status === 403 && (headers.get('x-ratelimit-remaining') === '0' || retryAfter))) {
    const when = retryAfter ? ` Retry after ${retryAfter} seconds.` : reset ? ` The limit resets at ${reset}.` : ' Wait a little before trying again.';
    return requestError('GitHub request limit reached.' + when, 'github_rate_limit', { status, ...(reset ? { rateLimitReset: reset } : {}), ...(retryAfter ? { retryAfter } : {}) });
  }
  if (status === 403) return requestError('GitHub restricted this request. Check token access or organization approval, or wait before trying again.', 'github_forbidden', { status });
  if (status === 404) return requestError('The GitHub resource was not found or is not accessible with this token.', 'github_not_found', { status });
  return requestError(`GitHub request failed (${status}). Please try again later.`, 'github_response', { status });
}
export async function github(path, token, fetcher = fetch, options = {}) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) throw requestError('Invalid GitHub request path.', 'invalid_request');
  if (options.signal?.aborted) throw cancelled();
  const controller = new AbortController(); let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 20000);
  const abort = () => controller.abort(); options.signal?.addEventListener('abort', abort, { once: true });
  try {
    // Browser CORS goes directly to GitHub; no credentials or request data are sent to a Buildergame backend.
    const response = await fetcher(`https://api.github.com${path}`, { mode: 'cors', credentials: 'omit', cache: 'no-store', headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, signal: controller.signal });
    if (controller.signal.aborted) throw requestError('Request interrupted.', 'interrupted');
    if (!response.ok) throw responseError(response);
    let data;
    try { data = await response.json(); } catch { throw requestError('GitHub returned an unreadable response. Please try again.', 'github_response'); }
    if (controller.signal.aborted) throw requestError('Request interrupted.', 'interrupted');
    return { data, headers: response.headers };
  } catch (error) {
    if (options.signal?.aborted) throw cancelled();
    if (timedOut || error?.name === 'TimeoutError') throw requestError('GitHub did not respond within 20 seconds. Check your connection and try again.', 'timeout');
    if (error instanceof GitHubRequestError) throw error;
    if (error?.name === 'AbortError') throw cancelled();
    // Do not forward provider bodies, arbitrary fetcher errors, tokens, or request headers to the UI.
    throw requestError('Unable to reach GitHub. Check your network connection and try again.', 'network');
  } finally { clearTimeout(timeout); options.signal?.removeEventListener('abort', abort); }
}
export function commitTotal(data, link) {
  if (!Array.isArray(data) || !data.length) return 0;
  if (!link) return data.length;
  const last = link.split(',').find(s => /rel="last"/.test(s));
  if (!last) throw new Error('Incomplete commit pagination');
  const count = Number(new URL(last.match(/<([^>]+)>/)[1]).searchParams.get('page'));
  if (!Number.isSafeInteger(count) || count < 1) throw new Error('Invalid commit pagination');
  return count;
}
export async function observe(repository, token, fetcher = fetch, options = {}) {
  const key = repositoryKey(repository);
  const { data: repo } = await github(`/repos/${key}`, token, fetcher, options);
  if (repo.private || (repo.visibility && repo.visibility !== 'public')) throw new Error('Only public repositories are supported');
  let count = 0, headOid = null;
  try {
    const commits = await github(`/repos/${key}/commits?per_page=1&sha=${encodeURIComponent(repo.default_branch)}`, token, fetcher, options);
    count = commitTotal(commits.data, commits.headers.get('link')); headOid = commits.data[0]?.sha ?? null;
  } catch (error) { if (error.status !== 409 || repo.size !== 0) throw error; }
  return { repo, metrics: { commits: count, stars: repo.stargazers_count, forks: repo.forks_count, reference: repo.default_branch, headOid } };
}
export async function capture(event, previousHistory, token, fetcher = fetch, options = {}) {
  validateManifest(event);
  if (event.sampleData) throw new Error('Create a real collection before fetching GitHub observations');
  if (previousHistory) validateSnapshots(event, previousHistory);
  assert(options && typeof options === 'object' && !Array.isArray(options), 'Invalid capture options');
  assert(options.label === undefined || typeof options.label === 'string', 'Snapshot label must be text');
  const label = options.label?.trim();
  assert(!label || label.length <= 120, 'Snapshot label must be 120 characters or fewer');
  const updated = cleanEvent(event); const records = [], failures = [];
  const profiles = new Map();
  const previousSnapshots = previousHistory?.snapshots || [baselineSnapshot(event, new Date().toISOString())];
  const custom = Object.fromEntries(Object.entries(event.customScores || {}).map(([url, score]) => [repositoryKey(url), score]));
  // Bounded, sequential requests respect GitHub secondary limits.
  for (const p of updated.projects) {
    if (options.signal?.aborted) throw cancelled();
    const old = previousHistory?.snapshots.at(-1)?.projects.find(r => r.projectId === p.id);
    try {
      const { repo, metrics } = await observe(p.repository, token, fetcher, options);
      p.name = repo.name; p.description = repo.description || p.description; p.homepage = safeUrl(repo.homepage) || p.homepage;
      if (!p.builder.avatar) p.builder.avatar = repo.owner.avatar_url;
      if(updated.residentMap?.enabled&&updated.residentMap.fetchProfiles&&updated.collectionType!=='personal'){
        const explicit=p.builder.url?.match(/^https:\/\/github\.com\/([\w-]+)\/?$/i)?.[1];
        const login=explicit||(repo.owner.type==='User'?repo.owner.login:null);
        if(login){
          if(!profiles.has(login.toLowerCase())){try{profiles.set(login.toLowerCase(),(await github(`/users/${login}`,token,fetcher,options)).data);}catch(error){if(stopCapture(error,options))throw error;profiles.set(login.toLowerCase(),null);}}
          const profile=profiles.get(login.toLowerCase());
          if(profile?.type==='User'){
            p.builder.locationText=typeof profile.location==='string'?profile.location.slice(0,160):'';
            if(p.builder.location?.source!=='manual'){delete p.builder.location;const location=matchLocation(p.builder.locationText);if(location)p.builder.location=location;}
          }
        }
      }
      records.push(makeRecord(p, metrics, event.rule, new Date().toISOString(), old, custom[repositoryKey(p.repository)]));
    } catch (error) { if(stopCapture(error,options))throw error;failures.push(p.id); records.push(makeRecord(p, null, event.rule, null, old)); }
  }
  if (failures.length === updated.projects.length) throw new Error('No repositories could be fetched. Check URLs, GitHub limits and access, then retry. Previous snapshots are unchanged.');
  // Preserve a strict timeline even when two captures finish in the same millisecond.
  const capturedAt = new Date(Math.max(Date.now(), Date.parse(previousSnapshots.at(-1).capturedAt) + 1)).toISOString();
  const sequence = previousSnapshots.filter(snapshot => snapshot.kind !== 'baseline').length + 1;
  const snapshot = { id: `snapshot-${crypto.randomUUID()}`, kind: 'capture', label: label || `Snapshot ${sequence}`, capturedAt, projects: records };
  const history = { schemaVersion: 1, eventId: updated.id, sampleData: false, snapshots: [...previousSnapshots, snapshot] };
  return { bundle: publicBundle({ format: 'buildergame/v1', event: updated, history }), failures };
}
