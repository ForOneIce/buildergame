import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtemp,readdir,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createApi} from '../server/api.mjs';
test('GitHub sign-in returns to safe town/setup paths; exploration never writes server state',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'bg-player-'));const file=join(dir,'town.json');
 let handler;const server=createServer((req,res)=>handler(req,res));await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
 const env={PUBLIC_ORIGIN:origin,GITHUB_CLIENT_ID:'test',GITHUB_CLIENT_SECRET:'test',TOWN_DATA_FILE:file,PLAYER_DATA_DIR:join(dir,'players')};
 const fetcher=async url=>url.includes('access_token')?Response.json({access_token:'private-token'}):Response.json({login:'visitor',id:10,avatar_url:'https://avatars.githubusercontent.com/u/1'});
 handler=createApi(env,{fetcher});
 const login=async(returnTo,expected)=>{const r=await fetch(origin+'/api/auth/login?role=player&returnTo='+encodeURIComponent(returnTo),{redirect:'manual'});const state=new URL(r.headers.get('location')).searchParams.get('state');const result=await fetch(origin+`/api/auth/callback?state=${state}&code=test`,{headers:{cookie:`bg_state=${state}`},redirect:'manual'});assert.equal(result.status,302);assert.equal(result.headers.get('location'),expected);return result.headers.getSetCookie()[0].split(';')[0];};
 const post=(path,data,cookie)=>fetch(origin+'/api/'+path,{method:'POST',headers:{origin,cookie,'Content-Type':'application/json'},body:JSON.stringify(data)});
 try{
  const cookie=await login('/towns/garden-20260913/','/towns/garden-20260913/');
  await login('/?setup=personal','/?setup=personal');
  for(const unsafe of ['https://hostile.example/','//hostile.example/','/\\hostile.example/','/api/auth/logout','/towns/garden/?redirect=https://hostile.example'])await login(unsafe,'/?town=1');
  const session=await(await fetch(origin+'/api/session',{headers:{cookie}})).json();assert.equal(session.canPublish,true);assert.equal(session.isDeployer,false);assert.ok(session.avatar);assert.equal(JSON.stringify(session).includes('private-token'),false);
  assert.equal((await fetch(origin+'/api/progress?town=anything',{headers:{cookie}})).status,410);
  assert.equal((await post('progress',{townId:'anything',projectId:'project'},cookie)).status,410);
  assert.deepEqual(await readdir(dir),[]);
 }finally{await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
