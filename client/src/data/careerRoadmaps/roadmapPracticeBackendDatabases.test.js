import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { ROADMAPS } from './careerRoadmapData.js';
import { ROADMAP_EXERCISES, buildLessonPracticeExercises } from './roadmapLearningContent.js';
import { BACKEND_DATABASE_PRACTICE } from './roadmapPracticeBackendDatabases.js';
import { ROADMAP_PRACTICE_BATCHES, ROADMAP_PRACTICE_BATCH_MANIFEST } from './roadmapPracticeBatches.js';
import { buildRoadmapPracticeCoverage, getExerciseContentIssues } from './roadmapPracticeCoverage.js';
import { filterPracticeExercises, getPracticeCompletionKey } from './roadmapPracticeUtils.js';
const phase=ROADMAPS['Backend Developer'].phases.find(p=>p.title==='Databases');
const existing=[...(ROADMAP_EXERCISES['Backend Developer']?.Databases||[]),...buildLessonPracticeExercises('Backend Developer',phase.title,phase.topics)];
// Mirror the real Practice view's catalog composition and legacy alias matching.
const items=[...existing,...ROADMAP_PRACTICE_BATCHES['Backend Developer'].Databases].map(item=>({...item,legacyOutlineId:phase.practice.find(o=>o.id===item.id||o.title.toLowerCase()===item.title.toLowerCase())?.id||null}));
const key=item=>getPracticeCompletionKey(phase,item);
const firstLine=slug=>BACKEND_DATABASE_PRACTICE.find(e=>e.id===`backend-db-${slug}-v1`).solutionCode.split('\n')[0];
const require=createRequire(new URL('../../../../server/package.json',import.meta.url));
const mongoose=require('mongoose');

