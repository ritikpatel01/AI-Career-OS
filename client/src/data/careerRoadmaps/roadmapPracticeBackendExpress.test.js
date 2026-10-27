import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { once } from 'node:events';
import { ROADMAPS } from './careerRoadmapData.js';
import { ROADMAP_EXERCISES, buildLessonPracticeExercises } from './roadmapLearningContent.js';
import { BACKEND_EXPRESS_PRACTICE } from './roadmapPracticeBackendExpress.js';
import { ROADMAP_PRACTICE_BATCHES, ROADMAP_PRACTICE_BATCH_MANIFEST } from './roadmapPracticeBatches.js';
import { buildRoadmapPracticeCoverage, getExerciseContentIssues } from './roadmapPracticeCoverage.js';
import { filterPracticeExercises, getPracticeCompletionKey } from './roadmapPracticeUtils.js';

const phase = ROADMAPS['Backend Developer'].phases.find(p => p.title === 'Express.js');
const existing = [...(ROADMAP_EXERCISES['Backend Developer']?.[phase.title] || []),
    ...buildLessonPracticeExercises('Backend Developer', phase.title, phase.topics)];
// Mirror catalog assembly and legacy matching in Roadmap.jsx; no separate test-only registry.
const items = [...existing, ...ROADMAP_PRACTICE_BATCHES['Backend Developer'][phase.title]].map(item => ({
    ...item, legacyOutlineId: phase.practice.find(outline => outline.id === item.id || outline.title.toLowerCase() === item.title.toLowerCase())?.id || null
}));
const completionKey = item => getPracticeCompletionKey(phase, item);
const exercise = slug => BACKEND_EXPRESS_PRACTICE.find(e => e.id === `backend-express-${slug}-v1`);

test('Express.js fills only the seven actual topics with 49 additions and 63 published exercises', () => {
    assert.deepEqual(phase.topics, ['Express','Routing','Middleware','Controllers','REST APIs','Validation','Error Handling']);
    assert.equal(existing.length, 14);
    assert.equal(BACKEND_EXPRESS_PRACTICE.length, 49);
    assert.equal(items.length, 63);
    assert.deepEqual(ROADMAP_PRACTICE_BATCH_MANIFEST['Backend Developer']['Express.js'].topics, phase.topics);
    const report = buildRoadmapPracticeCoverage();
    const coverage = report.phases.find(p => p.career === 'Backend Developer' && p.phase === 'Express.js');
    assert.equal(coverage.status, 'complete');
    assert.equal(coverage.publishedExerciseCount, 63);
    assert.equal(coverage.topicsMeetingFullDifficultyTarget, 7);
    assert.deepEqual(report.totals.duplicateExerciseIds, []);
    for (const topic of phase.topics) {
        assert.deepEqual(coverage.topics.find(t => t.topic === topic).difficultyCounts, {Easy:3,Medium:3,Hard:3});
        for (const difficulty of ['Easy','Medium','Hard']) assert.equal(items.filter(e => e.topic === topic && e.difficulty === difficulty).length, 3);
    }
    for (const field of ['id','title','problemStatement','solutionCode']) assert.equal(new Set(BACKEND_EXPRESS_PRACTICE.map(e => e[field])).size, 49, field);
    for (const item of BACKEND_EXPRESS_PRACTICE) {
        assert.equal(item.career, 'Backend Developer');
        assert.equal(item.phase, phase.title);
        assert.ok(phase.topics.includes(item.topic));
        assert.deepEqual(getExerciseContentIssues(item,item.topic), []);
        assert.ok(item.tests.every(t => t.input && t.expected));
        assert.ok(item.hints.length >= 2);
    }
});

