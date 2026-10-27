import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {ROADMAPS} from './careerRoadmapData.js';
import {ROADMAP_EXERCISES,buildLessonPracticeExercises} from './roadmapLearningContent.js';
import {AI_DEEP_LEARNING_PRACTICE} from './roadmapPracticeAIDeepLearning.js';
import {ROADMAP_PRACTICE_BATCHES,ROADMAP_PRACTICE_BATCH_MANIFEST} from './roadmapPracticeBatches.js';
import {buildRoadmapPracticeCoverage,getExerciseContentIssues} from './roadmapPracticeCoverage.js';
import {normalizePracticeExercise,filterPracticeExercises,getPracticeCompletionKey} from './roadmapPracticeUtils.js';
const phase=ROADMAPS['AI Engineer'].phases.find(p=>p.title==='Deep Learning');
const previous=[...(ROADMAP_EXERCISES['AI Engineer']?.['Deep Learning']||[]),...buildLessonPracticeExercises('AI Engineer','Deep Learning',phase.topics)];
// Match Roadmap.jsx catalog composition and historical outline matching.
const items=[...previous,...ROADMAP_PRACTICE_BATCHES['AI Engineer']['Deep Learning']].map(normalizePracticeExercise).map(item=>({...item,legacyOutlineId:phase.practice.find(o=>o.id===item.id||o.title.toLowerCase()===item.title.toLowerCase())?.id||null}));
const key=item=>getPracticeCompletionKey(phase,item);

test('Deep Learning registers 54 complete exercises at exactly 3/3/3 per actual topic',()=>{
    assert.deepEqual(phase.topics,['Neural Networks','PyTorch','TensorFlow','CNN','RNN','Transformers']);
    assert.equal(previous.length,0);assert.equal(items.length,54);
    assert.deepEqual(ROADMAP_PRACTICE_BATCH_MANIFEST['AI Engineer']['Deep Learning'].topics,phase.topics);
    const report=buildRoadmapPracticeCoverage();const coverage=report.phases.find(p=>p.career==='AI Engineer'&&p.phase==='Deep Learning');
    assert.equal(coverage.status,'complete');assert.equal(coverage.publishedExerciseCount,54);assert.equal(coverage.topicsMeetingFullDifficultyTarget,6);assert.deepEqual(report.totals.duplicateExerciseIds,[]);
    for(const topic of phase.topics){
        assert.deepEqual(coverage.topics.find(t=>t.topic===topic).difficultyCounts,{Easy:3,Medium:3,Hard:3});
        for(const difficulty of ['Easy','Medium','Hard'])assert.equal(items.filter(e=>e.topic===topic&&e.difficulty===difficulty).length,3);
    }
    for(const field of ['id','title','problemStatement','solutionCode'])assert.equal(new Set(items.map(e=>e[field])).size,54,field);
    for(const item of AI_DEEP_LEARNING_PRACTICE){
        assert.equal(item.career,'AI Engineer');assert.equal(item.phase,'Deep Learning');assert.equal(item.language,'Python');
        assert.ok(phase.topics.includes(item.topic));assert.deepEqual(getExerciseContentIssues(item,item.topic),[]);
        assert.match(item.referenceChecks,/\bassert\s/);assert.ok(['numpy','torch','tensorflow'].includes(item.referenceDependency));
        assert.equal(item.prerequisites.length,2);
    }
});
test('Deep Learning search, filters, selection, and legacy completion aliases remain compatible',()=>{
    for(const topic of phase.topics)for(const difficulty of ['easy','medium','hard']){
        const selected=filterPracticeExercises({items,topic,difficulty,completionKey:key});assert.equal(selected.length,3);
        const completedKeys=[key(selected[1]),'deep-learning::historical-unknown-key'];
        assert.deepEqual(filterPracticeExercises({items:selected,status:'completed',completedKeys,completionKey:key}).map(e=>e.id),[selected[1].id]);
        assert.equal(filterPracticeExercises({items:selected,status:'not-started',completedKeys,completionKey:key}).length,2);
        assert.equal(selected.find(e=>e.id===selected[2].id).id,selected[2].id);
    }
    assert.equal(new Set(items.map(key)).size,54);
    for(const item of items){
        assert.equal(item.legacyOutlineId,null);assert.equal(key(item),`deep-learning::${item.id}`);assert.ok(key(item).length<=180);
        assert.equal(filterPracticeExercises({items,search:item.title,completionKey:key}).length,1);
    }
    assert.deepEqual(filterPracticeExercises({items,search:'no-matching-exercise-31824',completionKey:key}),[]);
    for(const outline of phase.practice)assert.equal(key({id:'replacement',legacyOutlineId:outline.id}),`deep-learning::${outline.id}`);
});
const python=(runner,input)=>{
    const result=spawnSync('python3',['-B','-c',runner],{input:JSON.stringify(input),encoding:'utf8',timeout:60000,maxBuffer:1024*1024,env:{...process.env,OPENBLAS_NUM_THREADS:'1',OMP_NUM_THREADS:'1',TF_NUM_INTRAOP_THREADS:'1',TF_NUM_INTEROP_THREADS:'1',CUDA_VISIBLE_DEVICES:'-1'}});
    assert.ifError(result.error);assert.equal(result.status,0,result.stdout+'\n'+result.stderr);return JSON.parse(result.stdout);
};
test('all 54 Deep Learning solutions and acceptance checks compile as Python',()=>{
    const report=python(String.raw`import json,sys
items=json.load(sys.stdin)
for item in items:
    compile(item['solutionCode'],item['id'],'exec')
    compile(item['referenceChecks'],item['id']+'-checks','exec')
print(json.dumps({'compiled':len(items)}))`,AI_DEEP_LEARNING_PRACTICE);
    assert.equal(report.compiled,54);
});
for(const [dependency,expected] of [['numpy',35],['torch',10],['tensorflow',9]]){
    test(`Deep Learning ${dependency} reference solutions pass their acceptance checks`,t=>{
        const selected=AI_DEEP_LEARNING_PRACTICE.filter(item=>item.referenceDependency===dependency);
        assert.equal(selected.length,expected);
        const report=python(String.raw`import json,sys,importlib.util,traceback
items=json.load(sys.stdin); dependency=items[0]['referenceDependency']
if importlib.util.find_spec(dependency) is None:
    print(json.dumps({'unavailable':dependency})); sys.exit(0)
module=__import__(dependency)
if dependency=='torch': module.set_num_threads(1)
failures=[]
for exercise in items:
    namespace={dependency:module,{'numpy':'np','torch':'torch','tensorflow':'tf'}[dependency]:module}
    try:
        exec(compile(exercise['solutionCode'],exercise['id'],'exec'),namespace)
        exec(compile(exercise['referenceChecks'],exercise['id']+'-checks','exec'),namespace)
    except Exception:
        failures.append({'id':exercise['id'],'traceback':traceback.format_exc()})
print(json.dumps({'checked':len(items),'failures':failures,'version':module.__version__}))
sys.exit(bool(failures))`,selected);
        if(report.unavailable){assert.notEqual(dependency,'numpy','NumPy is required for core checks');t.skip(`${dependency} is not installed; ${expected} runtime checks were not executed`);return;}
        assert.equal(report.checked,expected);assert.deepEqual(report.failures,[]);
        t.diagnostic(`${dependency} ${report.version}: ${expected} reference solutions executed`);
    });
}
