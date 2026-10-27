import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {ROADMAPS} from './careerRoadmapData.js';
import {ROADMAP_EXERCISES,buildLessonPracticeExercises} from './roadmapLearningContent.js';
import {AI_RAG_PRACTICE} from './roadmapPracticeAIRAG.js';
import {ROADMAP_PRACTICE_BATCHES,ROADMAP_PRACTICE_BATCH_MANIFEST} from './roadmapPracticeBatches.js';
import {buildRoadmapPracticeCoverage,getExerciseContentIssues} from './roadmapPracticeCoverage.js';
import {normalizePracticeExercise,filterPracticeExercises,getPracticeCompletionKey} from './roadmapPracticeUtils.js';
const phase=ROADMAPS['AI Engineer'].phases.find(p=>p.title==='RAG');
const previous=[...(ROADMAP_EXERCISES['AI Engineer']?.RAG||[]),...buildLessonPracticeExercises('AI Engineer','RAG',phase.topics)];
// Compose and resolve aliases exactly as the real Practice view does.
const items=[...previous,...ROADMAP_PRACTICE_BATCHES['AI Engineer'].RAG].map(normalizePracticeExercise).map(item=>({...item,legacyOutlineId:phase.practice.find(o=>o.id===item.id||o.title.toLowerCase()===item.title.toLowerCase())?.id||null}));
const key=item=>getPracticeCompletionKey(phase,item);
const priorCounts={'Vector Databases':[0,0,0],Chunking:[1,2,1],Embeddings:[1,1,1],Retrieval:[1,1,1],Reranking:[1,1,1],'RAG Evaluation':[1,1,2]};

test('RAG adds only the missing 37 exercises, preserving 17 existing records and roadmap topic order',()=>{
    assert.deepEqual(phase.topics,['Vector Databases','Chunking','Embeddings','Retrieval','Reranking','RAG Evaluation']);
    assert.equal(previous.length,17);assert.equal(AI_RAG_PRACTICE.length,37);assert.equal(items.length,54);
    assert.equal(ROADMAP_PRACTICE_BATCHES['AI Engineer'].RAG,AI_RAG_PRACTICE);
    assert.deepEqual(ROADMAP_PRACTICE_BATCH_MANIFEST['AI Engineer'].RAG.topics,phase.topics);
    const report=buildRoadmapPracticeCoverage(),coverage=report.phases.find(p=>p.career==='AI Engineer'&&p.phase==='RAG');
    assert.equal(coverage.status,'complete');assert.equal(coverage.publishedExerciseCount,54);assert.equal(coverage.topicsMeetingFullDifficultyTarget,6);assert.deepEqual(report.totals.duplicateExerciseIds,[]);
    for(const topic of phase.topics){
        assert.deepEqual(['Easy','Medium','Hard'].map(d=>previous.filter(e=>e.topic===topic&&e.difficulty===d).length),priorCounts[topic]);
        assert.deepEqual(coverage.topics.find(t=>t.topic===topic).difficultyCounts,{Easy:3,Medium:3,Hard:3});
        for(const [index,difficulty] of ['Easy','Medium','Hard'].entries())assert.equal(AI_RAG_PRACTICE.filter(e=>e.topic===topic&&e.difficulty===difficulty).length,3-priorCounts[topic][index]);
    }
    for(const field of ['id','title','problemStatement','solutionCode'])assert.equal(new Set(AI_RAG_PRACTICE.map(e=>e[field])).size,37,field);
    for(const item of AI_RAG_PRACTICE){
        assert.equal(item.career,'AI Engineer');assert.equal(item.phase,'RAG');assert.ok(phase.topics.includes(item.topic));
        assert.deepEqual(getExerciseContentIssues(item,item.topic),[],item.id);
        if(item.kind==='coding'){assert.equal(item.language,'JavaScript');assert.match(item.referenceChecks,/assert\.|eq\(/);}
        else {assert.equal(item.referenceChecks,null);assert.equal(item.language,'Engineering review');assert.ok(item.solutionCode.length>300);}
    }
    const existingIds=['rag-chunk-provenance-v1','rag-retrieval-evaluation-v1'];
    for(const topicSlug of ['chunking','embeddings','retrieval','reranking','rag-evaluation'])for(const mode of ['apply','debug','teach-back'])existingIds.push(`guided-ai-engineer-rag-${topicSlug}-${mode}-v1`);
    assert.deepEqual(previous.map(e=>e.id).sort(),existingIds.sort());
});
test('RAG filters, selection, search, and original/legacy completion keys remain compatible',()=>{
    for(const topic of phase.topics)for(const difficulty of ['easy','medium','hard']){
        const selected=filterPracticeExercises({items,topic,difficulty,completionKey:key});assert.equal(selected.length,3);
        const completedKeys=[key(selected[1]),'rag::historical-unknown-key'];
        assert.deepEqual(filterPracticeExercises({items:selected,status:'completed',completedKeys,completionKey:key}).map(e=>e.id),[selected[1].id]);
        assert.equal(filterPracticeExercises({items:selected,status:'not-started',completedKeys,completionKey:key}).length,2);
        assert.equal(selected.find(e=>e.id===selected[2].id).id,selected[2].id);
    }
    assert.equal(new Set(items.map(key)).size,54);
    for(const item of items){assert.equal(item.legacyOutlineId,null);assert.equal(key(item),`rag::${item.id}`);assert.ok(key(item).length<=180);assert.equal(filterPracticeExercises({items,search:item.title,completionKey:key}).length,1);}
    assert.deepEqual(filterPracticeExercises({items,search:'no-matching-exercise-31824',completionKey:key}),[]);
    for(const outline of phase.practice)assert.equal(key({id:'replacement',legacyOutlineId:outline.id}),`rag::${outline.id}`);
    const oldKeys=previous.map(e=>`rag::${e.id}`);
    assert.equal(filterPracticeExercises({items,status:'completed',completedKeys:oldKeys,completionKey:key}).length,17);
});
test('all 32 new executable RAG reference answers pass their positive and negative acceptance checks',()=>{
    const coding=AI_RAG_PRACTICE.filter(e=>e.kind==='coding');assert.equal(coding.length,32);
    assert.equal(AI_RAG_PRACTICE.filter(e=>e.kind==='written').length,5);
    for(const exercise of coding){
        const context=vm.createContext({assert,eq:(a,b)=>assert.equal(JSON.stringify(a),JSON.stringify(b))});
        new vm.Script(exercise.solutionCode+'\n'+exercise.referenceChecks,{filename:exercise.id+'.js'}).runInContext(context,{timeout:1000});
    }
});
