import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createApi} from '../server/api.mjs';
import {sampleTown} from '../src/sample.mjs';
test('player OAuth cannot publish; visits persist privately and accounts stay isolated',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'bg-player-'));const file=join(dir,'town.json');await writeFile(file,JSON.stringify(sampleTown()));
 let handler,user='visitor';const server=createServer((req,res)=>handler(req,res));await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
 const env={PUBLIC_ORIGIN:origin,GITHUB_CLIENT_ID:'test',GITHUB_CLIENT_SECRET:'test',GITHUB_ALLOWED_LOGIN:'owner',TOWN_DATA_FILE:file,PLAYER_DATA_DIR:join(dir,'players')};
 const fetcher=async url=>url.includes('access_token')?Response.json({access_token:'private-token'}):Response.json({login:user,avatar_url:'https://avatars.githubusercontent.com/u/1'});
 handler=createApi(env,{fetcher});
 const login=async()=>{const r=await fetch(origin+'/api/auth/login?role=player',{redirect:'manual'});const state=new URL(r.headers.get('location')).searchParams.get('state');const result=await fetch(origin+`/api/auth/callback?state=${state}&code=test`,{headers:{cookie:`bg_state=${state}`},redirect:'manual'});assert.equal(result.headers.get('location'),'/?town=1');return result.headers.getSetCookie()[0].split(';')[0];};
 const post=(path,data,cookie)=>fetch(origin+'/api/'+path,{method:'POST',headers:{origin,cookie,'Content-Type':'application/json'},body:JSON.stringify(data)});
 try{
  const cookie=await login();const session=await(await fetch(origin+'/api/session',{headers:{cookie}})).json();assert.equal(session.isDeployer,false);assert.ok(session.avatar);assert.equal(JSON.stringify(session).includes('private-token'),false);
  assert.equal((await post('capture',{publish:true},cookie)).status,403);
  assert.equal((await post('progress',{townId:'sample-town',projectId:'missing'},cookie)).status,400);
  await Promise.all(['sample-0','sample-1','sample-0'].map(projectId=>post('progress',{townId:'sample-town',projectId},cookie)));
  assert.equal((await(await fetch(origin+'/api/progress?town=sample-town',{headers:{cookie}})).json()).visited.length,2);
  handler=createApi(env,{fetcher});const restored=await login();assert.equal((await(await fetch(origin+'/api/progress?town=sample-town',{headers:{cookie:restored}})).json()).visited.length,2);
  user='another';const other=await login();assert.deepEqual((await(await fetch(origin+'/api/progress?town=sample-town',{headers:{cookie:other}})).json()).visited,[]);
  assert.equal((await fetch(origin+'/api/progress?town=sample-town')).status,401);
  assert.equal((await fetch(origin+'/api/progress?town=unknown',{headers:{cookie:other}})).status,404);
 }finally{await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
