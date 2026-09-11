// Shared browser / capture contract. 中文：数据失败不等于零，历史快照不重算。
export const STAGES = ['land', 'foundation', 'frame', 'cottage', 'townhouse', 'decorated'];
export function assert(condition, message) {
  if (!condition) throw new Error(message);
}
export function safeUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
export function repositoryKey(value) {
  const url = new URL(value);
  assert(url.protocol === 'https:' && url.hostname === 'github.com' && !url.username && !url.password && !url.search && !url.hash, `Invalid GitHub repository: ${value}`);
  const parts = url.pathname.replace(/\/$/, '').split('/').filter(Boolean);
  assert(parts.length === 2 && parts.every(p => /^[\w.-]+$/.test(p)), `Expected owner/repository: ${value}`);
  return parts.join('/').replace(/\.git$/, '').toLowerCase();
}
function finiteCount(n) { return Number.isSafeInteger(n) && n >= 0; }
export function validateRule(rule) {
  assert(rule && typeof rule.version === 'string' && rule.version.length, 'Rule version is required');
  assert(['weighted', 'commits', 'stars', 'custom'].includes(rule.mode), 'Unknown rule mode');
  assert(Array.isArray(rule.thresholds) && rule.thresholds.length === 5 && rule.thresholds[0] === 0 && rule.thresholds.every((n, i, a) => Number.isFinite(n) && n >= 0 && (!i || n > a[i - 1])), 'Provide five increasing thresholds starting at zero');
  if (rule.mode === 'weighted') assert(rule.weights && Object.keys(rule.weights).length === 3 && ['commits', 'stars', 'forks'].every(k => Number.isFinite(rule.weights[k]) && rule.weights[k] >= 0) && Object.values(rule.weights).some(n => n > 0), 'Invalid metric weights');
}
export function validateManifest(event) {
  assert(event && event.schemaVersion === 1 && typeof event.id === 'string' && event.id.length && typeof event.name === 'string' && event.name.length, 'Event id, name and schemaVersion 1 are required');
  assert(typeof event.sampleData === 'boolean', 'sampleData flag is required');
  assert(['static', 'live'].includes(event.mode), 'Event mode must be static or live');
  assert(Array.isArray(event.projects) && event.projects.length > 0 && event.projects.length <= 200, 'Provide 1–200 projects');
  assert(Number.isFinite(event.refreshSeconds) && event.refreshSeconds >= 30, 'refreshSeconds must be at least 30');
  validateRule(event.rule);
  assert(!event.collectionType || ['personal', 'hackathon'].includes(event.collectionType), 'Invalid collection type');
  const ids = new Set(), repos = new Set(), plots = new Set();
  for (const p of event.projects) {
    assert(typeof p.id === 'string' && /^[a-z0-9-]+$/.test(p.id) && !ids.has(p.id), `Invalid/duplicate project id: ${p.id}`);
    const repo = repositoryKey(p.repository);
    assert(!repos.has(repo), `Duplicate repository: ${repo}`);
    assert(p.plot && Number.isInteger(p.plot.x) && Number.isInteger(p.plot.z) && Math.abs(p.plot.x) <= 50 && Math.abs(p.plot.z) <= 50, `Invalid plot: ${p.id}`);
    const key = `${p.plot.x},${p.plot.z}`;
    assert(!plots.has(key), `Duplicate plot: ${key}`);
    assert(typeof p.name === 'string' && p.name.length && typeof p.description === 'string' && p.builder && typeof p.builder.name === 'string', `Missing project text: ${p.id}`);
    for (const link of [p.homepage, p.builder.url, p.builder.avatar]) assert(!link || safeUrl(link), `Unsafe link: ${p.id}`);
    ids.add(p.id); repos.add(repo); plots.add(key);
  }
  if (event.rule.mode === 'custom') {
    assert(event.customScores && typeof event.customScores === 'object', 'Custom scores are required');
    const scores = new Map();
    for (const [url, score] of Object.entries(event.customScores)) {
      const key = repositoryKey(url);
      assert(!scores.has(key) && repos.has(key) && Number.isFinite(score) && score >= 0, `Invalid, duplicate or unmatched custom score: ${url}`);
      scores.set(key, score);
    }
    for (const repo of repos) assert(scores.has(repo), `Missing custom score: ${repo}`);
  }
  return event;
}
export function calculate(metrics, rule, customScore) {
  validateRule(rule);
  assert(metrics && ['commits', 'stars', 'forks'].every(k => finiteCount(metrics[k])), 'Invalid cumulative metrics');
  const score = rule.mode === 'weighted' ? Object.entries(rule.weights).reduce((sum, [key, weight]) => sum + metrics[key] * weight, 0)
    : rule.mode === 'custom' ? customScore : metrics[rule.mode];
  assert(Number.isFinite(score) && score >= 0, 'Invalid effective score');
  if (metrics.commits === 0) return { score, stage: 'land' };
  const level = rule.thresholds.filter(n => score >= n).length;
  return { score, stage: STAGES[level] };
}
export function makeRecord(project, metrics, rule, observedAt, previous, customScore) {
  if (!metrics) return previous?.metrics ? { ...structuredClone(previous), status: 'stale' }
    : { projectId: project.id, plot: { ...project.plot }, status: 'unknown', observedAt: null, metrics: null, score: null, stage: null, rule: null };
  return { projectId: project.id, plot: { ...project.plot }, status: 'fresh', observedAt, metrics, ...calculate(metrics, rule, customScore), rule: structuredClone(rule) };
}
export function validateSnapshots(event, history) {
  validateManifest(event);
  assert(history?.schemaVersion === 1 && history.eventId === event.id && history.sampleData === event.sampleData && Array.isArray(history.snapshots) && history.snapshots.length, 'Snapshot event/sample/schema mismatch or empty history');
  const ids = new Set(); let lastTime = -Infinity;
  for (const snapshot of history.snapshots) {
    assert(typeof snapshot.id === 'string' && snapshot.id.length && !ids.has(snapshot.id), 'Duplicate/invalid snapshot id'); ids.add(snapshot.id);
    const time = Date.parse(snapshot.capturedAt);
    assert(Number.isFinite(time) && time > lastTime, 'Snapshots must have increasing timestamps'); lastTime = time;
    assert(Array.isArray(snapshot.projects) && snapshot.projects.length === event.projects.length, 'Snapshot must cover every project');
    const records = new Set();
    for (const record of snapshot.projects) {
      const p = event.projects.find(p => p.id === record.projectId);
      assert(p && !records.has(p.id), 'Unknown or duplicate snapshot project'); records.add(p.id);
      assert(record.plot?.x === p.plot.x && record.plot?.z === p.plot.z, `Plot moved: ${p.id}`);
      assert(['fresh', 'stale', 'unknown'].includes(record.status), 'Invalid observation status');
      if (record.status === 'unknown') {
        assert(record.metrics === null && record.score === null && record.stage === null && record.observedAt === null && record.rule === null, 'Unknown observations must not invent data');
      } else {
        assert(Number.isFinite(Date.parse(record.observedAt)) && Date.parse(record.observedAt) <= time, 'Invalid observation time');
        const result = calculate(record.metrics, record.rule, record.score);
        assert(result.score === record.score && result.stage === record.stage, 'Saved stage/score does not match its recorded rule');
      }
    }
  }
  return history;
}
