import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleTown } from '../src/sample.mjs';
import { defaultRule, configuration, publicBundle, assertAppend } from '../src/bundle.mjs';
import { calculate, makeRecord, validateManifest, validateSnapshots } from '../src/model.mjs';
import { capture, commitTotal, observe } from '../server/github.mjs';

test('cumulative work does not decay with time and unknown is not empty',()=>{
 const project=sampleTown().event.projects[0], metrics={commits:45,stars:10,forks:3};
 const first=makeRecord(project,metrics,defaultRule,'2026-09-01T00:00:00Z');
 const later=makeRecord(project,metrics,defaultRule,'2026-09-11T00:00:00Z');
 assert.equal(first.stage,later.stage);assert.equal(makeRecord(project,null,defaultRule,'later',first).stage,first.stage);
 assert.equal(makeRecord(project,null,defaultRule,'later').stage,null);assert.equal(calculate({commits:0,stars:0,forks:0},defaultRule).stage,'land');
 assert.equal(first.score,93);
});
test('snapshot backup round trips and drops unknown credentials',()=>{
 const b=sampleTown();b.token='do-not-export';b.event.projects[0].builder.access_token='do-not-export';b.history.snapshots[0].projects[0].metrics.secret='do-not-export';
 const exported=publicBundle(b);assert.doesNotThrow(()=>validateSnapshots(exported.event,exported.history));assert.equal(JSON.stringify(exported).includes('do-not-export'),false);
 assert.deepEqual(publicBundle(JSON.parse(JSON.stringify(exported))),exported);
});
test('rewriting recorded state or moving plots is rejected',()=>{
 const b=sampleTown(), next=structuredClone(b);next.history.snapshots[0].label='Changed';assert.throws(()=>assertAppend(b,next));
 const moved=structuredClone(b);moved.event.projects[0].plot.x=50;assert.throws(()=>publicBundle(moved));
 const unsorted=structuredClone(b);unsorted.history.snapshots.reverse();assert.throws(()=>publicBundle(unsorted));
});
test('invalid weights, duplicate repos, and incomplete custom tables fail',()=>{
 const b=sampleTown();b.event.rule.weights.extra=5;assert.throws(()=>validateManifest(b.event));
 const c=sampleTown();c.event.projects[1].repository=c.event.projects[0].repository.toUpperCase().replace('HTTPS','https');assert.throws(()=>validateManifest(c.event));
 const d=sampleTown();d.event.rule.mode='custom';d.event.customScores={};assert.throws(()=>validateManifest(d.event));
});
test('full commit count uses pagination total, not one returned page',()=>{
 assert.equal(commitTotal([{sha:'a'}],'<https://api.github.com/repos/a/b/commits?per_page=1&page=732>; rel="last"'),732);
 assert.equal(commitTotal([{sha:'a'}],null),1);assert.equal(commitTotal([],null),0);
 assert.throws(()=>commitTotal([{sha:'a'}],'<https://api.github.com/repos/a/b/commits?page=2>; rel="next"'));
});
const response=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers});
test('public repository capture appends real observations and carries failures forward',async()=>{
 const event=configuration({name:'Test',repositories:['https://github.com/a/one','https://github.com/b/two']});
 const fetcher=async url=>url.includes('/commits?')?response([{sha:'head'}],200,{link:'<https://api.github.com/repos/a/one/commits?per_page=1&page=123>; rel="last"'}):response({name:'repo',private:false,size:10,default_branch:'main',stargazers_count:7,forks_count:3,owner:{avatar_url:'https://avatars.githubusercontent.com/u/1'}});
 const first=await capture(event,null,'server-token',fetcher);assert.equal(first.bundle.history.snapshots[0].projects[0].metrics.commits,123);
 const serialized=JSON.stringify(first.bundle);await new Promise(r=>setTimeout(r,5));
 const second=await capture(first.bundle.event,first.bundle.history,'server-token',url=>url.includes('/b/two')?response({},403):fetcher(url));
 assert.equal(second.bundle.history.snapshots.length,2);assert.equal(second.bundle.history.snapshots[1].projects[1].status,'stale');assert.equal(JSON.stringify(first.bundle),serialized);assert.equal(JSON.stringify(second.bundle).includes('server-token'),false);
});
test('private and inaccessible repositories do not become zero commits',async()=>{
 await assert.rejects(observe('https://github.com/a/private','t',async()=>response({private:true})),/public/);
 await assert.rejects(observe('https://github.com/a/missing',null,async()=>response({},404)));
 const event=configuration({name:'Empty',repositories:['https://github.com/a/missing']});await assert.rejects(capture(event,null,null,async()=>response({},404)),/No repositories/);
});
