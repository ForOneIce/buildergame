import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildStaticTowns } from '../scripts/static-towns.mjs';
import { configuration } from '../src/bundle.mjs';
import { baselineSnapshot, makeRecord } from '../src/model.mjs';

function town(name='Maple',slug='maple-20260912-100000000'){
  const event=configuration({name,repositories:['https://github.com/example/project']});
  event.deployment={slug,createdAt:'2026-09-12T10:00:00.000Z'};
  return {format:'buildergame/v1',event,history:{schemaVersion:1,eventId:event.id,sampleData:false,snapshots:[baselineSnapshot(event,event.deployment.createdAt),{id:'capture-1',kind:'capture',label:'Launch',capturedAt:'2026-09-12T10:00:01.000Z',projects:event.projects.map(p=>makeRecord(p,{commits:10,stars:2,forks:1},event.rule,'2026-09-12T10:00:01.000Z'))}]}};
}
async function fixture(t){const directory=await mkdtemp(join(tmpdir(),'buildergame-static-'));t.after(()=>rm(directory,{recursive:true,force:true}));await mkdir(join(directory,'data','towns'),{recursive:true});await writeFile(join(directory,'index.html'),'<html><head><script type="module" src="./assets/app.js"></script></head></html>');return directory;}

test('static routes export canonical data and resolve assets from a GitHub Pages subpath',async t=>{
  const directory=await fixture(t),bundle=town(),slug=bundle.event.deployment.slug;
  bundle.secret='must-not-export';await writeFile(join(directory,'data','towns',slug+'.json'),JSON.stringify(bundle));
  const list=await buildStaticTowns(directory);assert.equal(list.length,1);
  const html=await readFile(join(directory,'towns',slug,'index.html'),'utf8');assert.match(html,/<base href="\.\.\/\.\.\/">/);
  const base=new URL('../../','https://example.github.io/buildergame/towns/'+slug+'/');assert.equal(new URL('./assets/app.js',base).href,'https://example.github.io/buildergame/assets/app.js');
  const exported=JSON.parse(await readFile(join(directory,'data','towns',slug+'.json'),'utf8'));assert.equal(exported.secret,undefined);assert.equal(exported.history.snapshots.length,2);
  assert.equal(JSON.parse(await readFile(join(directory,'data','towns','index.json'),'utf8')).towns[0].slug,slug);
  assert.match(await readFile(join(directory,'LICENSE'),'utf8'),/Noncommercial/);
});

test('static build rejects conflicting town names and mismatched backup filenames',async t=>{
  const directory=await fixture(t),one=town(),two=town('  MAPLE  ','maple-other');
  await writeFile(join(directory,'data','towns',one.event.deployment.slug+'.json'),JSON.stringify(one));
  await writeFile(join(directory,'data','towns',two.event.deployment.slug+'.json'),JSON.stringify(two));
  await assert.rejects(buildStaticTowns(directory),/Duplicate town name/);
  two.event.name='Oak';two.event.deployment.slug='not-the-file';await writeFile(join(directory,'data','towns','maple-other.json'),JSON.stringify(two));
  await assert.rejects(buildStaticTowns(directory),/filename does not match/);
});

test('legacy default output is sanitized and offset timestamps become canonical deployment metadata',async t=>{
  const directory=await fixture(t),bundle=town();delete bundle.event.deployment;
  bundle.history.snapshots[0].capturedAt='2026-09-12T18:00:00+08:00';bundle.access_token='legacy-field-must-not-ship';
  await writeFile(join(directory,'data','town.json'),JSON.stringify(bundle));
  const [entry]=await buildStaticTowns(directory);
  const legacy=JSON.parse(await readFile(join(directory,'data','town.json'),'utf8'));
  assert.equal(legacy.access_token,undefined);assert.equal(legacy.event.deployment.createdAt,'2026-09-12T10:00:00.000Z');
  const routed=JSON.parse(await readFile(join(directory,'data','towns',entry.slug+'.json'),'utf8'));assert.equal(routed.access_token,undefined);
});
