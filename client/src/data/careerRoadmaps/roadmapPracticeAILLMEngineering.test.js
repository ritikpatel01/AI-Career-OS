import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {ROADMAPS} from './careerRoadmapData.js';
import {ROADMAP_EXERCISES,buildLessonPracticeExercises} from './roadmapLearningContent.js';
import {AI_LLM_ENGINEERING_PRACTICE} from './roadmapPracticeAILLMEngineering.js';
import {ROADMAP_PRACTICE_BATCHES,ROADMAP_PRACTICE_BATCH_MANIFEST} from './roadmapPracticeBatches.js';
import {buildRoadmapPracticeCoverage,getExerciseContentIssues} from './roadmapPracticeCoverage.js';
import {normalizePracticeExercise,filterPracticeExercises,getPracticeCompletionKey} from './roadmapPracticeUtils.js';
const phase=ROADMAPS['AI Engineer'].phases.find(p=>p.title==='LLM Engineering');
const previous=[...(ROADMAP_EXERCISES['AI Engineer']?.['LLM Engineering']||[]),...buildLessonPracticeExercises('AI Engineer','LLM Engineering',phase.topics)];
// Same composition and historical alias lookup used by the Practice view.
const items=[...previous,...ROADMAP_PRACTICE_BATCHES['AI Engineer']['LLM Engineering']].map(normalizePracticeExercise).map(item=>({...item,legacyOutlineId:phase.practice.find(o=>o.id===item.id||o.title.toLowerCase()===item.title.toLowerCase())?.id||null}));
const key=item=>getPracticeCompletionKey(phase,item);

test('LLM Engineering publishes 54 complete exercises at exactly 3/3/3 per actual topic',()=>{
    assert.deepEqual(phase.topics,['LLM Fundamentals','Prompt Engineering','Structured Output','Function Calling','Embeddings','Fine Tuning']);
    assert.equal(previous.length,0);assert.equal(items.length,54);
    assert.deepEqual(ROADMAP_PRACTICE_BATCH_MANIFEST['AI Engineer']['LLM Engineering'].topics,phase.topics);
    const report=buildRoadmapPracticeCoverage();const coverage=report.phases.find(p=>p.career==='AI Engineer'&&p.phase==='LLM Engineering');
    assert.equal(coverage.status,'complete');assert.equal(coverage.publishedExerciseCount,54);assert.equal(coverage.topicsMeetingFullDifficultyTarget,6);assert.deepEqual(report.totals.duplicateExerciseIds,[]);
    for(const topic of phase.topics){
        assert.deepEqual(coverage.topics.find(t=>t.topic===topic).difficultyCounts,{Easy:3,Medium:3,Hard:3});
        for(const difficulty of ['Easy','Medium','Hard'])assert.equal(items.filter(e=>e.topic===topic&&e.difficulty===difficulty).length,3);
    }
    for(const field of ['id','title','problemStatement','solutionCode'])assert.equal(new Set(items.map(e=>e[field])).size,54,field);
    for(const item of AI_LLM_ENGINEERING_PRACTICE){
        assert.equal(item.career,'AI Engineer');assert.equal(item.phase,'LLM Engineering');assert.ok(phase.topics.includes(item.topic));
        assert.deepEqual(getExerciseContentIssues(item,item.topic),[],item.id);
        if(item.kind==='coding'){assert.equal(item.language,'JavaScript');assert.match(item.referenceChecks,/assert\.|eq\(/);}
        else {assert.equal(item.referenceChecks,null);assert.equal(item.language,'Engineering review');assert.ok(item.solutionCode.length>300);}
    }
});
test('LLM Engineering filters, search, selection, and completion keys preserve historical aliases',()=>{
    for(const topic of phase.topics)for(const difficulty of ['easy','medium','hard']){
        const selected=filterPracticeExercises({items,topic,difficulty,completionKey:key});assert.equal(selected.length,3);
        const completedKeys=[key(selected[1]),'llm-engineering::historical-unknown-key'];
        assert.deepEqual(filterPracticeExercises({items:selected,status:'completed',completedKeys,completionKey:key}).map(e=>e.id),[selected[1].id]);
        assert.equal(filterPracticeExercises({items:selected,status:'not-started',completedKeys,completionKey:key}).length,2);
        assert.equal(selected.find(e=>e.id===selected[2].id).id,selected[2].id);
    }
    assert.equal(new Set(items.map(key)).size,54);
    for(const item of items){assert.equal(item.legacyOutlineId,null);assert.equal(key(item),`llm-engineering::${item.id}`);assert.ok(key(item).length<=180);assert.equal(filterPracticeExercises({items,search:item.title,completionKey:key}).length,1);}
    assert.deepEqual(filterPracticeExercises({items,search:'no-matching-exercise-31824',completionKey:key}),[]);
    for(const outline of phase.practice)assert.equal(key({id:'replacement',legacyOutlineId:outline.id}),`llm-engineering::${outline.id}`);
});
test('all 44 executable LLM Engineering reference answers pass their local acceptance checks',()=>{
    const coding=AI_LLM_ENGINEERING_PRACTICE.filter(e=>e.kind==='coding');assert.equal(coding.length,44);
    assert.equal(AI_LLM_ENGINEERING_PRACTICE.filter(e=>e.kind==='written').length,10);
    for(const exercise of coding){
        const context=vm.createContext({assert,eq:(a,b)=>assert.equal(JSON.stringify(a),JSON.stringify(b))});
        const script=new vm.Script(exercise.solutionCode+'\n'+exercise.referenceChecks,{filename:exercise.id+'.js'});
        script.runInContext(context,{timeout:1000});
    }
});
