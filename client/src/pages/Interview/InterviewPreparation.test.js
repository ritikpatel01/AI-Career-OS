import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import React from '../../../node_modules/react/index.js';
import { transformWithOxc } from '../../../node_modules/vite/dist/node/index.js';
import catalog from '../../data/interviewPreparation.json' with { type: 'json' };

const source = fs.readFileSync(new URL('./InterviewPreparation.jsx', import.meta.url), 'utf8');
const compiled = (await transformWithOxc(source, 'InterviewPreparation.jsx', { jsx: { runtime: 'classic' } })).code
    .replace(/^import[\s\S]*?;\s*/gm, '').replace('export default function InterviewPreparation', 'function InterviewPreparation');
const question = (id = 'prep-01-01', personal = {}) => ({ ...catalog.find(item => item.id === id), personal: { answer: '', notes: '', practiced: false, bookmarked: false, revisionStatus: 'not-needed', lastPracticedAt: null, ...personal } });
const response = questions => ({ success: true, data: { questions, pagination: { page: 1, limit: 12, total: questions.length, pages: 1 }, overview: { total: 32, practiced: questions.filter(item => item.personal.practiced).length, remaining: 32, percentage: 0, categories: [], recent: [] } } });
function mount() {
    const slots = [], requests = [], writes = [], listeners = new Map();
    let index = 0, dirty = true, effects = [], tree, rejectSave = false;
    const changed = (a, b) => !a || a.length !== b.length || a.some((value, i) => !Object.is(value, b[i]));
    const scope = { React, catalog, AbortController, window: { confirm: () => true, addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) },
        useState(initial) { const i = index++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; dirty = true; }]; },
        useRef(initial) { const i = index++; return slots[i] ||= { current: initial }; },
        useEffect(fn, deps) { const i = index++; if (changed(slots[i]?.deps, deps)) { const previous = slots[i]; slots[i] = { deps }; effects.push(() => { previous?.cleanup?.(); slots[i].cleanup = fn(); }); } },
        getInterviewPreparation: (filters, signal) => new Promise((resolve, reject) => requests.push({ filters, signal, resolve, reject })),
        saveInterviewPreparation: async (id, patch) => { writes.push({ id, patch }); if (rejectSave) throw Error('Save failed fixture'); return { success: true, data: question(id, patch) }; }
    };
    const Component = new Function('scope', `with(scope){${compiled};return InterviewPreparation;}`)(scope);
    const flush = () => { let count = 0; while (dirty) { assert.ok(++count < 40, 'render must settle'); dirty = false; index = 0; effects = []; tree = Component(); effects.forEach(fn => fn()); } };
    const nodes = node => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)];
    const text = node => node == null || typeof node === 'boolean' ? '' : Array.isArray(node) ? node.map(text).join('') : typeof node === 'object' ? text(node.props?.children) : String(node);
    const settle = async () => { await new Promise(resolve => setImmediate(resolve)); flush(); };
    flush();
    return { requests, writes, flush, settle, listeners,
        text: () => text(tree), nodes: () => nodes(tree),
        button: label => nodes(tree).find(node => node.type === 'button' && text(node).trim() === label),
        async resolve(i, value) { requests[i].resolve(value); await settle(); },
        async fail(i) { requests[i].reject(Error('Load failed fixture')); await settle(); },
        failSaves: () => { rejectSave = true; }
    };
}

test('initial loading, error, retry and empty results are honest and never write records', async () => {
    const app = mount(); assert.match(app.text(), /Loading questions/); assert.equal(app.writes.length, 0);
    await app.fail(0); assert.match(app.text(), /Load failed fixture/);
    app.button('Retry loading').props.onClick(); app.flush();
    await app.resolve(1, response([])); assert.match(app.text(), /No matching questions/); assert.equal(app.writes.length, 0);
});

test('answer/notes save explicitly, refresh overview, and retain draft on failures', async () => {
    const app = mount(); await app.resolve(0, response([question()]));
    app.nodes().find(node => node.props?.id === 'ip-answer').props.onChange({ target: { value: 'My answer' } });
    app.nodes().find(node => node.props?.id === 'ip-notes').props.onChange({ target: { value: 'My personal notes' } }); app.flush();
    assert.equal(app.writes.length, 0);
    const pending = app.nodes().find(node => node.type === 'form' && !node.props.className).props.onSubmit({ preventDefault() {} });
    await app.settle();
    assert.equal(app.writes[0].patch.notes, 'My personal notes');
    await app.resolve(1, response([question('prep-01-01', app.writes[0].patch)])); await pending; app.flush();
    assert.match(app.text(), /Saved to your account/);
    app.nodes().find(node => node.props?.id === 'ip-notes').props.onChange({ target: { value: 'Unsaved revision' } }); app.flush();
    app.failSaves();
    app.button('Save answer & notes').props.onClick?.();
    await app.nodes().find(node => node.type === 'form' && !node.props.className).props.onSubmit({ preventDefault() {} }); await app.settle();
    assert.equal(app.nodes().find(node => node.props?.id === 'ip-notes').props.value, 'Unsaved revision');
    assert.match(app.text(), /Save failed fixture/);
});

test('bookmark and practice changes send independent patches and ignore obsolete filter responses', async () => {
    const app = mount(); await app.resolve(0, response([question()]));
    app.nodes().find(node => node.props?.id === 'ip-notes').props.onChange({ target: { value: 'Keep this draft' } }); app.flush();
    let pending = app.button('Bookmark question').props.onClick(); await app.settle();
    assert.deepEqual(app.writes[0].patch, { bookmarked: true });
    await app.resolve(1, response([question('prep-01-01', { bookmarked: true })])); await pending; app.flush();
    assert.equal(app.nodes().find(node => node.props?.id === 'ip-notes').props.value, 'Keep this draft');
    pending = app.button('Mark practiced').props.onClick(); await app.settle();
    assert.deepEqual(app.writes[1].patch, { practiced: true });
    await app.resolve(2, response([question('prep-01-01', { practiced: true })])); await pending; app.flush();
    assert.ok(app.button('Mark not practiced'));
    const category = () => app.nodes().find(node => node.type === 'select' && node.props.name === 'category');
    category().props.onChange({ target: { name: 'category', value: 'React' } }); app.flush();
    category().props.onChange({ target: { name: 'category', value: 'Python' } }); app.flush();
    await app.resolve(4, response([question('prep-04-01')]));
    await app.resolve(3, response([question('prep-02-01')]));
    assert.equal(app.requests[3].signal.aborted, true);
    assert.ok(app.nodes().some(node => node.type === 'button' && JSON.stringify(node.props.children).includes('How do lists and tuples differ?')));
});
