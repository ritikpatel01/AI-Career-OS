import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {ROADMAPS} from './careerRoadmapData.js';
import {ROADMAP_EXERCISES,buildLessonPracticeExercises} from './roadmapLearningContent.js';
import {AI_MACHINE_LEARNING_PRACTICE} from './roadmapPracticeAIMachineLearning.js';
import {ROADMAP_PRACTICE_BATCHES,ROADMAP_PRACTICE_BATCH_MANIFEST} from './roadmapPracticeBatches.js';
import {buildRoadmapPracticeCoverage,getExerciseContentIssues} from './roadmapPracticeCoverage.js';
import {normalizePracticeExercise,filterPracticeExercises,getPracticeCompletionKey} from './roadmapPracticeUtils.js';
const phase=ROADMAPS['AI Engineer'].phases.find(p=>p.title==='Machine Learning');
const previous=[...(ROADMAP_EXERCISES['AI Engineer']?.['Machine Learning']||[]),...buildLessonPracticeExercises('AI Engineer','Machine Learning',phase.topics)];
// Same composition and alias lookup as the real Practice view.
const items=[...previous,...ROADMAP_PRACTICE_BATCHES['AI Engineer']['Machine Learning']].map(normalizePracticeExercise).map(item=>({...item,legacyOutlineId:phase.practice.find(o=>o.id===item.id||o.title.toLowerCase()===item.title.toLowerCase())?.id||null}));
const key=item=>getPracticeCompletionKey(phase,item);

test('AI Machine Learning publishes 54 exercises at exactly 3/3/3 for every actual topic',()=>{
    assert.deepEqual(phase.topics,['ML Fundamentals','Regression','Classification','Clustering','Feature Engineering','Model Evaluation']);assert.equal(previous.length,0);assert.equal(items.length,54);
    assert.deepEqual(ROADMAP_PRACTICE_BATCH_MANIFEST['AI Engineer']['Machine Learning'].topics,phase.topics);
    const report=buildRoadmapPracticeCoverage();const coverage=report.phases.find(p=>p.career==='AI Engineer'&&p.phase==='Machine Learning');
    assert.equal(coverage.status,'complete');assert.equal(coverage.publishedExerciseCount,54);assert.equal(coverage.topicsMeetingFullDifficultyTarget,6);assert.deepEqual(report.totals.duplicateExerciseIds,[]);
    for(const topic of phase.topics){assert.deepEqual(coverage.topics.find(t=>t.topic===topic).difficultyCounts,{Easy:3,Medium:3,Hard:3});for(const difficulty of ['Easy','Medium','Hard'])assert.equal(items.filter(e=>e.topic===topic&&e.difficulty===difficulty).length,3);}
    for(const field of ['id','title','problemStatement','solutionCode'])assert.equal(new Set(items.map(e=>e[field])).size,54,field);
    for(const item of AI_MACHINE_LEARNING_PRACTICE){assert.equal(item.career,'AI Engineer');assert.equal(item.phase,'Machine Learning');assert.ok(['Python','Experimental design'].includes(item.language));assert.ok(phase.topics.includes(item.topic));assert.deepEqual(getExerciseContentIssues(item,item.topic),[]);if(item.kind==='coding')assert.match(item.referenceChecks,/\bassert\s|np\.testing\.assert_/);else assert.equal(item.referenceChecks,null);}
});
test('AI Machine Learning registration supports search, filters, selection, and compatible completion keys',()=>{
    for(const topic of phase.topics)for(const difficulty of ['easy','medium','hard']){
        const selected=filterPracticeExercises({items,topic,difficulty,completionKey:key});assert.equal(selected.length,3);
        const completedKeys=[key(selected[1]),'machine-learning::historical-unknown-key'];
        assert.deepEqual(filterPracticeExercises({items:selected,status:'completed',completedKeys,completionKey:key}).map(e=>e.id),[selected[1].id]);
        assert.equal(filterPracticeExercises({items:selected,status:'not-started',completedKeys,completionKey:key}).length,2);
        assert.equal(selected.find(e=>e.id===selected[2].id).id,selected[2].id);
    }
    assert.equal(new Set(items.map(key)).size,54);
    for(const item of items){assert.equal(item.legacyOutlineId,null);assert.equal(key(item),`machine-learning::${item.id}`);assert.ok(key(item).length<=180);assert.equal(filterPracticeExercises({items,search:item.title,completionKey:key}).length,1);}
    assert.deepEqual(filterPracticeExercises({items,search:'no-matching-exercise-31824',completionKey:key}),[]);
    for(const outline of phase.practice)assert.equal(key({id:'replacement',legacyOutlineId:outline.id}),`machine-learning::${outline.id}`);
});
test('every executable ML reference solution passes its executable positive and negative acceptance checks',()=>{
    const runner=String.raw`import json,sys,traceback
import numpy as np
import sklearn
items=json.load(sys.stdin)
failures=[]
for exercise in items:
    namespace={'np':np}
    try:
        exec(compile(exercise['solutionCode'],exercise['id'],'exec'),namespace)
        exec(compile(exercise['referenceChecks'],exercise['id']+'-checks','exec'),namespace)
    except Exception:
        failures.append({'id':exercise['id'],'traceback':traceback.format_exc()})
print(json.dumps({'checked':len(items),'failures':failures,'numpy':np.__version__,'sklearn':sklearn.__version__}))
sys.exit(bool(failures))
`;
    const result=spawnSync('python3',['-B','-c',runner],{input:JSON.stringify(AI_MACHINE_LEARNING_PRACTICE.filter(e=>e.kind==='coding')),encoding:'utf8',env:{...process.env,OPENBLAS_NUM_THREADS:'1',OMP_NUM_THREADS:'1'},timeout:60000,maxBuffer:1024*1024});
    assert.ifError(result.error);assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
    const report=JSON.parse(result.stdout);assert.equal(report.checked,48);assert.deepEqual(report.failures,[]);
});
