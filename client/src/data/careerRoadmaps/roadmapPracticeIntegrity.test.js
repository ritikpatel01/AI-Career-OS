import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {ROADMAPS} from './careerRoadmapData.js';
import {ROADMAP_EXERCISES,buildLessonPracticeExercises} from './roadmapLearningContent.js';
import {ROADMAP_PRACTICE_BATCHES,ROADMAP_PRACTICE_BATCH_MANIFEST} from './roadmapPracticeBatches.js';
import {buildRoadmapPracticeCoverage,getExerciseContentIssues} from './roadmapPracticeCoverage.js';
import {normalizePracticeExercise,filterPracticeExercises,getPracticeCompletionKey} from './roadmapPracticeUtils.js';

test('raw registrations have no orphaned careers, phases, topics, or conflicting associations',()=>{
    const ids=new Set(),keys=new Set();let topics=0,phases=0,count=0;
    for(const registry of [ROADMAP_EXERCISES,ROADMAP_PRACTICE_BATCHES,ROADMAP_PRACTICE_BATCH_MANIFEST]){
        for(const [career,entries] of Object.entries(registry)){
            assert.ok(ROADMAPS[career],career);
            for(const title of Object.keys(entries))assert.ok(ROADMAPS[career].phases.some(p=>p.title===title),`${career}/${title}`);
        }
    }
    for(const [career,roadmap] of Object.entries(ROADMAPS))for(const phase of roadmap.phases){
        phases++;topics+=phase.topics.length;
        assert.equal(new Set(phase.topics).size,phase.topics.length);
        const batch=ROADMAP_PRACTICE_BATCHES[career]?.[phase.title]||[];
        if(batch.length)assert.deepEqual(ROADMAP_PRACTICE_BATCH_MANIFEST[career]?.[phase.title]?.topics,phase.topics);
        const raw=[...(ROADMAP_EXERCISES[career]?.[phase.title]||[]),...batch,...buildLessonPracticeExercises(career,phase.title,phase.topics)];
        const items=raw.map(exercise=>{
            assert.ok(phase.topics.includes(exercise.topic),exercise.id);
            if(exercise.career!==undefined)assert.equal(exercise.career,career,exercise.id);
            if(exercise.phase!==undefined)assert.equal(exercise.phase,phase.title,exercise.id);
            assert.ok(!ids.has(exercise.id),exercise.id);ids.add(exercise.id);count++;
            assert.deepEqual(getExerciseContentIssues({...exercise,career,phase:phase.title},exercise.topic),[],exercise.id);
            const item=normalizePracticeExercise(exercise);assert.ok(item);assert.equal(item.id,exercise.id);
            const outline=phase.practice.find(o=>o.id===item.id||o.title.toLowerCase()===item.title.toLowerCase());
            item.legacyOutlineId=outline?.id||null;
            const key=getPracticeCompletionKey(phase,item),scoped=JSON.stringify([career,key]);
            assert.ok(key.length<=180);assert.ok(!keys.has(scoped),scoped);keys.add(scoped);return item;
        });
        const completionKey=item=>getPracticeCompletionKey(phase,item);
        for(const topic of phase.topics)for(const difficulty of ['easy','medium','hard']){
            const selected=filterPracticeExercises({items,topic,difficulty,completionKey});assert.ok(selected.length>=3,`${career}/${phase.title}/${topic}/${difficulty}`);
            const completedKeys=[completionKey(selected[0])];assert.equal(filterPracticeExercises({items:selected,status:'completed',completedKeys,completionKey}).length,1);
            assert.equal(filterPracticeExercises({items:selected,status:'not-started',completedKeys,completionKey}).length,selected.length-1);
        }
        assert.equal(filterPracticeExercises({items,search:'no-catalog-match-843916',completionKey}).length,0);
        for(const item of items)assert.ok(filterPracticeExercises({items,search:item.title,completionKey}).some(e=>e.id===item.id));
    }
    assert.equal(Object.keys(ROADMAPS).length,4);assert.equal(phases,34);assert.equal(topics,285);assert.equal(count,2571);
});
test('checked-in coverage matches independently enumerated registered topic IDs',()=>{
    const report=buildRoadmapPracticeCoverage(),saved=JSON.parse(readFileSync(new URL('./roadmapPracticeCoverage.json',import.meta.url)));
    delete report.generatedAt;delete saved.generatedAt;assert.deepEqual(saved,report);
    for(const p of report.phases){
        const phase=ROADMAPS[p.career].phases.find(v=>v.title===p.phase);
        const raw=[...(ROADMAP_EXERCISES[p.career]?.[p.phase]||[]),...(ROADMAP_PRACTICE_BATCHES[p.career]?.[p.phase]||[]),...buildLessonPracticeExercises(p.career,p.phase,phase.topics)];
        for(const topic of p.topics)assert.deepEqual(topic.exercises.map(e=>e.id).sort(),raw.filter(e=>e.topic===topic.topic).map(e=>e.id).sort());
    }
});
test('RAG hit-rate examples agree with the unchanged worked solution and completion ID',()=>{
    const exercise=ROADMAP_EXERCISES['AI Engineer'].RAG.find(e=>e.id==='rag-retrieval-evaluation-v1');
    assert.equal(getPracticeCompletionKey({title:'RAG'},exercise),'rag::rag-retrieval-evaluation-v1');
    const fn=new vm.Script(exercise.solutionCode+'\nhitRateAtK').runInNewContext();
    const fixtures=[{cases:[{expectedSourceId:'a',retrievedIds:['x','a']},{expectedSourceId:'b',retrievedIds:['b']},{expectedSourceId:null,retrievedIds:['z']}],k:2},{cases:[{expectedSourceId:'a',retrievedIds:['x']},{expectedSourceId:'b',retrievedIds:['x','a']}],k:1}];
    fixtures.forEach((fixture,i)=>{const r=fn(fixture.cases,fixture.k);assert.equal(exercise.examples[i].output,`hitRate=${r.hitRate}, evaluatedCount=${r.evaluatedCount}, skippedCount=${r.skippedCount}`);});
    assert.match(exercise.examples[1].explanation,/both cases miss/i);
    assert.equal(fn([{expectedSourceId:null,retrievedIds:[]}],1).hitRate,null);
    assert.equal(fn([{expectedSourceId:'a',retrievedIds:['a','a']}],2).hitRate,1);
    assert.throws(()=>fn([],0));assert.throws(()=>fn([],1.5));
    assert.ok(exercise.tests.some(t=>t.name==='both top-1 results miss'&&t.expected.startsWith('hitRate=0,')));
});
