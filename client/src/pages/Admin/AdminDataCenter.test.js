import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import React from '../../../node_modules/react/index.js';
import { renderToStaticMarkup } from '../../../node_modules/react-dom/server.node.js';
import { transformWithOxc } from '../../../node_modules/vite/dist/node/index.js';

const source = fs.readFileSync(new URL('./AdminDataCenter.jsx', import.meta.url), 'utf8');
const compiled = (await transformWithOxc(source, 'AdminDataCenter.jsx', { jsx: { runtime: 'classic' } })).code
    .replace(/^import[\s\S]*?;\s*/gm, '').replace(/export default \w+;?/, '');
const { RecordFields, RecordValue } = new Function('React', `${compiled}; return { RecordFields, RecordValue };`)(React);
const render = value => renderToStaticMarkup(React.createElement(RecordFields, { value }));

test('nested user and social data render as labeled fields without mutating records', () => {
    const record = { user: { name: 'Example User', email: 'person@example.test', role: 'admin', _id: 'user-123' }, socialLinks: { github: 'https://github.com/example', linkedin: '', portfolio: null }, __v: 2 };
    const before = JSON.stringify(record);
    const html = render(record);
    for (const label of ['name', 'email', 'role', 'ID', 'Social Links', 'GitHub', 'LinkedIn', 'Portfolio']) assert.ok(html.includes(`<dt>${label}</dt>`), label);
    assert.ok(html.includes('person@example.test'));
    assert.equal((html.match(/Not provided/g) || []).length, 2);
    assert.ok(!html.includes('__v'));
    assert.ok(!html.includes('<pre'));
    assert.equal(JSON.stringify(record), before);
});

test('missing and empty values use a consistent placeholder while false and zero survive', () => {
    for (const value of [null, undefined, '', '  ', [], {}]) {
        assert.match(renderToStaticMarkup(React.createElement(RecordValue, { value })), /Not provided/);
    }
    assert.match(render({ enabled: false, completed: 0 }), /<dd>false<\/dd>/);
    assert.match(render({ enabled: false, completed: 0 }), /<dd>0<\/dd>/);
});

test('heterogeneous arrays and nested objects retain all entries and readable labels', () => {
    const html = render({ education: [{ schoolName: 'Example School', years: [2024, 2025] }, null, false, 0, ['Nested value']], socialLinks: {} });
    assert.match(html, /<dt>school Name<\/dt>/);
    for (const value of ['Example School', '2024', '2025', 'false', '0', 'Nested value', 'GitHub', 'LinkedIn', 'Portfolio']) assert.ok(html.includes(value), value);
    assert.ok(html.includes('<ol'));
});

test('debugging disclosure still renders the original record JSON', () => {
    assert.ok(source.includes('<summary>View raw JSON</summary>'));
    assert.ok(source.includes('JSON.stringify(record,null,2)'));
    assert.ok(source.includes('<RecordFields value={record} />'));
});
