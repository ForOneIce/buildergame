import { readFile, readdir, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { publicBundle } from '../src/bundle.mjs';
import { townDeployment, validTownSlug } from '../server/towns.mjs';

// Emit physical HTML pages, so direct links also work on static hosts. 静态子路径。
export async function buildStaticTowns(directory='dist') {
  const root=resolve(directory),data=join(root,'data'),towns=join(data,'towns');
  const html=await readFile(join(root,'index.html'),'utf8');
  const entries=[];let legacy;
  try{for(const entry of await readdir(towns,{withFileTypes:true}))if(entry.isFile()&&entry.name.endsWith('.json')&&entry.name!=='index.json')entries.push({file:join(towns,entry.name),slug:entry.name.slice(0,-5)});}catch(error){if(error.code!=='ENOENT')throw error;}
  try{legacy=publicBundle(JSON.parse(await readFile(join(data,'town.json'),'utf8')));if(!legacy.event.sampleData)entries.push({bundle:legacy,slug:legacy.event.deployment?.slug||townDeployment(legacy.event.name,new Date(legacy.history.snapshots[0].capturedAt)).slug});}catch(error){if(error.code!=='ENOENT')throw error;}
  const ids=new Map(),names=new Set(),slugs=new Set(),result=[];
  const prepared=[];
  for(const entry of entries){
    const bundle=entry.bundle||publicBundle(JSON.parse(await readFile(entry.file,'utf8'))),slug=entry.slug;
    if(!validTownSlug(slug)||slug==='index')throw Error('Invalid town filename: '+slug);
    if(bundle.event.deployment&&bundle.event.deployment.slug!==slug)throw Error('Town filename does not match deployment slug: '+slug);
    // The legacy default may point to the same immutable town file.
    if(ids.has(bundle.event.id)){if(entry.bundle&&ids.get(bundle.event.id)===slug)continue;throw Error('Duplicate town identity: '+bundle.event.id);}
    const name=bundle.event.name.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('en-US');
    if(names.has(name)||slugs.has(slug))throw Error('Duplicate town name or address: '+bundle.event.name);
    ids.set(bundle.event.id,slug);names.add(name);slugs.add(slug);
    bundle.event.deployment ||= {slug,createdAt:new Date(bundle.history.snapshots[0].capturedAt).toISOString()};
    prepared.push({bundle:publicBundle(bundle),slug});
  }
  await mkdir(towns,{recursive:true});
  if(legacy)await writeFile(join(data,'town.json'),JSON.stringify(publicBundle(legacy),null,2));
  for(const {bundle,slug} of prepared){
    const page=join(root,'towns',slug);await mkdir(page,{recursive:true});
    await writeFile(join(page,'index.html'),html.replace('<head>','<head><base href="../../">'));
    await writeFile(join(towns,slug+'.json'),JSON.stringify(bundle,null,2));
    result.push({slug,name:bundle.event.name,townId:bundle.event.id,path:`towns/${slug}/`,createdAt:bundle.event.deployment.createdAt,updatedAt:bundle.history.snapshots.at(-1).capturedAt});
  }
  await writeFile(join(towns,'index.json'),JSON.stringify({towns:result},null,2));
  // Carry terms with downloadable deployments as well as source checkouts.
  for(const name of ['LICENSE','NOTICE'])await copyFile(resolve(name),join(root,name));
  return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const towns=await buildStaticTowns(process.argv[2]);console.log(`Static town routes: ${towns.length}`);
}
