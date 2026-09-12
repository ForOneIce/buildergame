import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleTown} from '../src/sample.mjs';
import {configuration,publicBundle,assertAppend} from '../src/bundle.mjs';
import {groundHeight,plotPosition} from '../src/landscape.mjs';

test('initial collections expand without collisions or changing earlier plot assignments',()=>{
 let previous=[];
 for(const count of [1,9,50,200]){
  const event=configuration({name:'Generated town',repositories:Array.from({length:count},(_,i)=>`https://github.com/example/repo-${i}`)});
  const plots=event.projects.map(p=>p.plot);
  assert.deepEqual(plots.slice(0,previous.length),previous);
  const occupied=new Set(plots.map(p=>`${p.x},${p.z}`));assert.equal(occupied.size,count);
  // The actual configuration generator produces a connected street grid.
  for(const p of plots.slice(1))assert.ok([[1,0],[-1,0],[0,1],[0,-1]].some(([x,z])=>occupied.has(`${p.x+x},${p.z+z}`)));
  for(const mode of ['flat','valley','clouds']){
   const positions=plots.map(p=>plotPosition(p,mode));
   assert.equal(new Set(positions.map(p=>`${p.x},${p.y},${p.z}`)).size,count);
   assert.ok(positions.every(p=>Object.values(p).every(Number.isFinite)));
  }
  previous=plots;
 }
});
test('landscape round-trips, defaults to flat and cannot change inside a town',()=>{
 const b=sampleTown();assert.doesNotThrow(()=>publicBundle(b));
 for(const landscape of ['flat','valley','clouds']){const copy=structuredClone(b);copy.event.landscape=landscape;assert.equal(publicBundle(copy).event.landscape,landscape);if(landscape!=='flat')assert.throws(()=>assertAppend(b,copy),/Landscape is fixed/);}
 const bad=structuredClone(b);bad.event.landscape='random';assert.throws(()=>publicBundle(bad),/landscape/);
 assert.equal(configuration({name:'Valley',landscape:'valley',repositories:['https://github.com/example/project']}).landscape,'valley');
});
test('building pads are level, district elevations deterministic and flat mode uniform',()=>{
 for(const mode of ['flat','valley','clouds'])for(const plot of [{x:0,z:0},{x:-1,z:2},{x:4,z:3}]){
  const p=plotPosition(plot,mode);assert.deepEqual(p,plotPosition(plot,mode));
  if(mode==='flat')assert.equal(p.y,0);
  if(mode==='valley')for(const x of [-4.7,4.7])for(const z of [-4.7,4.7])assert.ok(Math.abs(groundHeight(p.x+x,p.z+z,mode)-p.y)<1e-8);
 }
 assert.notEqual(plotPosition({x:0,z:0},'clouds').y,plotPosition({x:2,z:0},'clouds').y);
});
