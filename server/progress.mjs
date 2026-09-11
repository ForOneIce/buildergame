import {createHash,randomBytes} from 'node:crypto';
import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';

export function progressStore(directory) {
  let queue=Promise.resolve();
  const path=(login,town)=>join(directory,createHash('sha256').update(login.toLowerCase()+'\0'+town).digest('hex')+'.json');
  async function read(login,town) {
    try{return JSON.parse(await readFile(path(login,town),'utf8'));}
    catch(e){if(e.code==='ENOENT')return {visited:[]};throw new Error('Exploration storage is unavailable');}
  }
  return {read,visit(login,town,id){
    const task=queue.then(async()=>{const previous=await read(login,town);const visited=[...new Set([...previous.visited,id])].slice(-200);
      const result={visited,updatedAt:new Date().toISOString()};await mkdir(directory,{recursive:true});
      const file=path(login,town),temporary=file+'.'+randomBytes(8).toString('hex')+'.tmp';
      await writeFile(temporary,JSON.stringify(result));await rename(temporary,file);return result;});
    queue=task.catch(()=>{});return task;
  }};
}
