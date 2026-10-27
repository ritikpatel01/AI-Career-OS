import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {mkdtemp,writeFile,readFile,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {ROADMAPS} from './careerRoadmapData.js';
import {ROADMAP_EXERCISES,buildLessonPracticeExercises} from './roadmapLearningContent.js';
import {BACKEND_DEPLOYMENT_PRACTICE} from './roadmapPracticeBackendDeployment.js';
import {ROADMAP_PRACTICE_BATCHES,ROADMAP_PRACTICE_BATCH_MANIFEST} from './roadmapPracticeBatches.js';
import {buildRoadmapPracticeCoverage,getExerciseContentIssues} from './roadmapPracticeCoverage.js';
import {normalizePracticeExercise,filterPracticeExercises,getPracticeCompletionKey} from './roadmapPracticeUtils.js';
const phase=ROADMAPS['Backend Developer'].phases.find(p=>p.title==='Deployment & System Design');
const previous=[...(ROADMAP_EXERCISES['Backend Developer']?.[phase.title]||[]),...buildLessonPracticeExercises('Backend Developer',phase.title,phase.topics)];
// Use the same sources and outline-alias matching as the actual Practice view.
const items=[...previous,...ROADMAP_PRACTICE_BATCHES['Backend Developer'][phase.title]].map(normalizePracticeExercise).map(item=>({...item,legacyOutlineId:phase.practice.find(o=>o.id===item.id||o.title.toLowerCase()===item.title.toLowerCase())?.id||null}));
const key=item=>getPracticeCompletionKey(phase,item);
const answer=slug=>BACKEND_DEPLOYMENT_PRACTICE.find(e=>e.id===`backend-deploy-${slug}-v1`).solutionCode;
const firstLine=slug=>answer(slug).split('\n')[0];

test('Backend Deployment & System Design publishes exactly 3/3/3 for all seven actual topics',()=>{
    assert.deepEqual(phase.topics,['Linux','Docker','CI/CD','Cloud','Caching','Queues','Scalability']);assert.equal(previous.length,0);assert.equal(items.length,63);
    assert.deepEqual(ROADMAP_PRACTICE_BATCH_MANIFEST['Backend Developer'][phase.title].topics,phase.topics);
    const report=buildRoadmapPracticeCoverage();const covered=report.phases.find(p=>p.career==='Backend Developer'&&p.phase===phase.title);
    assert.equal(covered.status,'complete');assert.equal(covered.publishedExerciseCount,63);assert.equal(covered.topicsMeetingFullDifficultyTarget,7);assert.deepEqual(report.totals.duplicateExerciseIds,[]);
    for(const topic of phase.topics){assert.deepEqual(covered.topics.find(t=>t.topic===topic).difficultyCounts,{Easy:3,Medium:3,Hard:3});for(const difficulty of ['Easy','Medium','Hard'])assert.equal(items.filter(e=>e.topic===topic&&e.difficulty===difficulty).length,3);}
    for(const field of ['id','title','problemStatement','solutionCode'])assert.equal(new Set(items.map(e=>e[field])).size,63,field);
    for(const e of BACKEND_DEPLOYMENT_PRACTICE){assert.equal(e.career,'Backend Developer');assert.equal(e.phase,phase.title);assert.ok(phase.topics.includes(e.topic));assert.deepEqual(getExerciseContentIssues(e,e.topic),[]);assert.ok(e.tests.length>=2);assert.ok(e.hints.length>=2);}
    for(const[c,p,n]of [['Backend Developer','Node.js',54],['Backend Developer','Express.js',63],['Backend Developer','Databases',63],['Backend Developer','Authentication & Security',63],['Full Stack Developer','System Design',90]])assert.equal(report.phases.find(x=>x.career===c&&x.phase===p).publishedExerciseCount,n);
});
test('registered catalog filters, searches, and completion keys preserve existing formats',()=>{
    for(const topic of phase.topics)for(const difficulty of ['easy','medium','hard']){
        const selected=filterPracticeExercises({items,topic,difficulty,completionKey:key});assert.equal(selected.length,3);
        const completedKeys=[key(selected[1]),'deployment-system-design::historical-unknown-key'];
        assert.deepEqual(filterPracticeExercises({items:selected,status:'completed',completedKeys,completionKey:key}).map(e=>e.id),[selected[1].id]);
        assert.equal(filterPracticeExercises({items:selected,status:'not-started',completedKeys,completionKey:key}).length,2);
        assert.equal(selected.find(e=>e.id===selected[2].id).id,selected[2].id);
    }
    assert.equal(new Set(items.map(key)).size,63);
    for(const item of items){assert.equal(item.legacyOutlineId,null);assert.equal(key(item),`deployment-system-design::${item.id}`);assert.ok(key(item).length<=180);assert.equal(filterPracticeExercises({items,search:item.title,completionKey:key}).length,1);}
    assert.deepEqual(filterPracticeExercises({items,search:'no-matching-exercise-82731',completionKey:key}),[]);
    for(const outline of phase.practice)assert.equal(key({id:'replacement',legacyOutlineId:outline.id}),`deployment-system-design::${outline.id}`);
});
test('worked TTL predicate preserves falsy values and rejects expired or malformed entries',()=>{
    const fresh=vm.runInNewContext(`${firstLine('cache-ttl-boundary')}; isFresh;`);
    assert.equal(fresh({value:0,expiresAt:2000},1999),true);assert.equal(fresh({value:false,expiresAt:2000},1999),true);
    for(const [entry,now]of [[{expiresAt:2000},2000],[null,100],[{expiresAt:Infinity},100],[{expiresAt:'2000'},100],[{expiresAt:2000},NaN]])assert.equal(fresh(entry,now),false);
});
test('worked local single-flight shares work, isolates keys, and retries after failure',async()=>{
    const run=vm.runInNewContext(`${firstLine('cache-singleflight')}; singleFlight;`);const inflight=new Map();let calls=0;let fail=true;
    const load=async()=>{calls++;if(fail)throw new Error('offline');return 42;};
    const first=run('a',load,inflight);assert.equal(run('a',load,inflight),first);await assert.rejects(first,/offline/);assert.equal(calls,1);assert.equal(inflight.size,0);
    fail=false;assert.deepEqual(await Promise.all([run('a',load,inflight),run('a',load,inflight),run('b',load,inflight)]),[42,42,42]);assert.equal(calls,3);assert.equal(inflight.size,0);
});
test('worked mean-concurrency calculation matches its stated units and rejects invalid input',()=>{
    const calculate=vm.runInNewContext(`${firstLine('scale-capacity')}; meanInflight;`);assert.equal(calculate(200,0.25),50);assert.equal(calculate(0,0.25),0);
    for(const pair of [[-1,1],[1,-1],[Infinity,1],[1,NaN]])assert.throws(()=>calculate(...pair));
});
test('Linux reference commands handle a spaced path and owner-only mode in disposable fixtures',async()=>{
    const dir=await mkdtemp(join(tmpdir(),'roadmap-linux-fixture-'));
    try{
        const {mkdir}=await import('node:fs/promises');await mkdir(join(dir,'support logs'));const lines=Array.from({length:25},(_,i)=>`line-${i+1}`);await writeFile(join(dir,'support logs','api error.log'),lines.join('\n')+'\n');
        const tailCommand=answer('linux-file-paths').split('\n')[2];assert.equal(execFileSync('sh',['-c',tailCommand],{cwd:dir,encoding:'utf8'}),lines.slice(-20).join('\n')+'\n');
        await writeFile(join(dir,'app-secret'),'fixture-only');execFileSync('sh',['-c',firstLine('linux-mode')],{cwd:dir});assert.equal((await stat(join(dir,'app-secret'))).mode&0o777,0o600);
    }finally{await rm(dir,{recursive:true,force:true});}
});
test('CI reference command chain stops after a failing test and builds only after success',async()=>{
    const dir=await mkdtemp(join(tmpdir(),'roadmap-ci-fixture-'));const trace=join(dir,'trace');
    try{
        // A local stub proves shell gating; it performs no installation/network/deployment.
        await writeFile(join(dir,'npm'),'#!/bin/sh\nprintf "%s\\n" "$*" >> "$PRACTICE_TEST_TRACE"\nif [ "$*" = "test" ] && [ "$PRACTICE_TEST_FAIL" = "yes" ]; then exit 7; fi\nexit 0\n',{mode:0o700});
        const env={...process.env,PATH:dir+':'+process.env.PATH,PRACTICE_TEST_TRACE:trace,PRACTICE_TEST_FAIL:'yes'};
        assert.equal(spawnSync('sh',['-c',firstLine('ci-failing-gate')],{cwd:dir,env}).status,7);assert.equal(await readFile(trace,'utf8'),'ci\ntest\n');
        await writeFile(trace,'');assert.equal(spawnSync('sh',['-c',firstLine('ci-failing-gate')],{cwd:dir,env:{...env,PRACTICE_TEST_FAIL:'no'}}).status,0);assert.equal(await readFile(trace,'utf8'),'ci\ntest\nrun build\n');
    }finally{await rm(dir,{recursive:true,force:true});}
});
