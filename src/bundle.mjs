import { assert, validateManifest, validateSnapshots } from './model.mjs';
import { plotAt } from './landscape.mjs';
export const defaultRule = { version: 'linear-v1', mode: 'weighted', weights: { commits: 1, stars: 3, forks: 6 }, thresholds: [0, 30, 100, 220, 450] };
export function configuration({ name, collectionType = 'hackathon', landscape = 'flat', repositories, projects = undefined, rule = defaultRule, customScores = undefined }) {
  const list = projects || repositories.map((repository, i) => ({ id: `plot-${i}`, name: repository.split('/').at(-1), repository, description: '', color: '#427baa', plot: plotAt(i), builder: { name: repository.split('/').at(-2), url: repository.split('/').slice(0, 4).join('/') } }));
  return validateManifest({ schemaVersion: 1, id: `town-${crypto.randomUUID()}`, name, subtitle: '', url: '', sampleData: false, collectionType, landscape, mode: 'static', refreshSeconds: 300, rule, projects: list, ...(customScores ? { customScores } : {}) });
}
function only(object, keys) { return Object.fromEntries(keys.filter(k => object[k] !== undefined).map(k => [k, object[k]])); }
function cleanRule(rule) { return rule ? { ...only(rule, ['version', 'mode', 'thresholds']), ...(rule.weights ? { weights: only(rule.weights, ['commits', 'stars', 'forks']) } : {}) } : null; }
export function cleanEvent(event) {
  validateManifest(event);
  const mapEnabled=event.collectionType!=='personal'&&event.residentMap?.enabled;
  return { ...only(event, ['schemaVersion', 'id', 'name', 'subtitle', 'url', 'sampleData', 'collectionType', 'landscape', 'mode', 'refreshSeconds', 'customScores']), ...(event.deployment?{deployment:only(event.deployment,['slug','createdAt'])}:{}), ...(event.residentMap?{residentMap:{enabled:Boolean(mapEnabled),fetchProfiles:Boolean(mapEnabled&&event.residentMap.fetchProfiles)}}:{}),rule: cleanRule(event.rule), projects: event.projects.map(p => ({ ...only(p, ['id', 'name', 'repository', 'description', 'homepage', 'color']), plot: only(p.plot, ['x', 'z']), builder: {...only(p.builder, ['name', 'bio', 'url', 'avatar', 'followers']),...(mapEnabled?{...(p.builder.locationText?{locationText:p.builder.locationText}:{}),...(p.builder.location?{location:only(p.builder.location,['label','lat','lon','source'])}:{})}:{})} })) };
}
// Export only the public schema, never arbitrary import fields or OAuth session data.
export function publicBundle(input) {
  assert(input?.format === 'buildergame/v1', 'Expected a buildergame/v1 backup');
  validateSnapshots(input.event, input.history);
  const event = cleanEvent(input.event);
  const history = { schemaVersion: 1, eventId: event.id, sampleData: event.sampleData, snapshots: input.history.snapshots.map(s => ({ ...only(s, ['id', 'kind', 'label', 'capturedAt']), projects: s.projects.map(r => ({ ...only(r, ['projectId', 'status', 'observedAt', 'score', 'stage']), plot: only(r.plot, ['x', 'z']), rule: cleanRule(r.rule), metrics: r.metrics ? only(r.metrics, ['commits', 'stars', 'forks', 'headOid', 'reference']) : null })) })) };
  return { format: 'buildergame/v1', event, history };
}
export function assertAppend(previous, next) {
  if (!previous || previous.event.id !== next.event.id) return;
  assert(previous.event.name === next.event.name, 'Town name is fixed after creation');
  if (previous.event.deployment) assert(next.event.deployment && previous.event.deployment.slug === next.event.deployment.slug && previous.event.deployment.createdAt === next.event.deployment.createdAt, 'Deployment identity is fixed for this town');
  if ((previous.event.landscape ?? 'flat') !== (next.event.landscape ?? 'flat')) throw new Error('Landscape is fixed for this town. Create a new town to choose another landscape.');
  assert(previous.event.sampleData === next.event.sampleData, 'Cannot replace sample history with real data');
  const identity = e => e.projects.map(p => [p.id, p.repository.toLowerCase(), p.plot.x, p.plot.z]).sort((a,b) => a[0].localeCompare(b[0]));
  assert(JSON.stringify(identity(previous.event)) === JSON.stringify(identity(next.event)), 'A changed repository collection must start a new town');
  assert(next.history.snapshots.length >= previous.history.snapshots.length, 'Cannot remove published history');
  previous.history.snapshots.forEach((s,i) => assert(JSON.stringify(s) === JSON.stringify(next.history.snapshots[i]), 'Cannot rewrite published history'));
}
