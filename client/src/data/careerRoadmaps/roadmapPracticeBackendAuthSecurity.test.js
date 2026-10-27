import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {generateKeyPairSync,randomBytes} from 'node:crypto';
import {ROADMAPS} from './careerRoadmapData.js';
import {ROADMAP_EXERCISES,buildLessonPracticeExercises} from './roadmapLearningContent.js';
import {BACKEND_AUTH_SECURITY_PRACTICE} from './roadmapPracticeBackendAuthSecurity.js';
import {ROADMAP_PRACTICE_BATCHES,ROADMAP_PRACTICE_BATCH_MANIFEST} from './roadmapPracticeBatches.js';
import {buildRoadmapPracticeCoverage,getExerciseContentIssues} from './roadmapPracticeCoverage.js';
import {normalizePracticeExercise,filterPracticeExercises,getPracticeCompletionKey} from './roadmapPracticeUtils.js';
const phase=ROADMAPS['Backend Developer'].phases.find(p=>p.title==='Authentication & Security');
const previous=[...(ROADMAP_EXERCISES['Backend Developer']?.[phase.title]||[]),...buildLessonPracticeExercises('Backend Developer',phase.title,phase.topics)];
// Same sources and alias matching as the actual Roadmap Practice view.
const items=[...previous,...ROADMAP_PRACTICE_BATCHES['Backend Developer'][phase.title]].map(normalizePracticeExercise).map(item=>({...item,legacyOutlineId:phase.practice.find(o=>o.id===item.id||o.title.toLowerCase()===item.title.toLowerCase())?.id||null}));
const key=item=>getPracticeCompletionKey(phase,item);
const firstLine=slug=>BACKEND_AUTH_SECURITY_PRACTICE.find(e=>e.id===`backend-auth-${slug}-v1`).solutionCode.split('\n')[0];

