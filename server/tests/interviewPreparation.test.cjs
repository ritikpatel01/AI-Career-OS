const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const catalog = require('../services/interviewPreparationCatalog');
const { preparationQuery, preparationPatch } = require('../validators/interviewPreparationValidator');
const query = overrides => preparationQuery.validate(overrides || {}).value;

function service() {
    const records = [];
    const operations = [];
    const matches = (record, filter) => record.user === filter.user && record.kind === filter.kind &&
        (typeof filter.questionId === 'string' ? record.questionId === filter.questionId : filter.questionId.$in.includes(record.questionId));
    const model = {
        find(filter) { operations.push(['find', filter]); return { select() { return this; }, lean: async () => records.filter(record => matches(record, filter)).map(record => ({ ...record })) }; },
        findOneAndUpdate(filter, update, options) {
            operations.push(['update', filter, update, options]);
            return { lean: async () => {
                let record = records.find(record => matches(record, filter));
                if (!record && options.upsert) { record = { ...filter, ...update.$setOnInsert, _id: String(records.length + 1), updatedAt: new Date(), answer: '', notes: '', practiced: false, bookmarked: false, revisionStatus: 'not-needed', lastPracticedAt: null }; records.push(record); }
                if (!record) return null;
                Object.assign(record, update.$set); return { ...record };
            } };
        }
    };
    const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(require.resolve('../services/interviewService'), 'utf8'), {
        module, Date, console,
        require: name => name.includes('models/Interview') ? model : name.includes('Catalog') ? catalog : { evaluateInterviewAnswer() { throw Error('AI must not run for preparation'); } }
    });
    return { ...module.exports, records, operations, model };
}

test('catalog retrieval has stable unique IDs, eight categories, guidance and pagination without writes', async () => {
    assert.equal(catalog.questions.length, 32);
    assert.equal(new Set(catalog.questionIds).size, 32);
    assert.equal(catalog.categories.length, 8);
    assert.ok(catalog.questions.every(question => question.guidance && ['Easy', 'Medium', 'Hard'].includes(question.difficulty)));
    const api = service();
    const page = await api.getPreparation('owner-a', query());
    assert.equal(page.questions.length, 12); assert.equal(page.pagination.pages, 3);
    assert.equal(page.overview.practiced, 0); assert.equal(api.records.length, 0);
    assert.equal(api.operations.length, 1); assert.equal(api.operations[0][1].user, 'owner-a');
});

test('question/category/difficulty/status search, sorting and unmatched results are consistent', () => {
    const records = [{ questionId: 'prep-02-01', practiced: true, bookmarked: true, revisionStatus: 'needs-revision', lastPracticedAt: new Date() }];
    const result = catalog.buildPreparationPage(records, query({ search: 'STATE', category: 'React', status: 'bookmarked' }));
    assert.equal(result.questions.length, 1); assert.equal(result.questions[0].id, 'prep-02-01');
    assert.equal(result.overview.total, 32); assert.equal(result.overview.practiced, 1);
    assert.equal(catalog.buildPreparationPage(records, query({ difficulty: 'Hard', limit: 50 })).questions.length, 8);
    assert.equal(catalog.buildPreparationPage(records, query({ status: 'revision' })).questions.length, 1);
    assert.equal(catalog.buildPreparationPage(records, query({ search: 'no such phrase' })).pagination.total, 0);
    const sorted = catalog.buildPreparationPage(records, query({ sort: 'recent' }));
    assert.equal(sorted.questions[0].id, 'prep-02-01');
});

test('explicit saves persist private notes, bookmarks, practiced flags and revision status without duplicate records', async () => {
    const api = service();
    await api.savePreparation('owner-a', 'prep-01-01', { answer: 'A lexical environment', notes: 'Revise lifetime', revisionStatus: 'needs-revision' });
    const marked = await api.savePreparation('owner-a', 'prep-01-01', { practiced: true, bookmarked: true });
    assert.equal(api.records.length, 1);
    assert.equal(marked.personal.notes, 'Revise lifetime'); assert.equal(marked.personal.answer, 'A lexical environment');
    assert.equal(marked.personal.bookmarked, true); assert.equal(marked.personal.practiced, true);
    assert.ok(marked.personal.lastPracticedAt);
    await api.savePreparation('owner-a', 'prep-01-01', { bookmarked: false });
    const page = await api.getPreparation('owner-a', query());
    assert.equal(page.overview.percentage, 100 / 32);
    await api.savePreparation('owner-a', 'prep-01-01', { practiced: false });
    assert.equal((await api.getPreparation('owner-a', query())).overview.practiced, 0);
    assert.equal(api.records.length, 1);
});

test('each save and read is owner-scoped; the same question has independent private records', async () => {
    const api = service();
    await api.savePreparation('owner-a', 'prep-01-01', { notes: 'Private A', practiced: true });
    const other = await api.getPreparation('owner-b', query());
    assert.equal(other.questions[0].personal.notes, ''); assert.equal(other.overview.practiced, 0);
    await api.savePreparation('owner-b', 'prep-01-01', { notes: 'Private B' });
    assert.equal((await api.getPreparation('owner-a', query())).questions[0].personal.notes, 'Private A');
    assert.ok(api.operations.every(operation => ['owner-a', 'owner-b'].includes(operation[1].user)));
    assert.equal(await api.savePreparation('owner-a', 'prep-99-99', { practiced: true }), null);
});

