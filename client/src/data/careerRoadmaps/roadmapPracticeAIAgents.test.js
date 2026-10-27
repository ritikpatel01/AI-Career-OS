import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {ROADMAPS} from './careerRoadmapData.js';
import {ROADMAP_EXERCISES,buildLessonPracticeExercises} from './roadmapLearningContent.js';
import {AI_AGENTS_PRACTICE} from './roadmapPracticeAIAgents.js';
import {ROADMAP_PRACTICE_BATCHES,ROADMAP_PRACTICE_BATCH_MANIFEST} from './roadmapPracticeBatches.js';
import {buildRoadmapPracticeCoverage,getExerciseContentIssues} from './roadmapPracticeCoverage.js';
import {normalizePracticeExercise,filterPracticeExercises,getPracticeCompletionKey} from './roadmapPracticeUtils.js';
const phase=ROADMAPS['AI Engineer'].phases.find(p=>p.title==='AI Agents');
const previous=[...(ROADMAP_EXERCISES['AI Engineer']?.['AI Agents']||[]),...buildLessonPracticeExercises('AI Engineer','AI Agents',phase.topics)];
// Same catalog composition and alias matching used by Roadmap.jsx.
const items=[...previous,...ROADMAP_PRACTICE_BATCHES['AI Engineer']['AI Agents']].map(normalizePracticeExercise).map(item=>({...item,legacyOutlineId:phase.practice.find(o=>o.id===item.id||o.title.toLowerCase()===item.title.toLowerCase())?.id||null}));
const key=item=>getPracticeCompletionKey(phase,item);

test('AI Agents registers 54 complete exercises at exactly 3/3/3 per actual topic',()=>{
    assert.deepEqual(phase.topics,['Tool Calling','Agent Architecture','Memory','Planning','Multi-Agent Systems','Agent Evaluation']);
    assert.equal(previous.length,0);assert.equal(items.length,54);
    assert.equal(ROADMAP_PRACTICE_BATCHES['AI Engineer']['AI Agents'],AI_AGENTS_PRACTICE);
    assert.deepEqual(ROADMAP_PRACTICE_BATCH_MANIFEST['AI Engineer']['AI Agents'].topics,phase.topics);
    const report=buildRoadmapPracticeCoverage(),coverage=report.phases.find(p=>p.career==='AI Engineer'&&p.phase==='AI Agents');
    assert.equal(coverage.status,'complete');assert.equal(coverage.publishedExerciseCount,54);assert.equal(coverage.topicsMeetingFullDifficultyTarget,6);assert.deepEqual(report.totals.duplicateExerciseIds,[]);
    for(const topic of phase.topics){
        assert.deepEqual(coverage.topics.find(t=>t.topic===topic).difficultyCounts,{Easy:3,Medium:3,Hard:3});
        for(const difficulty of ['Easy','Medium','Hard'])assert.equal(items.filter(e=>e.topic===topic&&e.difficulty===difficulty).length,3);
    }
    for(const field of ['id','title','problemStatement','solutionCode'])assert.equal(new Set(items.map(e=>e[field])).size,54,field);
    for(const item of AI_AGENTS_PRACTICE){
        assert.equal(item.career,'AI Engineer');assert.equal(item.phase,'AI Agents');assert.ok(phase.topics.includes(item.topic));assert.deepEqual(getExerciseContentIssues(item,item.topic),[],item.id);
        if(item.kind==='coding'){assert.equal(item.language,'JavaScript');assert.match(item.referenceChecks,/assert\.|eq\(/);}
        else {assert.equal(item.referenceChecks,null);assert.equal(item.language,'Engineering review');assert.ok(item.solutionCode.length>300);}
    }
});
test('AI Agents search, topic/difficulty/completion filters, selection, and legacy aliases remain compatible',()=>{
    for(const topic of phase.topics)for(const difficulty of ['easy','medium','hard']){
        const selected=filterPracticeExercises({items,topic,difficulty,completionKey:key});assert.equal(selected.length,3);
        const completedKeys=[key(selected[1]),'ai-agents::historical-unknown-key'];
        assert.deepEqual(filterPracticeExercises({items:selected,status:'completed',completedKeys,completionKey:key}).map(e=>e.id),[selected[1].id]);
        assert.equal(filterPracticeExercises({items:selected,status:'not-started',completedKeys,completionKey:key}).length,2);
        assert.equal(selected.find(e=>e.id===selected[2].id).id,selected[2].id);
    }
    assert.equal(new Set(items.map(key)).size,54);
    for(const item of items){assert.equal(item.legacyOutlineId,null);assert.equal(key(item),`ai-agents::${item.id}`);assert.ok(key(item).length<=180);assert.equal(filterPracticeExercises({items,search:item.title,completionKey:key}).length,1);}
    assert.deepEqual(filterPracticeExercises({items,search:'no-matching-exercise-31824',completionKey:key}),[]);
    for(const outline of phase.practice)assert.equal(key({id:'replacement',legacyOutlineId:outline.id}),`ai-agents::${outline.id}`);
});
test('all 42 executable agent reference solutions pass local positive and negative acceptance checks',()=>{
    const coding=AI_AGENTS_PRACTICE.filter(e=>e.kind==='coding');assert.equal(coding.length,42);assert.equal(AI_AGENTS_PRACTICE.filter(e=>e.kind==='written').length,12);
    for(const exercise of coding){
        const context=vm.createContext({assert,TextEncoder,eq:(a,b)=>assert.equal(JSON.stringify(a),JSON.stringify(b))});
        new vm.Script(exercise.solutionCode+'\n'+exercise.referenceChecks,{filename:exercise.id+'.js'}).runInContext(context,{timeout:1000});
    }
});
