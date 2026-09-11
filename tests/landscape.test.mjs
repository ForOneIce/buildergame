import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleTown} from '../src/sample.mjs';
import {configuration,publicBundle,assertAppend} from '../src/bundle.mjs';
import {groundHeight,plotPosition} from '../src/landscape.mjs';
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
