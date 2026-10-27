import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import React from "../../../node_modules/react/index.js";
import { transformWithOxc } from "../../../node_modules/vite/dist/node/index.js";

const source = fs.readFileSync(new URL("./Dashboard.jsx", import.meta.url), "utf8");
const compiled = (await transformWithOxc(source, "Dashboard.jsx", { jsx: { runtime: "classic" } })).code
    .replace(/^import[\s\S]*?;\s*/gm, "")
    .replace(/export default (\w+);?/, "")
    .replace("const quickActions =", "capture({ dashboardData, getPercentage, getProgressLabel }); const quickActions =");
const response = percentages => ({ success: true, data: ["dsa", "skills", "projects", "interview", "roadmap", "career"].map((category, i) => ({
    category, percentage: percentages[i], complete: percentages[i] === 100, active: percentages[i] > 0
})) });

function mount() {
    const slots = [], requests = [], listeners = new Map();
    let index = 0, dirty = true, effects = [], snapshot;
    const scope = { React, console: { error() {} }, useNavigate: () => () => {}, useAuth: () => ({ user: { _id: "fixture" } }),
        capture: value => { snapshot = value; },
        useState(initial) { const i = index++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = value; dirty = true; }]; },
        useMemo: fn => fn(),
        useEffect(fn) { const i = index++; if (!(i in slots)) { slots[i] = true; effects.push(() => { slots[i] = fn(); }); } },
        getDashboardProgress: () => new Promise((resolve, reject) => requests.push({ resolve, reject })),
        window: { addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name), location: { reload() {} } }
    };
    const Component = new Function("scope", `with(scope){${compiled};return Dashboard;}`)(scope);
    const flush = () => { let count = 0; while (dirty) { assert.ok(++count < 20); dirty = false; index = 0; effects = []; Component(); effects.forEach(fn => fn()); } };
    const settle = async () => { await new Promise(resolve => setImmediate(resolve)); flush(); };
    flush();
    return { requests, snapshot: () => snapshot, focus: () => listeners.get("focus")(),
        async resolve(i, data) { requests[i].resolve(data); await settle(); },
        async reject(i) { requests[i].reject(Error("Unavailable fixture")); await settle(); },
        unmount() { slots.filter(value => typeof value === "function").forEach(fn => fn()); }, listeners };
}

test("Dashboard keeps six-category weighting and completion flags before display rounding", async () => {
    const app = mount();
    await app.resolve(0, response([99.6, 100, 100, 100, 100, 0]));
    assert.equal(app.snapshot().dashboardData.totalAreas, 6);
    assert.equal(app.snapshot().dashboardData.overallProgress, 83);
    assert.equal(app.snapshot().dashboardData.activeAreas, 5);
    assert.equal(app.snapshot().dashboardData.completedAreas, 4);
    assert.equal(app.snapshot().getPercentage("dsa"), 100);
});

test("overall readiness and active counts use unrounded percentages", async () => {
    const app = mount();
    await app.resolve(0, response([0.49, 0.49, 0.49, 0.49, 0.49, 1.49]));
    assert.equal(app.snapshot().dashboardData.overallProgress, 1);
    assert.equal(app.snapshot().dashboardData.activeAreas, 6);
    assert.equal(app.snapshot().dashboardData.completedAreas, 0);
});

test("malformed response and failed requests use existing unavailable status; focus recovers", async () => {
    const app = mount();
    await app.resolve(0, { success: true, data: [] });
    assert.equal(app.snapshot().getProgressLabel(0), "Unavailable");
    app.focus(); await app.resolve(1, response([20, 0, 0, 0, 0, 0]));
    assert.equal(app.snapshot().getPercentage("dsa"), 20);
    app.focus(); await app.reject(2);
    assert.equal(app.snapshot().getPercentage("dsa"), 20);
    assert.equal(app.snapshot().getProgressLabel(20), "Unavailable");
    app.focus(); await app.resolve(3, response([0, 0, 0, 0, 0, 0]));
    assert.equal(app.snapshot().getProgressLabel(0), "Not started");
});

test("obsolete responses cannot overwrite newer focus refresh and listeners clean up", async () => {
    const app = mount();
    app.focus();
    await app.resolve(1, response([50, 0, 0, 0, 0, 0]));
    await app.resolve(0, response([10, 0, 0, 0, 0, 0]));
    assert.equal(app.snapshot().getPercentage("dsa"), 50);
    app.unmount(); assert.equal(app.listeners.size, 0);
});