test('Backend Databases fills exactly seven actual topics with 63 new exercises',()=>{
    assert.deepEqual(phase.topics,['MongoDB','Mongoose','SQL','PostgreSQL','Indexes','Transactions','Database Design']);
    assert.equal(existing.length,0); assert.equal(items.length,63);
    assert.deepEqual(ROADMAP_PRACTICE_BATCH_MANIFEST['Backend Developer'].Databases.topics,phase.topics);
    const report=buildRoadmapPracticeCoverage();
    const covered=report.phases.find(p=>p.career==='Backend Developer'&&p.phase==='Databases');
    assert.equal(covered.status,'complete'); assert.equal(covered.publishedExerciseCount,63);
    assert.equal(covered.topicsMeetingFullDifficultyTarget,7); assert.deepEqual(report.totals.duplicateExerciseIds,[]);
    for(const topic of phase.topics){
        assert.deepEqual(covered.topics.find(t=>t.topic===topic).difficultyCounts,{Easy:3,Medium:3,Hard:3});
        for(const difficulty of ['Easy','Medium','Hard']) assert.equal(items.filter(e=>e.topic===topic&&e.difficulty===difficulty).length,3);
    }
    for(const field of ['id','title','problemStatement','solutionCode']) assert.equal(new Set(items.map(e=>e[field])).size,63,field);
    for(const item of items){
        assert.equal(item.career,'Backend Developer'); assert.equal(item.phase,'Databases'); assert.ok(phase.topics.includes(item.topic));
        assert.deepEqual(getExerciseContentIssues(item,item.topic),[]); assert.ok(item.tests.every(t=>t.input&&t.expected)); assert.ok(item.hints.length>=2);
    }
});
test('Databases registered catalog supports filters and backward-compatible completion keys',()=>{
    for(const topic of phase.topics) for(const difficulty of ['easy','medium','hard']){
        const selected=filterPracticeExercises({items,topic,difficulty,completionKey:key}); assert.equal(selected.length,3);
        const completedKeys=[key(selected[0]),'databases::unknown-historical-key'];
        assert.deepEqual(filterPracticeExercises({items:selected,status:'completed',completedKeys,completionKey:key}).map(e=>e.id),[selected[0].id]);
        assert.equal(filterPracticeExercises({items:selected,status:'not-started',completedKeys,completionKey:key}).length,2);
    }
    assert.equal(new Set(items.map(key)).size,63);
    for(const item of items){
        assert.equal(item.legacyOutlineId,null); assert.equal(key(item),`databases::${item.id}`); assert.ok(key(item).length<=180);
        assert.equal(filterPracticeExercises({items,search:item.title,completionKey:key}).length,1);
    }
    for(const outline of phase.practice) assert.equal(key({id:'new',legacyOutlineId:outline.id}),`databases::${outline.id}`);
});
test('full catalog has valid topic associations and unique IDs and per-career keys',()=>{
    const ids=[];
    for(const[career,roadmap]of Object.entries(ROADMAPS)){
        const keys=[];
        for(const p of roadmap.phases) for(const e of [...(ROADMAP_EXERCISES[career]?.[p.title]||[]),...(ROADMAP_PRACTICE_BATCHES[career]?.[p.title]||[]),...buildLessonPracticeExercises(career,p.title,p.topics)]){
            assert.ok(p.topics.includes(e.topic),e.id); if(e.career)assert.equal(e.career,career);if(e.phase)assert.equal(e.phase,p.title);
            const legacyOutlineId=p.practice?.find(o=>o.id===e.id||o.title.toLowerCase()===e.title.toLowerCase())?.id;
            keys.push(getPracticeCompletionKey(p,{...e,legacyOutlineId}));ids.push(e.id);
        }
        assert.equal(new Set(keys).size,keys.length,career); assert.ok(keys.every(k=>k.length<=180));
    }
    assert.equal(new Set(ids).size,ids.length);
});
// SQLite executes portable SQL answers only; these are not PostgreSQL engine tests.
function sqlCheck(slug,setup,expected){const db=new DatabaseSync(':memory:');try{db.exec(setup);assert.deepEqual(db.prepare(firstLine(slug)).all().map(r=>({...r})),expected);}finally{db.close();}}
const orders='CREATE TABLE orders(id INTEGER PRIMARY KEY,customer_id TEXT,status TEXT,total_cents INTEGER,created_at TEXT);';
test('portable SQL handles inclusive thresholds, deterministic ties, and NULLs',()=>{
    sqlCheck('sql-paid-filter',orders+"INSERT INTO orders VALUES(1,'A','paid',1000,'x'),(2,'A','paid',999,'x'),(3,'A','cancelled',2000,'x'),(4,'A','paid',1500,'x'),(5,'A','paid',1500,'x');",[{id:4,total_cents:1500},{id:5,total_cents:1500},{id:1,total_cents:1000}]);
    sqlCheck('sql-null',"CREATE TABLE customers(id INTEGER,phone TEXT); INSERT INTO customers VALUES(1,NULL),(2,''),(3,'555');",[{id:1}]);
});
test('portable SQL preserves zero counts and handles nullable anti-joins and group filters',()=>{
    sqlCheck('sql-count-zero',"CREATE TABLE customers(id TEXT,name TEXT); CREATE TABLE orders(id INTEGER,customer_id TEXT); INSERT INTO customers VALUES('A','Ada'),('B','Bo'); INSERT INTO orders VALUES(1,'A'),(2,'A');",[{id:'A',name:'Ada',order_count:2},{id:'B',name:'Bo',order_count:0}]);
    sqlCheck('sql-not-exists',orders+"CREATE TABLE customers(id TEXT); INSERT INTO customers VALUES('A'),('B'),('C'); INSERT INTO orders VALUES(1,'A','paid',1,'x'),(2,'B','cancelled',1,'x'),(3,NULL,'paid',1,'x');",[{id:'B'},{id:'C'}]);
    sqlCheck('sql-having',orders+"INSERT INTO orders VALUES(1,'A','paid',3000,'x'),(2,'A','paid',2500,'x'),(3,'B','paid',5000,'x'),(4,'A','cancelled',9000,'x');",[{customer_id:'A',paid_cents:5500}]);
});
test('portable advanced SQL resolves latest ties, join fanout, and running frames',()=>{
    sqlCheck('sql-latest-per-group',orders+"INSERT INTO orders VALUES(7,'A','paid',1,'2026-01-02'),(8,'A','paid',1,'2026-01-02'),(1,'B','paid',1,'2026-01-01');",[{id:8,customer_id:'A',created_at:'2026-01-02'},{id:1,customer_id:'B',created_at:'2026-01-01'}]);
    sqlCheck('sql-join-fanout',"CREATE TABLE orders(id INTEGER); CREATE TABLE order_lines(order_id INTEGER,amount_cents INTEGER); CREATE TABLE payments(order_id INTEGER,amount_cents INTEGER); INSERT INTO orders VALUES(1),(2); INSERT INTO order_lines VALUES(1,100),(1,100); INSERT INTO payments VALUES(1,50),(1,150);",[{id:1,line_cents:200,paid_cents:200},{id:2,line_cents:0,paid_cents:0}]);
    sqlCheck('sql-running-total',"CREATE TABLE ledger(id INTEGER,account_id TEXT,occurred_at TEXT,delta_cents INTEGER); INSERT INTO ledger VALUES(1,'A','x',100),(2,'A','x',-30),(3,'B','x',40);",[{id:1,account_id:'A',balance_cents:100},{id:2,account_id:'A',balance_cents:70},{id:3,account_id:'B',balance_cents:40}]);
});
test('worked Mongoose schema trims, defaults, and rejects invalid documents locally',async()=>{
    const schema=vm.runInNewContext(`${firstLine('mongoose-schema-validation')}; schema;`,{mongoose});
    const connection=mongoose.createConnection();
    try{
        const Ticket=connection.model('PracticeTicket',schema);const good=new Ticket({title:'  Login  '});
        assert.equal(good.title,'Login');assert.equal(good.status,'open');await good.validate();
        await assert.rejects(new Ticket({title:'   ',status:'pending'}).validate(),error=>Boolean(error.errors.title&&error.errors.status));
        await assert.rejects(new Ticket({title:'x'.repeat(121)}).validate(),error=>Boolean(error.errors.title));assert.equal(new Ticket({title:'A',status:null}).status,null);
    }finally{await connection.destroy();}
});
// Temporary standalone MongoDB: verifies queries, not replica-set transactions.
test('MongoDB reference queries pass against an isolated temporary database',{timeout:30000},async t=>{
    const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
    const directory=await mkdtemp(join(tmpdir(),'roadmap-db-practice-'));
    const child=spawn('mongod',['--dbpath',directory,'--port',String(port),'--bind_ip','127.0.0.1','--nounixsocket','--quiet','--logpath',join(directory,'mongod.log')],{stdio:'ignore'});
    let spawnError;child.on('error',err=>{spawnError=err;});
    const client=new mongoose.mongo.MongoClient(`mongodb://127.0.0.1:${port}/roadmap_practice_test`,{serverSelectionTimeoutMS:200});
    t.after(async()=>{await client.close();if(child.exitCode===null&&child.pid){const exit=once(child,'exit');child.kill('SIGTERM');await exit;}await rm(directory,{recursive:true,force:true});});
    let connected=false;
    for(let i=0;i<60;i++){
        if(spawnError){if(spawnError.code==='ENOENT'){t.skip('mongod not installed');return;}throw spawnError;}
        if(child.exitCode!==null)throw new Error(`Disposable mongod exited: ${await readFile(join(directory,'mongod.log'),'utf8')}`);
        try{await client.connect();connected=true;break;}catch{await delay(100);}
    }
    assert.ok(connected,'temporary MongoDB must become ready');
    const database=client.db('roadmap_practice_test');
    // Worked queries use mongosh syntax. Translate its find(filter, projection)
    // to the Node driver's find(filter, {projection}); bind other methods.
    const db=new Proxy({},{get:(_,name)=>{
        const collection=database.collection(name);
        return new Proxy(collection,{get:(target,method)=>{
            if(method==='find') return (filter,projection)=>target.find(filter,projection?{projection}:{});
            const value=target[method];return typeof value==='function'?value.bind(target):value;
        }});
    }});
    const run=slug=>vm.runInNewContext(firstLine(slug),{db});
    await db.tasks.insertMany([{_id:'t1',ownerId:'u1',status:'open',title:'A',privateNotes:'secret'},{_id:'t2',ownerId:'u2',status:'open',title:'B'},{_id:'t3',ownerId:'u1',status:'closed',title:'C'}]);
    assert.deepEqual(await run('mongo-owner-projection').toArray(),[{_id:'t1',title:'A'}]);assert.equal((await run('mongo-exact-delete')).deletedCount,1);assert.equal((await db.tasks.findOne({_id:'t2'})).title,'B');
    await db.profiles.insertOne({_id:'p1',ownerId:'u1',timezone:'UTC',name:'Ada',preferences:{theme:'dark'}});
    assert.equal((await run('mongo-set-preserve')).matchedCount,1);assert.equal((await db.profiles.findOne({_id:'p1'})).name,'Ada');assert.equal((await run('mongo-set-preserve')).modifiedCount,0);
    await db.orders.insertMany([{_id:'wrong',ownerId:'u1',lines:[{sku:'A',quantity:1},{sku:'B',quantity:5}]},{_id:'right',ownerId:'u1',lines:[{sku:'A',quantity:4},{sku:'B',quantity:1}]}]);
    assert.deepEqual((await run('mongo-elemmatch').toArray()).map(x=>x._id),['right']);
    await db.sales.insertMany([{tenantId:'t1',customerId:'A',status:'paid',totalCents:100},{tenantId:'t1',customerId:'A',status:'paid',totalCents:250},{tenantId:'t1',customerId:'B',status:'paid',totalCents:200},{tenantId:'t1',customerId:'A',status:'cancelled',totalCents:999},{tenantId:'t2',customerId:'A',status:'paid',totalCents:9000}]);
    assert.deepEqual(await run('mongo-group-sales').toArray(),[{_id:'A',paidCents:350},{_id:'B',paidCents:200}]);
    await db.stock.insertOne({_id:'last',stock:1});const reserve=()=>db.stock.updateOne({_id:'last',stock:{$gte:1}},{$inc:{stock:-1}});
    assert.equal((await Promise.all([reserve(),reserve()])).reduce((sum,r)=>sum+r.matchedCount,0),1);assert.equal((await db.stock.findOne({_id:'last'})).stock,0);
});
