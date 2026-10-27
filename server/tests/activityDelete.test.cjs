const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const mongoose = require('mongoose');

const owner = '000000000000000000000001', id = '000000000000000000000002';
function controller(remove) {
    const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(require.resolve('../controllers/activityController'), 'utf8'), {
        module, console: { error() {} }, require: name => name === 'mongoose' ? mongoose : { deleteActivity: remove }
    });
    return async activityId => {
        const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
        await module.exports.removeActivity({ params: { id: activityId }, user: { userId: owner } }, res);
        return res;
    };
}

test('invalid activity IDs fail before accessing persistence', async () => {
    const invoke = controller(() => { throw Error('Must not be called'); });
    assert.equal((await invoke('invalid')).code, 400);
});

test('delete forwards authenticated identity and returns not-found without leaking ownership', async () => {
    const calls = [];
    const invoke = controller(async (...args) => { calls.push(args); return null; });
    const res = await invoke(id);
    assert.deepEqual(calls, [[owner, id]]); assert.equal(res.code, 404);
    assert.equal(res.body.message, 'Activity not found');
});

test('success and storage failures preserve safe envelopes', async () => {
    assert.equal((await controller(async () => ({ _id: id }))(id)).body.success, true);
    const res = await controller(async () => { throw Error('PRIVATE_STORAGE_SENTINEL'); })(id);
    assert.equal(res.code, 500); assert.ok(!JSON.stringify(res.body).includes('PRIVATE_STORAGE_SENTINEL'));
});

test('service deletion is always owner-scoped and the route requires authentication', async () => {
    let filter; const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(require.resolve('../services/activityService'), 'utf8'), {
        module, require: () => ({ findOneAndDelete: async value => { filter = value; return null; } })
    });
    await module.exports.deleteActivity(owner, id);
    assert.deepEqual(JSON.parse(JSON.stringify(filter)), { _id: id, user: owner });
    const routes = fs.readFileSync(require.resolve('../routes/activityRoutes'), 'utf8');
    assert.match(routes, /router\.delete\("\/:id", authMiddleware, removeActivity\)/);
});
