import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {ROADMAPS} from './careerRoadmapData.js';
import {ROADMAP_EXERCISES,buildLessonPracticeExercises} from './roadmapLearningContent.js';
import {AI_APPLICATIONS_PRACTICE} from './roadmapPracticeAIApplications.js';
import {ROADMAP_PRACTICE_BATCHES,ROADMAP_PRACTICE_BATCH_MANIFEST} from './roadmapPracticeBatches.js';
import {buildRoadmapPracticeCoverage,getExerciseContentIssues} from './roadmapPracticeCoverage.js';
import {normalizePracticeExercise,filterPracticeExercises,getPracticeCompletionKey} from './roadmapPracticeUtils.js';
const phase=ROADMAPS['AI Engineer'].phases.find(p=>p.title==='AI Applications');
const previous=[...(ROADMAP_EXERCISES['AI Engineer']?.['AI Applications']||[]),...buildLessonPracticeExercises('AI Engineer','AI Applications',phase.topics)];
// Match the actual Practice view's composition and historical outline alias resolution.
const items=[...previous,...ROADMAP_PRACTICE_BATCHES['AI Engineer']['AI Applications']].map(normalizePracticeExercise).map(item=>({...item,legacyOutlineId:phase.practice.find(o=>o.id===item.id||o.title.toLowerCase()===item.title.toLowerCase())?.id||null}));
const key=item=>getPracticeCompletionKey(phase,item);

test('AI Applications registers 54 complete exercises at exactly 3/3/3 per actual topic',()=>{
    assert.deepEqual(phase.topics,['AI Chatbot','RAG Application','AI Career Assistant','AI Interviewer','AI Agent','Deployment']);
    assert.equal(previous.length,0);assert.equal(items.length,54);assert.equal(ROADMAP_PRACTICE_BATCHES['AI Engineer']['AI Applications'],AI_APPLICATIONS_PRACTICE);
    assert.deepEqual(ROADMAP_PRACTICE_BATCH_MANIFEST['AI Engineer']['AI Applications'].topics,phase.topics);
    const report=buildRoadmapPracticeCoverage(),coverage=report.phases.find(p=>p.career==='AI Engineer'&&p.phase==='AI Applications');
    assert.equal(coverage.status,'complete');assert.equal(coverage.publishedExerciseCount,54);assert.equal(coverage.topicsMeetingFullDifficultyTarget,6);assert.deepEqual(report.totals.duplicateExerciseIds,[]);
    for(const topic of phase.topics){
        assert.deepEqual(coverage.topics.find(t=>t.topic===topic).difficultyCounts,{Easy:3,Medium:3,Hard:3});
        for(const difficulty of ['Easy','Medium','Hard'])assert.equal(items.filter(e=>e.topic===topic&&e.difficulty===difficulty).length,3);
    }
    for(const field of ['id','title','problemStatement','solutionCode'])assert.equal(new Set(items.map(e=>e[field])).size,54,field);
    for(const item of AI_APPLICATIONS_PRACTICE){
        assert.equal(item.career,'AI Engineer');assert.equal(item.phase,'AI Applications');assert.ok(phase.topics.includes(item.topic));assert.deepEqual(getExerciseContentIssues(item,item.topic),[],item.id);
        if(item.kind==='coding'){assert.equal(item.language,'JavaScript');assert.match(item.referenceChecks,/assert\.|eq\(/);}
        else {assert.equal(item.referenceChecks,null);assert.equal(item.language,'Engineering review');assert.ok(item.solutionCode.length>300);}
    }
});
test('AI Applications filters, selection, search, and legacy completion aliases remain compatible',()=>{
    for(const topic of phase.topics)for(const difficulty of ['easy','medium','hard']){
        const selected=filterPracticeExercises({items,topic,difficulty,completionKey:key});assert.equal(selected.length,3);
        const completedKeys=[key(selected[1]),'ai-applications::historical-unknown-key'];
        assert.deepEqual(filterPracticeExercises({items:selected,status:'completed',completedKeys,completionKey:key}).map(e=>e.id),[selected[1].id]);
        assert.equal(filterPracticeExercises({items:selected,status:'not-started',completedKeys,completionKey:key}).length,2);
        assert.equal(selected.find(e=>e.id===selected[2].id).id,selected[2].id);
    }
    assert.equal(new Set(items.map(key)).size,54);
    for(const item of items){assert.equal(item.legacyOutlineId,null);assert.equal(key(item),`ai-applications::${item.id}`);assert.ok(key(item).length<=180);assert.equal(filterPracticeExercises({items,search:item.title,completionKey:key}).length,1);}
    assert.deepEqual(filterPracticeExercises({items,search:'no-matching-exercise-31824',completionKey:key}),[]);
    for(const outline of phase.practice)assert.equal(key({id:'replacement',legacyOutlineId:outline.id}),`ai-applications::${outline.id}`);
});
test('all 42 executable application reference solutions pass local positive and negative acceptance checks',()=>{
    const coding=AI_APPLICATIONS_PRACTICE.filter(e=>e.kind==='coding');assert.equal(coding.length,42);assert.equal(AI_APPLICATIONS_PRACTICE.filter(e=>e.kind==='written').length,12);
    for(const exercise of coding){
        const context=vm.createContext({assert,URL,TextEncoder,TextDecoder,Uint8Array,eq:(a,b)=>assert.equal(JSON.stringify(a),JSON.stringify(b))});
        new vm.Script(exercise.solutionCode+'\n'+exercise.referenceChecks,{filename:exercise.id+'.js'}).runInContext(context,{timeout:1000});
    }
});
test('all roadmap careers, phases, and actual topics meet the minimum difficulty target',()=>{
    const report=buildRoadmapPracticeCoverage();assert.equal(report.totals.topics,285);assert.equal(report.totals.topicsMeetingFullDifficultyTarget,285);
    assert.equal(report.totals.incompleteExercises,0);assert.deepEqual(report.totals.duplicateExerciseIds,[]);
    for(const p of report.phases){assert.equal(p.status,'complete',`${p.career} / ${p.phase}`);for(const t of p.topics)for(const d of ['Easy','Medium','Hard'])assert.ok(t.difficultyCounts[d]>=3,`${p.career} / ${p.phase} / ${t.topic} / ${d}`);}
});
