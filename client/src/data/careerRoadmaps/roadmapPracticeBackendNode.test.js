import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { EventEmitter, once } from 'node:events';
import { ROADMAPS } from './careerRoadmapData.js';
import { ROADMAP_EXERCISES, buildLessonPracticeExercises } from './roadmapLearningContent.js';
import { BACKEND_NODE_PRACTICE } from './roadmapPracticeBackendNode.js';
import { ROADMAP_PRACTICE_BATCHES, ROADMAP_PRACTICE_BATCH_MANIFEST } from './roadmapPracticeBatches.js';
import { buildRoadmapPracticeCoverage, getExerciseContentIssues } from './roadmapPracticeCoverage.js';
import { filterPracticeExercises, getPracticeCompletionKey } from './roadmapPracticeUtils.js';

const phase = ROADMAPS['Backend Developer'].phases.find(p => p.title === 'Node.js');
// Same catalog composition and legacy matching as the real Practice view.
const items = [...(ROADMAP_EXERCISES['Backend Developer']?.[phase.title] || []),
    ...ROADMAP_PRACTICE_BATCHES['Backend Developer'][phase.title],
    ...buildLessonPracticeExercises('Backend Developer', phase.title, phase.topics)
].map(item => ({ ...item, legacyOutlineId: phase.practice.find(outline => outline.id === item.id || outline.title.toLowerCase() === item.title.toLowerCase())?.id || null }));
const key = item => getPracticeCompletionKey(phase, item);
const exercise = slug => BACKEND_NODE_PRACTICE.find(e => e.id === `backend-node-${slug}-v1`);

test('Backend Node.js publishes exactly 3/3/3 for all actual topics', () => {
    assert.deepEqual(phase.topics, ['Node.js','NPM','Modules','File System','Events','Async Programming']);
    assert.equal(items.length, 54);
    assert.deepEqual(ROADMAP_PRACTICE_BATCH_MANIFEST['Backend Developer']['Node.js'].topics, phase.topics);
    const report = buildRoadmapPracticeCoverage();
    const coverage = report.phases.find(p => p.career === 'Backend Developer' && p.phase === 'Node.js');
    assert.equal(coverage.status, 'complete');
    assert.equal(coverage.publishedExerciseCount, 54);
    assert.equal(coverage.topicsMeetingFullDifficultyTarget, 6);
    assert.deepEqual(report.totals.duplicateExerciseIds, []);
    for (const topic of phase.topics) {
        assert.deepEqual(coverage.topics.find(t => t.topic === topic).difficultyCounts, {Easy:3,Medium:3,Hard:3});
        for (const difficulty of ['Easy','Medium','Hard']) assert.equal(items.filter(e => e.topic === topic && e.difficulty === difficulty).length, 3);
    }
    for (const field of ['id','title','problemStatement','solutionCode']) assert.equal(new Set(items.map(e => e[field])).size, 54, field);
    for (const item of items) {
        assert.equal(item.career, 'Backend Developer');
        assert.equal(item.phase, phase.title);
        assert.ok(phase.topics.includes(item.topic));
        assert.deepEqual(getExerciseContentIssues(item, item.topic), []);
        assert.ok(item.tests.every(t => t.input && t.expected));
    }
});

test('Practice topic, difficulty, search, and saved-key filters expose the new batch', () => {
    for (const topic of phase.topics) for (const difficulty of ['easy','medium','hard']) {
        const filtered = filterPracticeExercises({items,topic,difficulty,completionKey:key});
        assert.equal(filtered.length, 3);
        const completedKeys = [key(filtered[0]), 'node-js::historical-unknown-key'];
        assert.deepEqual(filterPracticeExercises({items:filtered,status:'completed',completedKeys,completionKey:key}).map(e => e.id), [filtered[0].id]);
        assert.equal(filterPracticeExercises({items:filtered,status:'not-started',completedKeys,completionKey:key}).length, 2);
        assert.equal(filterPracticeExercises({items,search:filtered[0].title,completionKey:key}).length, 1);
    }
    assert.equal(new Set(items.map(key)).size, 54);
    for (const item of items) {
        assert.equal(item.legacyOutlineId, null, 'new titles must not claim old outline keys');
        assert.equal(key(item), `node-js::${item.id}`);
        assert.ok(key(item).length <= 180);
    }
    for (const outline of phase.practice) assert.equal(key({id:'new',legacyOutlineId:outline.id}), `node-js::${outline.id}`);
});

test('checked-in manifest matches the current catalog', async () => {
    const saved = JSON.parse(await readFile(new URL('./roadmapPracticeCoverage.json', import.meta.url), 'utf8'));
    const current = buildRoadmapPracticeCoverage();
    delete saved.generatedAt;
    delete current.generatedAt;
    assert.deepEqual(saved, current);
});

test('worked port parser rejects malformed and out-of-range configuration', () => {
    const source = exercise('environment-port').solutionCode.split('\n')[0];
    const parse = vm.runInNewContext(`${source}; port;`);
    assert.equal(parse(undefined), 3000);
    assert.equal(parse('65535'), 65535);
    for (const raw of ['', '0', '65536', '1.5', '-1', '4x', ' 80']) assert.throws(() => parse(raw));
});

test('worked single-flight implementation shares work and recovers after failure', async () => {
    const source = exercise('async-singleflight').solutionCode.split('\n')[0];
    let calls = 0;
    let fail = true;
    const inflight = new Map();
    const get = vm.runInNewContext(`${source}; get;`, {inflight, load: async key => {calls++; if(fail) throw new Error('offline'); return `${key}-value`;}});
    const first = get('a');
    assert.equal(first, get('a'));
    await assert.rejects(first, /offline/);
    assert.equal(calls, 1);
    assert.equal(inflight.size, 0);
    fail = false;
    assert.deepEqual(await Promise.all([get('a'),get('a'),get('b')]), ['a-value','a-value','b-value']);
    assert.equal(calls, 3);
    assert.equal(inflight.size, 0);
});

test('event scenarios match real synchronous dispatch and pre-registered waits', async () => {
    const emitter = new EventEmitter();
    const order = ['before'];
    emitter.on('saved', () => order.push('one'));
    emitter.on('saved', () => order.push('two'));
    emitter.emit('saved');
    order.push('after');
    assert.deepEqual(order, ['before','one','two','after']);
    const opened = once(emitter,'opened');
    const ready = once(emitter,'ready');
    emitter.emit('opened',1);
    emitter.emit('ready',2);
    assert.deepEqual(await Promise.all([opened,ready]), [[1],[2]]);
    assert.equal(emitter.listenerCount('opened'), 0);
    assert.equal(emitter.listenerCount('ready'), 0);
});
