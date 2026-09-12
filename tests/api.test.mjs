import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApi } from '../server/api.mjs';
import { configuration } from '../src/bundle.mjs';

test('OAuth state, deployer default publishing, public viewing and token-free exports',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'buildergame-test-'));let api;const server=createServer((req,res)=>api(req,res));
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
 const fake=async(url,init)=>{
   if(url.includes('access_token'))return Response.json({access_token:'secret-only-on-server'});
   if(url.endsWith('/user'))return Response.json({login:'owner',id:1});
   if(url.includes('/commits?'))return Response.json([{sha:'head'}]);
   return Response.json({name:'project',private:false,default_branch:'main',size:1,stargazers_count:10,forks_count:2,owner:{avatar_url:'https://avatars.githubusercontent.com/u/1'}});
 };
 api=createApi({PUBLIC_ORIGIN:origin,GITHUB_CLIENT_ID:'client',GITHUB_CLIENT_SECRET:'secret',GITHUB_ALLOWED_LOGIN:'owner',TOWN_DATA_FILE:join(dir,'town.json')},{fetcher:fake});
 try{
   const event=configuration({name:'Public town',repositories:['https://github.com/owner/project']});
   const post=(path,data,cookie='',requestOrigin=origin)=>fetch(`${origin}/api/${path}`,{method:'POST',headers:{origin:requestOrigin,'content-type':'application/json',cookie},body:JSON.stringify(data)});
   assert.equal((await post('capture',{event,publish:true})).status,401);
   assert.equal((await post('capture',{event},'','https://hostile.example')).status,403);
   const login=await fetch(`${origin}/api/auth/login`,{redirect:'manual'});const state=new URL(login.headers.get('location')).searchParams.get('state');
   assert.match(login.headers.get('set-cookie'),/HttpOnly; SameSite=Lax/);
   assert.equal(new URL(login.headers.get('location')).searchParams.get('scope'),'');
   const invalid=await fetch(`${origin}/api/auth/callback?state=bad&code=code`,{redirect:'manual'});assert.equal(invalid.status,400);
   const callback=await fetch(`${origin}/api/auth/callback?state=${state}&code=code`,{headers:{cookie:`bg_state=${state}`},redirect:'manual'});assert.equal(callback.status,302);
   const cookie=callback.headers.getSetCookie()[0].split(';')[0];assert.equal(cookie.includes('secret-only'),false);
   const save=await post('capture',{event,publish:true},cookie);assert.equal(save.status,200);const result=await save.json();assert.equal(result.published,true);
   const anonymous=await fetch(`${origin}/api/town`);const town=await anonymous.json();assert.equal(town.event.name,'Public town');assert.equal(JSON.stringify(town).includes('secret-only'),false);
   assert.equal((await readFile(join(dir,'town.json'),'utf8')).includes('secret-only'),false);
   assert.equal((await post('capture',{event,publish:true},cookie)).status,409);
   const expiredState=await fetch(`${origin}/api/auth/callback?state=${state}&code=code`,{headers:{cookie:`bg_state=${state}`},redirect:'manual'});assert.equal(expiredState.status,400);
   await post('auth/logout',{},cookie);assert.equal((await post('capture',{event,publish:true},cookie)).status,401);
 }finally{await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
