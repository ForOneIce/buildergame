import { readFile } from 'node:fs/promises';
import { publicBundle } from '../src/bundle.mjs';
const bundle = publicBundle(JSON.parse(await readFile(process.argv[2] || 'public/data/town.json', 'utf8')));
console.log(`Valid town: ${bundle.event.projects.length} projects, ${bundle.history.snapshots.length} snapshots, sample=${bundle.event.sampleData}`);
