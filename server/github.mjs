import { repositoryKey, makeRecord, validateManifest, safeUrl } from '../src/model.mjs';
import { publicBundle, cleanEvent } from '../src/bundle.mjs';

export async function github(path, token, fetcher = fetch) {
  const response = await fetcher(`https://api.github.com${path}`, { headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'buildergame', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw Object.assign(new Error(response.status === 403 || response.status === 429 ? 'GitHub rate limit or access restriction. Wait and retry.' : `GitHub request failed (${response.status})`), { status: response.status });
  return { data: await response.json(), headers: response.headers };
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
export async function observe(repository, token, fetcher = fetch) {
  const key = repositoryKey(repository);
  const { data: repo } = await github(`/repos/${key}`, token, fetcher);
  if (repo.private || repo.visibility === 'private') throw new Error('Only public repositories are supported');
  let count = 0, headOid = null;
  try {
    const commits = await github(`/repos/${key}/commits?per_page=1&sha=${encodeURIComponent(repo.default_branch)}`, token, fetcher);
    count = commitTotal(commits.data, commits.headers.get('link')); headOid = commits.data[0]?.sha ?? null;
  } catch (error) { if (error.status !== 409 || repo.size !== 0) throw error; }
  return { repo, metrics: { commits: count, stars: repo.stargazers_count, forks: repo.forks_count, reference: repo.default_branch, headOid } };
}
export async function capture(event, previousHistory, token, fetcher = fetch) {
  validateManifest(event);
  if (event.sampleData) throw new Error('Create a real collection before fetching GitHub observations');
  const updated = cleanEvent(event); const records = [], failures = [];
  const observedAt = new Date().toISOString();
  const custom = Object.fromEntries(Object.entries(event.customScores || {}).map(([url, score]) => [repositoryKey(url), score]));
  // Bounded, sequential requests respect GitHub secondary limits.
  for (const p of updated.projects) {
    const old = previousHistory?.snapshots.at(-1)?.projects.find(r => r.projectId === p.id);
    try {
      const { repo, metrics } = await observe(p.repository, token, fetcher);
      p.name = repo.name; p.description = repo.description || p.description; p.homepage = safeUrl(repo.homepage) || p.homepage;
      if (!p.builder.avatar) p.builder.avatar = repo.owner.avatar_url;
      records.push(makeRecord(p, metrics, event.rule, observedAt, old, custom[repositoryKey(p.repository)]));
    } catch { failures.push(p.id); records.push(makeRecord(p, null, event.rule, observedAt, old)); }
  }
  if (failures.length === updated.projects.length) throw new Error('No repositories could be fetched. Check URLs, GitHub limits and access, then retry. Previous snapshots are unchanged.');
  const capturedAt = new Date().toISOString();
  const snapshot = { id: `snapshot-${crypto.randomUUID()}`, label: `Snapshot ${(previousHistory?.snapshots.length || 0) + 1}`, capturedAt, projects: records };
  const history = { schemaVersion: 1, eventId: updated.id, sampleData: false, snapshots: [...(previousHistory?.snapshots || []), snapshot] };
  return { bundle: publicBundle({ format: 'buildergame/v1', event: updated, history }), failures };
}