test('registered Practice catalog exposes all filters and preserves existing completion keys', () => {
    for (const topic of phase.topics) for (const difficulty of ['easy','medium','hard']) {
        const filtered = filterPracticeExercises({items,topic,difficulty,completionKey});
        assert.equal(filtered.length, 3);
        const completedKeys = [completionKey(filtered[0]), 'express-js::unknown-historical-key'];
        assert.deepEqual(filterPracticeExercises({items:filtered,status:'completed',completedKeys,completionKey}).map(e => e.id), [filtered[0].id]);
        assert.equal(filterPracticeExercises({items:filtered,status:'not-started',completedKeys,completionKey}).length, 2);
    }
    for (const entry of BACKEND_EXPRESS_PRACTICE) {
        const item = items.find(e => e.id === entry.id);
        assert.equal(item.legacyOutlineId,null,'new exercise must not claim an old outline alias');
        assert.equal(completionKey(item),`express-js::${entry.id}`);
        assert.equal(filterPracticeExercises({items,search:entry.title,completionKey}).length, 1);
    }
    assert.equal(new Set(items.map(completionKey)).size,63);
    for (const item of items) assert.ok(completionKey(item).length <= 180);
    for (const old of existing) assert.equal(completionKey(items.find(e => e.id === old.id)), `express-js::${old.id}`);
    for (const outline of phase.practice) assert.equal(completionKey({id:'replacement',legacyOutlineId:outline.id}),`express-js::${outline.id}`);
    assert.equal(items.find(e => e.id === 'express-task-filter-v1').difficulty,'Medium');
    assert.equal(items.find(e => e.id === 'express-body-validation-v1').difficulty,'Medium');
});

test('worked ID parser rejects partial numbers and unsafe integers', () => {
    const source = exercise('validation-strict-id').solutionCode.split('\n')[0];
    const parse = vm.runInNewContext(`${source}; parseId;`);
    assert.equal(parse('12'),12);
    assert.equal(parse('0012'),12);
    for (const raw of ['12oops','0','-1','1.5','','9007199254740992',undefined,12]) assert.throws(() => parse(raw));
});

// Use the installed server Express dependency: no package/dependency changes.
const require = createRequire(new URL('../../../../server/package.json', import.meta.url));
const express = require('express');
async function withServer(app, run) {
    const server = app.listen(0,'127.0.0.1');
    try {
        await once(server,'listening');
        await run(`http://127.0.0.1:${server.address().port}`);
    } finally {
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
    }
}

test('worked health registration returns JSON over HTTP', async () => {
    const app = express();
    vm.runInNewContext(exercise('health-json').solutionCode.split('\n')[0], {app});
    app.use((req,res) => res.status(404).json({error:'Not found'}));
    await withServer(app,async base => {
        const response = await fetch(`${base}/health`);
        assert.equal(response.status,200);
        assert.match(response.headers.get('content-type'),/application\/json/);
        assert.deepEqual(await response.json(),{ok:true});
        assert.equal((await fetch(`${base}/missing`)).status,404);
    });
});

test('worked Express 5 catch-all includes root but preserves API 404', async () => {
    const app = express();
    vm.runInNewContext(exercise('routing-v5-catchall').solutionCode.split('\n')[0], {app,browserFallback:(req,res)=>res.type('html').send('<main>App</main>')});
    await withServer(app,async base => {
        for (const path of ['/','/deep/link']) {
            const response = await fetch(base+path);
            assert.equal(response.status,200);
            assert.match(await response.text(),/App/);
        }
        const response = await fetch(`${base}/api/not-real`);
        assert.equal(response.status,404);
        assert.deepEqual(await response.json(),{error:'Not found'});
    });
});

test('Express 5 returned rejection reaches worked safe error middleware', async () => {
    const app = express();
    const sentinel = new Error('private database details');
    let logged;
    app.get('/broken',async () => {throw sentinel;});
    vm.runInNewContext(exercise('error-four-arguments').solutionCode.split('\n')[0], {app,logInternal:err=>{logged=err;}});
    await withServer(app,async base => {
        const response = await fetch(`${base}/broken`);
        assert.equal(response.status,500);
        assert.deepEqual(await response.json(),{error:{code:'INTERNAL_ERROR'}});
        assert.equal(logged,sentinel);
    });
});
