const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function harness({ failCommit = false } = {}) {
    let users = ['1', '2'].map(n => ({ _id: n.padStart(24, '0'), name: `Fixture ${n}`, role: 'admin' }));
    let tail = Promise.resolve(), commits = 0, responses = 0;
    const events = [];
    const mongoose = {
        Types: { ObjectId: { isValid: id => /^[a-f\d]{24}$/i.test(id) } },
        connection: { transaction(callback, options) {
            assert.equal(options.readPreference, 'primary');
            assert.equal(options.writeConcern.w, 'majority');
            const run = tail.then(async () => {
                const saved = structuredClone(users), session = {};
                events.push('begin');
                try {
                    const result = await callback(session);
                    if (failCommit) throw Error('Fixture commit failure');
                    commits++; events.push('commit'); return result;
                } catch (error) { users = saved; events.push('rollback'); throw error; }
            });
            tail = run.catch(() => {}); return run;
        } }
    };
    // Serialized transaction doubles verify handler semantics; real MongoDB
    // write-conflict/retry behavior still requires a replica-set integration test.
    const User = {
        async updateOne(filter, update, { session }) {
            assert.ok(session); assert.equal(filter.role, 'admin');
            assert.equal(update.$currentDate.updatedAt, true);
            return { matchedCount: users.some(u => u._id === filter._id && u.role === 'admin') ? 1 : 0 };
        },
        findById(id) { return { session: async session => {
            assert.ok(session); const user = users.find(u => u._id === id);
            return user && { ...user, async save(options) { assert.equal(options.session, session); users.find(u => u._id === id).role = this.role; } };
        } }; },
        countDocuments(filter) { return { session: async session => { assert.ok(session); return users.filter(u => u.role === filter.role).length; } }; }
    };
    const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(require.resolve('../controllers/adminUserController'), 'utf8'), {
        module, console: { error() {} }, require: id => id === 'mongoose' ? mongoose : User
    });
    const invoke = async (actor, target) => {
        const res = { status(code) { this.code = code; return this; }, json(body) { responses++; events.push('response'); this.body = body; return this; } };
        await module.exports.changeUserRole({ params: { userId: target }, body: { role: 'user' }, adminUser: { _id: actor } }, res);
        return res;
    };
    return { invoke, ids: users.map(u => u._id), users: () => users, events, commits: () => commits, responses: () => responses };
}

test('competing cross-demotions recheck the actor and retain an administrator', async () => {
    const h = harness(), [a, b] = h.ids;
    const results = await Promise.all([h.invoke(a, b), h.invoke(b, a)]);
    assert.deepEqual(results.map(r => r.code), [200, 403]);
    assert.equal(h.users().filter(u => u.role === 'admin').length, 1);
    assert.equal(h.responses(), 2);
    assert.ok(h.events.indexOf('commit') < h.events.indexOf('response'));
});

test('failed commit rolls back role changes and emits only a failure response', async () => {
    const h = harness({ failCommit: true });
    const res = await h.invoke(...h.ids);
    assert.equal(res.code, 500); assert.equal(res.body.success, false);
    assert.equal(h.users().filter(u => u.role === 'admin').length, 2);
    assert.equal(h.commits(), 0); assert.equal(h.responses(), 1);
    assert.ok(h.events.indexOf('rollback') < h.events.indexOf('response'));
});

test('self-role restriction also rejects uppercase hexadecimal ObjectId spellings', async () => {
    const h = harness();
    const actor = 'abcdefabcdefabcdefabcdef';
    const res = await h.invoke(actor, actor.toUpperCase());
    assert.equal(res.code, 400);
    assert.match(res.body.message, /own role/);
    assert.equal(h.commits(), 0);
});
