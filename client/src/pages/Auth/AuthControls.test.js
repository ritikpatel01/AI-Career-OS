import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import React from '../../../node_modules/react/index.js';
import { transformWithOxc } from '../../../node_modules/vite/dist/node/index.js';

// Local hook fixtures exercise real handlers without services or account writes.
async function mount(name, overrides = {}) {
    const source = fs.readFileSync(new URL(`./${name}.jsx`, import.meta.url), 'utf8');
    const code = (await transformWithOxc(source, `${name}.jsx`, { jsx: { runtime: 'classic' } })).code
        .replace(/^import[\s\S]*?;\s*/gm, '').replace(/export default \w+;/, '')
        .replace(/export const /g, 'const ').replace(/import\.meta\.env\.VITE_API_URL/g, 'undefined');
    const slots = [];
    let index = 0;
    const requests = [];
    const scope = {
        React, Link: 'a', API_BASE_URL: '/fixture-api',
        useState(initial) {
            const i = index++;
            if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
            return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }];
        },
        useNavigate: () => () => { throw Error('Unexpected navigation'); },
        useLocation: () => ({ state: { email: 'fixture@example.test', resetToken: 'fixture-token' } }),
        useAuth: () => ({ login() { throw Error('Unexpected successful login'); } }),
        fetch: async (...args) => { requests.push(args); throw Error('Fixture request failed'); },
        registerUser: async data => { requests.push(data); throw Error('Fixture request failed'); },
        ...overrides
    };
    const Component = new Function('scope', `with(scope){${code};return ${name};}`)(scope);
    const nodes = () => {
        index = 0;
        const result = [];
        const visit = node => {
            if (Array.isArray(node)) return node.forEach(visit);
            if (!node || typeof node !== 'object') return;
            result.push(node);
            visit(node.props?.children);
        };
        visit(Component());
        return result;
    };
    const find = predicate => nodes().find(predicate);
    const input = name => find(n => n.type === 'input' && n.props.name === name);
    const change = (name, value) => input(name).props.onChange({ target: { name, value } });
    const submit = () => find(n => n.type === 'form').props.onSubmit({ preventDefault() {} });
    return { nodes, find, input, change, submit, requests };
}

test('sign-in password reveal preserves input and exposes its pressed state', async () => {
    const app = await mount('Login');
    app.change('password', 'fixture-password');
    assert.equal(app.input('password').props.type, 'password');
    const reveal = () => app.find(n => n.type === 'button' && n.props.className === 'password-action');
    reveal().props.onClick();
    assert.equal(app.input('password').props.type, 'text');
    assert.equal(app.input('password').props.value, 'fixture-password');
    assert.equal(reveal().props['aria-pressed'], true);
    reveal().props.onClick();
    assert.equal(app.input('password').props.type, 'password');
});

test('sign-in rejects invalid input locally and keeps fields after request failure', async () => {
    const app = await mount('Login');
    await app.submit();
    assert.equal(app.requests.length, 0);
    app.change('email', 'invalid');
    await app.submit();
    assert.equal(app.requests.length, 0);
    app.change('email', 'fixture@example.test');
    app.change('password', 'fixture-password');
    await app.submit();
    assert.equal(app.requests.length, 1);
    assert.equal(app.input('email').props.value, 'fixture@example.test');
    assert.equal(app.input('password').props.value, 'fixture-password');
    assert.ok(app.nodes().some(n => n.props?.children === 'Fixture request failed'));
    assert.equal(app.find(n => n.type === 'button' && n.props.type === 'submit').props.disabled, false);
});

test('registration preserves entered fields and recovers its save state after an error', async () => {
    const app = await mount('Register');
    app.change('name', 'Fixture User');
    app.change('email', 'fixture@example.test');
    app.change('password', 'fixture-password');
    await app.submit();
    assert.equal(app.requests.length, 1);
    assert.equal(app.input('name').props.value, 'Fixture User');
    assert.equal(app.input('email').props.value, 'fixture@example.test');
    assert.equal(app.input('password').props.value, 'fixture-password');
    assert.equal(app.find(n => n.type === 'button' && n.props.type === 'submit').props.disabled, false);
});

test('password reset rejects a short password before making a request', async () => {
    const app = await mount('ResetPassword');
    await app.submit();
    assert.equal(app.requests.length, 0);
    assert.ok(app.nodes().some(n => typeof n.props?.children === 'string' && n.props.children.includes('at least 8 characters')));
});
