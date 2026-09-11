import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../public/models/',import.meta.url);
const lock=JSON.parse(await readFile(new URL('buildings.lock.json',root),'utf8'));
for(const [file,hash] of Object.entries(lock.sha256)) {
  const actual=createHash('sha256').update(await readFile(new URL(file,root))).digest('hex');
  if(actual!==hash)throw new Error(`Locked building changed: ${file}`);
}
console.log('Accepted building assets unchanged (10 GLBs).');
