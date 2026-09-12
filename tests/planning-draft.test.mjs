import test from 'node:test';
import assert from 'node:assert/strict';
import { planningDraft } from '../src/planning-draft.mjs';
import { configuration } from '../src/bundle.mjs';

const blank = () => ({kind:'buildergame-plan/v1',collection:'personal',landscape:'flat',title:'',username:'',repoText:'',selected:[],weights:{commits:0,stars:0,forks:0},publish:false});

test('incomplete plans round-trip without requiring ready-to-capture data', () => {
  const input={...blank(),collection:'hackathon',repoText:'https://github.com/example/\nstill preparing',landscape:'clouds'};
  assert.deepEqual(planningDraft(JSON.parse(JSON.stringify(planningDraft(input)))),planningDraft(input));
  assert.equal(planningDraft(input).repoText,input.repoText);
  assert.equal(planningDraft(input).title,'');
});

test('drafts retain selection and publish opt-out but exclude unrelated fields', () => {
  const draft=planningDraft({...blank(),selected:['https://github.com/example/project'],token:'fixture-secret',session:{token:'fixture-secret'}});
  assert.deepEqual(draft.selected,['https://github.com/example/project']);
  assert.equal(draft.publish,false);
  assert.equal(JSON.stringify(draft).includes('fixture-secret'),false);
});

test('draft imports reject unsupported or malformed structured state', () => {
  for(const change of [{kind:'buildergame-plan/v2'},{collection:'other'},{landscape:'other'},{weights:{commits:-1,stars:1,forks:1}},{title:5},{selected:['https://example.com/repo']}]) {
    assert.throws(()=>planningDraft({...blank(),...change}));
  }
});

test('a plan can retain an imported custom growth configuration', () => {
  const event=configuration({name:'Example',repositories:['https://github.com/example/project'],rule:{mode:'custom',version:'custom-v1',weights:{commits:1,stars:3,forks:6},thresholds:[0,30,100,220,450]},customScores:{'https://github.com/example/project':88}});
  const result=planningDraft({...blank(),configuration:{...event,token:'fixture-secret'}});
  assert.equal(result.configuration.rule.mode,'custom');
  assert.equal(result.configuration.customScores['https://github.com/example/project'],88);
  assert.equal(result.configuration.token,undefined);
});
