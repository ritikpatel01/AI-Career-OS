import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import React from '../../../node_modules/react/index.js';
import { transformWithOxc } from '../../../node_modules/vite/dist/node/index.js';

const source = fs.readFileSync(new URL('./ManageUsers.jsx', import.meta.url), 'utf8');
const compiled = (await transformWithOxc(source, 'ManageUsers.jsx', { jsx: { runtime: 'classic' } })).code
    .replace(/^import[\s\S]*?;\s*/gm, '')
    .replace(/export\s*\{[\s\S]*?\};?\s*$/, '')
    .replace(/export default (\w+);?/, '');
const cat = { _id: 'fixture-cat', name: 'cat  patel', email: 'cat@gmail.com', role: 'user' };
const response = (data = [cat], page = 1, total = data.length) => ({ data, pagination: { page, limit: 25, total, pages: Math.ceil(total / 25) } });
const tick = () => new Promise(resolve => setImmediate(resolve));

// Exercise the real compiled page and its event handlers with deterministic hook
// scheduling and deferred service responses. Browser checks cover real React DOM.
function mount() {
    const slots = [], requests = [], roleChanges = [], confirmations = [];
    let index = 0, dirty = true, tree, effects = [], confirmed = true;
    const changed = (a, b) => !a || !b || a.length !== b.length || a.some((value, i) => !Object.is(value, b[i]));
    const scope = {
        React,
        useState(initial) {
            const i = index++;
            if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
            return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; dirty = true; }];
        },
        useRef(value) { const i = index++; return slots[i] ||= { current: value }; },
        useCallback(fn, deps) { const i = index++; if (changed(slots[i]?.deps, deps)) slots[i] = { fn, deps }; return slots[i].fn; },
        useEffect(fn, deps) {
            const i = index++;
            if (changed(slots[i]?.deps, deps)) {
                const previous = slots[i]; slots[i] = { deps };
                effects.push(() => { previous?.cleanup?.(); slots[i].cleanup = fn(); });
            }
        },
        getAdminUsers: params => new Promise((resolve, reject) => requests.push({ params, resolve, reject })),
        changeAdminUserRole: async (...args) => { roleChanges.push(args); return { message: 'Role updated' }; },
        window: { confirm: message => { confirmations.push(message); return confirmed; } },
    };
    const Component = new Function('scope', `with(scope){${compiled};return ManageUsers;}`)(scope);
    const flush = () => {
        let count = 0;
        while (dirty) {
            assert.ok(++count < 30, 'render cycle must settle');
            dirty = false; index = 0; effects = []; tree = Component();
            for (const effect of effects) effect();
        }
    };
    const nodes = node => !node || typeof node !== 'object' ? [] : Array.isArray(node)
        ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)];
    const text = node => node == null || typeof node === 'boolean' ? '' : Array.isArray(node)
        ? node.map(text).join('') : typeof node === 'object' ? text(node.props?.children) : String(node);
    const button = label => nodes(tree).find(node => node.type === 'button' && text(node).trim() === label);
    const settle = async () => { await tick(); flush(); await tick(); flush(); };
    flush();
    return {
        requests, roleChanges, confirmations, button, flush, settle,
        text: () => text(tree),
        confirm: value => { confirmed = value; },
        submit(value) {
            nodes(tree).find(node => node.type === 'input').props.onChange({ target: { value } }); flush();
            nodes(tree).find(node => node.type === 'form').props.onSubmit({ preventDefault() {} }); flush();
        },
        refresh() { button('Refresh').props.onClick(); flush(); },
        resolve(i, data = response()) { requests[i].resolve(data); return settle(); },
        reject(i, message = 'Network unavailable') { requests[i].reject(new Error(message)); return settle(); },
    };
}

test('search resets pagination and repeated submission actually reloads', async () => {
    const app = mount(); await app.resolve(0, response([cat], 1, 60));
    app.button('Next').props.onClick(); app.flush();
    assert.equal(app.requests[1].params.page, 2);
    await app.resolve(1, response([cat], 2, 60));
    app.submit(' cat   patel ');
    assert.deepEqual(app.requests.at(-1).params, { page: 1, limit: 25, search: 'cat patel' });
    await app.resolve(2);
    app.submit('cat patel');
    assert.equal(app.requests.length, 4);
});

test('Refresh clears search and always reloads the complete list from page 1', async () => {
    const app = mount(); await app.resolve(0);
    app.submit('cat'); await app.resolve(1);
    app.refresh();
    assert.deepEqual(app.requests.at(-1).params, { page: 1, limit: 25, search: '' });
    await app.resolve(2, response([cat], 1, 80));
    assert.match(app.text(), /80/);
    app.refresh(); assert.equal(app.requests.length, 4);
});

test('late search responses and failures cannot overwrite newer results or loading state', async () => {
    const app = mount(); await app.resolve(0);
    app.submit('older'); app.submit('newer');
    await app.resolve(2, response([{ ...cat, name: 'Newest account' }]));
    await app.reject(1, 'Old request failed');
    assert.match(app.text(), /Newest account/);
    assert.doesNotMatch(app.text(), /Old request failed|No users found/);
    app.submit('pending'); app.refresh();
    await app.resolve(3, response([]));
    assert.match(app.text(), /Loading registered users/);
    await app.resolve(4);
    assert.match(app.text(), /cat@gmail.com/);
});

test('an error is not presented as an empty search; Refresh recovers', async () => {
    const app = mount(); await app.reject(0);
    assert.match(app.text(), /Network unavailable/);
    assert.doesNotMatch(app.text(), /No users found|Page 1 of/);
    app.refresh(); await app.resolve(1, response([]));
    assert.match(app.text(), /No users found/);
    assert.doesNotMatch(app.text(), /Network unavailable/);
});

test('malformed list responses are errors rather than false empty results', async () => {
    const app = mount(); await app.resolve(0, { data: { users: [cat] } });
    assert.match(app.text(), /Invalid user list response/);
    assert.doesNotMatch(app.text(), /No users found/);
});

test('role changes still require confirmation and reload the current query', async () => {
    const app = mount(); await app.resolve(0);
    app.submit('cat'); await app.resolve(1);
    app.confirm(false); await app.button('Make Admin').props.onClick();
    assert.equal(app.roleChanges.length, 0);
    app.confirm(true); app.button('Make Admin').props.onClick(); await app.settle();
    assert.deepEqual(app.roleChanges, [['fixture-cat', 'admin']]);
    assert.match(app.confirmations[0], /cat  patel/);
    assert.deepEqual(app.requests.at(-1).params, { page: 1, limit: 25, search: 'cat' });
    await app.resolve(2);
});