test('Backend Authentication & Security publishes exactly 63 exercises across the seven actual topics',()=>{
    assert.deepEqual(phase.topics,['JWT','Sessions','Password Hashing','Authorization','CORS','OWASP','Rate Limiting']);
    assert.equal(previous.length,0);assert.equal(items.length,63);
    assert.deepEqual(ROADMAP_PRACTICE_BATCH_MANIFEST['Backend Developer'][phase.title].topics,phase.topics);
    const report=buildRoadmapPracticeCoverage();const covered=report.phases.find(p=>p.career==='Backend Developer'&&p.phase===phase.title);
    assert.equal(covered.status,'complete');assert.equal(covered.publishedExerciseCount,63);assert.equal(covered.topicsMeetingFullDifficultyTarget,7);assert.deepEqual(report.totals.duplicateExerciseIds,[]);
    for(const topic of phase.topics){assert.deepEqual(covered.topics.find(t=>t.topic===topic).difficultyCounts,{Easy:3,Medium:3,Hard:3});for(const difficulty of ['Easy','Medium','Hard'])assert.equal(items.filter(e=>e.topic===topic&&e.difficulty===difficulty).length,3);}
    for(const field of ['id','title','problemStatement','solutionCode'])assert.equal(new Set(items.map(e=>e[field])).size,63,field);
    for(const e of BACKEND_AUTH_SECURITY_PRACTICE){assert.equal(e.career,'Backend Developer');assert.equal(e.phase,phase.title);assert.ok(phase.topics.includes(e.topic));assert.deepEqual(getExerciseContentIssues(e,e.topic),[]);assert.ok(e.tests.length>=2);assert.ok(e.hints.length>=2);}
    for(const[c,p,n]of [['Backend Developer','Node.js',54],['Backend Developer','Express.js',63],['Backend Developer','Databases',63],['Full Stack Developer','System Design',90]])assert.equal(report.phases.find(x=>x.career===c&&x.phase===p).publishedExerciseCount,n);
});
test('new catalog supports filters, search, selection, and historical completion aliases',()=>{
    for(const topic of phase.topics)for(const difficulty of ['easy','medium','hard']){
        const selected=filterPracticeExercises({items,topic,difficulty,completionKey:key});assert.equal(selected.length,3);
        const completedKeys=[key(selected[1]),'authentication-security::historical-unknown-key'];
        assert.deepEqual(filterPracticeExercises({items:selected,status:'completed',completedKeys,completionKey:key}).map(e=>e.id),[selected[1].id]);
        assert.equal(filterPracticeExercises({items:selected,status:'not-started',completedKeys,completionKey:key}).length,2);
        assert.equal((selected.find(e=>e.id===selected[2].id)||selected[0]).id,selected[2].id);
    }
    assert.equal(new Set(items.map(key)).size,63);
    for(const item of items){assert.equal(item.legacyOutlineId,null);assert.equal(key(item),`authentication-security::${item.id}`);assert.ok(key(item).length<=180);assert.equal(filterPracticeExercises({items,search:item.title,completionKey:key}).length,1);}
    assert.deepEqual(filterPracticeExercises({items,search:'no-matching-exercise-93817',completionKey:key}),[]);
    for(const outline of phase.practice)assert.equal(key({id:'replacement',legacyOutlineId:outline.id}),`authentication-security::${outline.id}`);
});
const require=createRequire(new URL('../../../../server/package.json',import.meta.url));const jwt=require('jsonwebtoken');
test('worked JWT verifier rejects forged, expired, missing-claim, and wrong-context tokens',()=>{
    const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
    const verify=vm.runInNewContext(`${firstLine('jwt-verify')}; verifyAccess;`,{jwt:{verify:(token,key,options)=>jwt.verify(token,key,{...options,clockTimestamp:1000})}});
    const sign=(claims={},options={})=>jwt.sign({sub:'u1',exp:1200,...claims},privateKey,{algorithm:'RS256',issuer:'career-auth',audience:'career-api',noTimestamp:true,...options});
    assert.equal(verify(sign(),publicKey).sub,'u1');
    for(const token of [sign({exp:1000}),sign({exp:999}),sign({nbf:1100}),sign({sub:''}),sign({}, {audience:'other-api'}),sign({}, {issuer:'other-auth'})])assert.throws(()=>verify(token,publicKey));
    const noExpiry=jwt.sign({sub:'u1'},privateKey,{algorithm:'RS256',issuer:'career-auth',audience:'career-api',noTimestamp:true});assert.throws(()=>verify(noExpiry,publicKey));
    const parts=sign().split('.');parts[1]=Buffer.from(JSON.stringify({sub:'admin',exp:1200,iss:'career-auth',aud:'career-api'})).toString('base64url');assert.throws(()=>verify(parts.join('.'),publicKey));
    assert.throws(()=>verify(jwt.sign({sub:'u1',exp:1200},randomBytes(32),{algorithm:'HS256'}),publicKey));
    const none=Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')+'.'+Buffer.from('{"sub":"u1","exp":1200}').toString('base64url')+'.';assert.throws(()=>verify(none,publicKey));
});
test('worked role matrix denies unknown roles/actions and inherited object keys',()=>{
    const can=vm.runInNewContext(`${firstLine('authz-role-allowlist')}; can;`);
    assert.equal(can('viewer','reports:read'),true);assert.equal(can('viewer','reports:update'),false);assert.equal(can('editor','reports:update'),true);assert.equal(can('editor','reports:delete'),false);assert.equal(can('admin','reports:delete'),true);
    for(const role of [undefined,'guest','toString','__proto__'])assert.equal(can(role,'reports:read'),false);assert.equal(can('admin','unlisted-action'),false);
});
test('worked CORS predicate rejects suffix tricks, null origins, and unconfigured ports',()=>{
    const allow=vm.runInNewContext(`${firstLine('cors-exact-origin')}; allowOrigin;`);assert.equal(allow('https://app.example.test'),true);
    for(const origin of ['https://app.example.test.attacker.test','http://app.example.test','https://app.example.test:444','null',undefined,{},'https://attacker.test'])assert.equal(allow(origin),false);
});
test('worked SQL query keeps submitted syntax-like text in bound values',()=>{
    const email="a' OR 1=1 --";const query=vm.runInNewContext(`${firstLine('owasp-sql-values')}; query;`,{principal:{tenantId:'t1'},inputEmail:email});
    assert.equal(query.text,'SELECT id,email FROM users WHERE tenant_id=$1 AND email=$2');assert.deepEqual(Array.from(query.values),['t1',email]);assert.equal(query.text.includes(email),false);
});
