const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

test("read-only DSA mode uses owner-scoped find only; initialization and writes cannot execute", async () => {
    const module = { exports: {} };
    const canonical = require("../../client/src/data/dsaRoadmap.json");
    let reads = 0;
    vm.runInNewContext(fs.readFileSync(require.resolve("../services/dsaService"), "utf8"), {
        module,
        require: name => name.endsWith("dsaRoadmap.json") ? canonical : new Proxy({}, {
            get(_, key) {
                assert.equal(key, "find", "only a read method may be accessed");
                return filter => { reads++; assert.equal(filter.user, "owner-fixture"); assert.equal(filter.topic.$in.length, 20); return { lean: async () => [] }; };
            }
        })
    });
    assert.deepEqual(await module.exports.getReadOnlyDSATopics("owner-fixture"), []);
    assert.equal(reads, 1);
});

test("readOnly=true is additive; default DSA GET retains its existing service contract", async () => {
    for (const readOnly of [undefined, "true"]) {
        const module = { exports: {} };
        let read = 0, legacy = 0;
        vm.runInNewContext(fs.readFileSync(require.resolve("../controllers/dsaController"), "utf8"), {
            module, console,
            require: () => ({ getReadOnlyDSATopics: async id => { assert.equal(id, "owner-fixture"); read++; return []; }, getDSAProgress: async () => { legacy++; return { topics: [], progress: 0 }; } })
        });
        const response = { status(code) { assert.equal(code, 200); return this; }, json(body) { assert.equal(body.success, true); } };
        await module.exports.getProgress({ user: { userId: "owner-fixture" }, query: { readOnly } }, response);
        assert.equal(read, readOnly === "true" ? 1 : 0);
        assert.equal(legacy, readOnly === "true" ? 0 : 1);
    }
});
