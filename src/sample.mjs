import { defaultRule } from './bundle.mjs';
import { makeRecord } from './model.mjs';
const names = ['Open Orchard', 'Little Atlas', 'Cloud Notes', 'Garden Kit', 'Kindred', 'Moon Studio', 'Paper Trail', 'Seedling', 'First Bricks'];
export function sampleTown() {
  const rule = structuredClone(defaultRule);
  const projects = names.map((name, i) => ({ id: `sample-${i}`, name, repository: `https://github.com/example/sample-${i}`, description: ['A place to collect ideas and grow them together.', 'Small tools for a more curious internet.', 'An experiment becoming a little more real.'][i % 3], color: ['#477eae', '#508dc0', '#476b9b'][i % 3], plot: { x: i % 4, z: Math.floor(i / 4) }, builder: { name: ['Maple', 'River', 'Sunny', 'Juniper'][i % 4], bio: 'Fictional builder in the sample neighborhood.' } }));
  const event = { schemaVersion: 1, id: 'sample-town', name: 'The Builder Neighborhood', subtitle: 'Small steps. A world of possibilities.', url: '', sampleData: true, collectionType: 'hackathon', mode: 'static', refreshSeconds: 300, rule, projects };
  const counts = [[0, 4, 22, 42, 12, 70, 0, 140, 2], [0, 16, 35, 65, 50, 100, 8, 200, 5], [0, 22, 45, 120, 75, 150, 20, 230, 8]];
  const snapshots = counts.map((commits, j) => {
    const capturedAt = `2026-09-${String(5 + j * 2).padStart(2, '0')}T12:00:00.000Z`;
    // Fictional starter keeps the foundation visible without changing growth rules.
    return { id: `sample-day-${j}`, label: ['First foundations', 'Finding our rhythm', 'A neighborhood in bloom'][j], capturedAt, projects: projects.map((p, i) => makeRecord(p, { commits: commits[i], stars: p.id === 'sample-8' ? j : commits[i] ? i * 4 + j * 5 : 0, forks: p.id === 'sample-8' ? 0 : commits[i] ? Math.floor(i * (j + 1) * 1.6) : 0 }, rule, capturedAt)) };
  });
  return { format: 'buildergame/v1', event, history: { schemaVersion: 1, eventId: event.id, sampleData: true, snapshots } };
}
