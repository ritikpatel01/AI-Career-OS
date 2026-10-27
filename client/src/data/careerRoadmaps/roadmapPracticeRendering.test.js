import test from 'node:test';
import assert from 'node:assert/strict';
import {ROADMAPS} from './careerRoadmapData.js';
import {ROADMAP_PRACTICE_BATCHES} from './roadmapPracticeBatches.js';
import {normalizePracticeExercise,filterPracticeExercises,getPracticeCompletionKey} from './roadmapPracticeUtils.js';
const phase=ROADMAPS['Full Stack Developer'].phases.find(p=>p.title==='System Design');
const catalog=ROADMAP_PRACTICE_BATCHES['Full Stack Developer']['System Design'];
const key=item=>getPracticeCompletionKey(phase,item);

test('all 90 System Design exercises render optional lists without changing keys or associations',()=>{
    assert.equal(catalog.length,90);
    const before=JSON.stringify(catalog);
    for(const raw of catalog){
        const item=normalizePracticeExercise(raw);
        assert.equal(item.career,'Full Stack Developer');assert.equal(item.phase,'System Design');assert.ok(phase.topics.includes(item.topic));
        assert.equal(item.id,raw.id);assert.equal(key(item),key(raw));
        assert.deepEqual(item.prerequisites,[]);
        for(const field of ['prerequisites','conceptsToReview','requirements','examples','tests','hints','solutionLines','completionCriteria'])assert.ok(Array.isArray(item[field]));
        assert.equal(typeof item.difficulty.toLowerCase(),'string');
        assert.doesNotThrow(()=>item.prerequisites.map(String));
    }
    assert.equal(JSON.stringify(catalog),before);
    assert.equal(new Set(catalog.map(key)).size,90);
    for(const topic of phase.topics)for(const difficulty of ['Easy','Medium','Hard']) assert.equal(catalog.filter(e=>e.topic===topic&&e.difficulty===difficulty).length,3);
});
test('missing or malformed optional fields cannot reach unsafe list or object rendering',()=>{
    const item=normalizePracticeExercise({...catalog[0],prerequisites:null,conceptsToReview:{},requirements:'not-an-array',examples:[null,{}, {input:{x:1},output:0}],tests:[null,{name:{label:'test'},input:['a'],expected:false}],hints:[null,{},'hint'],solutionLines:null,completionCriteria:undefined,difficulty:42,complexity:{time:{value:1}},starterCode:{code:'x'}});
    assert.deepEqual(item.prerequisites,[]);assert.deepEqual(item.conceptsToReview,[]);assert.deepEqual(item.requirements,[]);
    assert.deepEqual(item.examples,[{input:'{"x":1}',output:'0',explanation:''}]);
    assert.deepEqual(item.hints,['hint']);assert.equal(item.difficulty,'42');assert.equal(typeof item.tests[0].input,'string');
    assert.equal(normalizePracticeExercise(null),null);assert.equal(normalizePracticeExercise({title:'No ID'}),null);
    assert.deepEqual(normalizePracticeExercise({id:'minimal'}).examples,[]);
    assert.doesNotThrow(()=>filterPracticeExercises({items:[null,{id:'minimal',conceptsToReview:{}}],completionKey:key}));
    assert.equal(key(normalizePracticeExercise({...catalog[0],legacyOutlineId:'saved-outline'})),'system-design::saved-outline');
});
test('empty results and selection fallback recover when filters and exercise IDs change',()=>{
    const items=catalog.map(normalizePracticeExercise);
    assert.deepEqual(filterPracticeExercises({items,search:'no-such-exercise-xyz',completionKey:key}),[]);
    const pick=(visible,id)=>visible.find(e=>e.id===id)||visible[0]||null;
    assert.equal(pick([],items[0].id),null);
    assert.equal(pick(items,items[1].id),items[1]);
    const hard=filterPracticeExercises({items,topic:'Caching',difficulty:'hard',completionKey:key});
    assert.equal(hard.length,3);assert.equal(pick(hard,items[0].id),hard[0]);
    assert.equal(filterPracticeExercises({items:hard,status:'completed',completedKeys:[key(hard[1])],completionKey:key})[0].id,hard[1].id);
    assert.equal(pick(items,hard[1].id).id,hard[1].id);
});
