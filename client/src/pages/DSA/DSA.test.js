import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import React from "../../../node_modules/react/index.js";
import { transformWithOxc } from "../../../node_modules/vite/dist/node/index.js";
import { calculateDSAProgress, getCanonicalDSATopics, filterDSATopics, validateDSAForm } from "../../utils/dsaProgress.js";

const source = fs.readFileSync(new URL("./DSA.jsx", import.meta.url), "utf8");
const compiled = (await transformWithOxc(source, "DSA.jsx", { jsx: { runtime: "classic" } })).code
    .replace(/^import[\s\S]*?;\s*/gm, "").replace("export default function DSA", "function DSA");
const record = solved => ({ _id: "fixture-topic", topic: "Arrays", problemTarget: 30, problemsSolved: solved });

function mount() {
    const slots = [], requests = [], updates = [], creates = [];
    let saveFailure = false;
    let index = 0, dirty = true, effects = [], tree;
    const scope = { React, calculateDSAProgress, getCanonicalDSATopics, filterDSATopics, validateDSAForm, AbortController, console: { log() {}, error() {} }, window: { scrollTo() {}, matchMedia: () => ({ matches: true }) },
        useRef(value) { const i = index++; return slots[i] ||= { current: value }; },
        useState(initial) { const i = index++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = typeof value === "function" ? value(slots[i]) : value; dirty = true; }]; },
        useEffect(fn) { const i = index++; if (!(i in slots)) { slots[i] = true; effects.push(fn); } },
        getDSA: () => new Promise((resolve, reject) => requests.push({ resolve, reject })),
        updateDSA: async (...args) => { updates.push(args); if (saveFailure) throw Error("Save failed fixture"); return { success: true }; },
        createDSA: async payload => { creates.push(payload); return { success: true }; }
    };
    const Component = new Function("scope", `with(scope){${compiled};return DSA;}`)(scope);
    const flush = () => { let count = 0; while (dirty) { assert.ok(++count < 20); dirty = false; index = 0; effects = []; tree = Component(); effects.forEach(fn => fn()); } };
    const settle = async () => { await new Promise(resolve => setImmediate(resolve)); flush(); };
    const nodes = node => !node || typeof node !== "object" ? [] : Array.isArray(node) ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)];
    const text = node => node == null || typeof node === "boolean" ? "" : Array.isArray(node) ? node.map(text).join("") : typeof node === "object" ? text(node.props?.children) : String(node);
    flush();
    return { requests, updates, creates, flush, settle, rejectSave: () => { saveFailure = true; }, nodes: () => nodes(tree),
        summary: () => text(nodes(tree).find(node => node.props?.["aria-labelledby"] === "dsa-summary-title")),
        async resolve(i, records) { requests[i].resolve({ success: true, data: { topics: records } }); await settle(); },
        async fail(i) { requests[i].reject(Error("Unavailable fixture")); await settle(); }
    };
}

test("summary appears above update form and recomputes from refreshed records after save", async () => {
    const app = mount(); await app.resolve(0, [record(5)]);
    assert.match(app.summary(), /Average DSA Progress/);
    assert.match(app.summary(), /Problems solved5/);
    assert.match(app.summary(), /Total problem target485/);
    const nodes = app.nodes();
    assert.ok(nodes.findIndex(node => node.props?.["aria-labelledby"] === "dsa-summary-title") < nodes.findIndex(node => node.type === "form"));
    const edit = nodes.find(node => node.type === "button" && node.props.children?.trim?.() === "Edit Topic");
    assert.ok(edit); edit.props.onClick(); app.flush();
    app.nodes().find(node => node.props?.id === "problemsSolved").props.onChange({ target: { name: "problemsSolved", value: "15" } }); app.flush();
    const pending = app.nodes().find(node => node.type === "form").props.onSubmit({ preventDefault() {} });
    await app.settle();
    assert.equal(app.updates[0][1].problemsSolved, 15);
    await app.resolve(1, [record(15)]); await pending; app.flush();
    assert.match(app.summary(), /Problems solved15/);
    assert.match(app.summary(), /Remaining problems470/);
});

test("fetch failures show unavailable summary rather than confirmed zero", async () => {
    const app = mount(); await app.fail(0);
    assert.match(app.summary(), /Progress is unavailable/);
    assert.doesNotMatch(app.summary(), /Problems solved0/);
});

test("invalid counts do not write; failed saves retain the user's draft", async () => {
    const app = mount(); await app.resolve(0, [record(5)]);
    app.nodes().find(node => node.type === "button" && node.props.children === "Edit Topic").props.onClick(); app.flush();
    const change = value => { app.nodes().find(node => node.props?.id === "problemsSolved").props.onChange({ target: { name: "problemsSolved", value } }); app.flush(); };
    change("31");
    await app.nodes().find(node => node.type === "form").props.onSubmit({ preventDefault() {} }); app.flush();
    assert.equal(app.updates.length, 0);
    change("15"); app.rejectSave();
    await app.nodes().find(node => node.type === "form").props.onSubmit({ preventDefault() {} }); app.flush();
    assert.equal(app.nodes().find(node => node.props?.id === "problemsSolved").props.value, "15");
    assert.ok(app.nodes().some(node => node.props?.role === "alert"));
});

test("missing topics do not write on load; an explicit save creates once and refreshes", async () => {
    const app = mount(); await app.resolve(0, []);
    assert.equal(app.creates.length, 0);
    app.nodes().find(node => node.type === "button" && node.props.children === "Edit Topic").props.onClick(); app.flush();
    const submit = app.nodes().find(node => node.type === "form").props.onSubmit;
    const pending = submit({ preventDefault() {} });
    await submit({ preventDefault() {} });
    await app.settle();
    assert.equal(app.creates.length, 1);
    await app.resolve(1, [record(0)]); await pending; app.flush();
    assert.equal(app.updates.length, 0);
});