test('validation rejects invalid filters, identifiers in payloads, coercive booleans and excessive private text', () => {
    for (const value of [{ page: -1 }, { limit: 100 }, { category: {$ne: ''} }, { status: 'anything' }, { search: 'a'.repeat(121) }]) assert.ok(preparationQuery.validate(value).error);
    for (const value of [undefined, null, {}, { user: 'other-owner' }, { practiced: 'true' }, { answer: 'a'.repeat(10001) }, { notes: 'a'.repeat(5001) }, { revisionStatus: 'wrong' }]) assert.ok(preparationPatch.validate(value, { stripUnknown: false }).error);
    assert.equal(preparationPatch.validate({ notes: '', answer: '', bookmarked: true }).error, undefined);
});

test('duplicate insert races retry a scoped update instead of another insert', async () => {
    const api = service(); let attempts = 0;
    api.model.findOneAndUpdate = (filter, update, options) => ({ lean: async () => {
        attempts++; assert.equal(filter.user, 'owner-a'); assert.equal(filter.questionId, 'prep-01-01');
        if (attempts === 1) { const error = Error('duplicate'); error.code = 11000; throw error; }
        assert.equal(options.upsert, undefined);
        return { questionId: filter.questionId, ...update.$set };
    } });
    const result = await api.savePreparation('owner-a', 'prep-01-01', { bookmarked: true });
    assert.equal(attempts, 2); assert.equal(result.personal.bookmarked, true);
});

test('summary counts known practiced questions once and ignores legacy scores and manual overrides', () => {
    const { calculateSummary } = require('../services/dashboardProgressService');
    const interviews = [{ questionId: 'prep-01-01', practiced: false, updatedAt: '2026-01-01' }, { questionId: 'prep-01-01', practiced: true, updatedAt: '2026-02-01' }, { questionId: 'unknown', practiced: true }];
    const result = calculateSummary({ dsa: [], skills: [], roadmaps: [], interviews, manual: [{ category: 'interview', percentage: 100 }], curriculum: { phases: [] } });
    assert.equal(result.find(item => item.category === 'interview').percentage, 100 / 32);
    assert.equal(result.length, 6);
    assert.equal(result.find(item => item.category === 'projects').percentage, 0);
    const complete = catalog.preparationProgress(catalog.questionIds.map(questionId => ({ questionId, practiced: true })));
    assert.equal(complete.percentage, 100); assert.equal(complete.remaining, 0);
});

test('existing Interview model accepts bookmark-only preparation but still requires evaluation answers', async () => {
    const Interview = require('../models/Interview');
    const owner = '000000000000000000000001';
    await assert.doesNotReject(new Interview({ user: owner, kind: 'preparation', questionId: 'prep-01-01', question: 'Question', bookmarked: true }).validate());
    await assert.rejects(new Interview({ user: owner, question: 'Question' }).validate(), /answer/);
    assert.ok(Interview.schema.indexes().some(([fields, options]) => fields.user === 1 && fields.questionId === 1 && options.unique && options.partialFilterExpression.kind === 'preparation'));
});

test('preparation routes keep authentication; invalid IDs, unknown questions and storage errors have safe responses', async () => {
    const auth = () => {}; const calls = []; const module = { exports: {} };
    const controller = { getQuestions() {}, submitAnswer() {}, getPreparation() {}, savePreparation() {} };
    vm.runInNewContext(fs.readFileSync(require.resolve('../routes/interviewRoutes'), 'utf8'), { module, require: name => name === 'express' ? { Router: () => ({ get: (...args) => calls.push(args), put: (...args) => calls.push(args), post: (...args) => calls.push(args) }) } : name.includes('authMiddleware') ? auth : name.includes('interviewController') ? controller : () => {} });
    assert.equal(calls.length, 4); assert.ok(calls.every(call => call[1] === auth));
    const load = { exports: {} };
    vm.runInNewContext(fs.readFileSync(require.resolve('../controllers/interviewController'), 'utf8'), { module: load, console, require: name => name.includes('Validator') ? { preparationQuery, preparationPatch } : { savePreparation: async (_owner, id) => { if (id === 'prep-01-01') throw Error('PRIVATE_DB_DETAIL'); return null; }, getPreparation: async () => { throw Error('PRIVATE_DB_DETAIL'); } } });
    const invoke = async (method, req) => { const res = { set() {return this;}, status(code) {this.code=code;return this;}, json(body) {this.body=body;return this;} }; await load.exports[method](req,res); assert.ok(!JSON.stringify(res.body).includes('PRIVATE_DB_DETAIL')); return res; };
    for (const [id, expected] of [['invalid',400],['prep-99-99',404],['prep-01-01',503]]) assert.equal((await invoke('savePreparation',{user:{userId:'owner-a'},params:{questionId:id},body:{practiced:true}})).code,expected);
    assert.equal((await invoke('getPreparation',{user:{userId:'owner-a'},query:{}})).code,503);
});
