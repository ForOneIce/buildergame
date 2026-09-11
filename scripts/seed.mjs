import { mkdir, writeFile } from 'node:fs/promises';
import { sampleTown } from '../src/sample.mjs';
await mkdir('public/data', { recursive: true });
await writeFile('public/data/town.json', JSON.stringify(sampleTown(), null, 2), { flag: 'wx' });
console.log('Created fictional sample town. Existing data is never overwritten.');
