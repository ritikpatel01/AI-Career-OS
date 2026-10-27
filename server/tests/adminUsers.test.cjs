const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const accounts = [
    { _id: '000000000000000000000001', name: 'cat  patel', email: 'cat@gmail.com', role: 'user' },
    { _id: '000000000000000000000002', name: 'Other Account', email: 'other+tag@example.test', role: 'admin' },
];

function controller({ adminCount = 2 } = {}) {
    let saves = 0;
    const matches = filter => accounts.filter(user => !filter.$or || filter.$or.some(clause =>
        Object.entries(clause).some(([key, value]) => new RegExp(value.$regex, value.$options).test(user[key]))));
    const User = {
        find(filter) {
            let skip = 0, limit = 25;
            return {
                select(fields) { assert.equal(fields, '_id name email role createdAt'); return this; },
                sort() { return this; },
                skip(value) { skip = value; return this; },
                limit(value) { limit = value; return this; },
                lean: async () => matches(filter).slice(skip, skip + limit),
            };
        },
        countDocuments: filter => filter.role ? { session: async () => adminCount } : Promise.resolve(matches(filter).length),
        updateOne: async () => ({ matchedCount: 1 }),
        findById: id => {
            const account = accounts.find(user => user._id === id);
            return { session: async () => account && { ...account, save: async () => { saves++; } } };
        },
    };
    const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(require.resolve('../controllers/adminUserController'), 'utf8'), {
        module, console,
        require: id => id === 'mongoose' ? { Types: { ObjectId: { isValid: value => /^[a-f\d]{24}$/i.test(value) } }, connection: { transaction: async callback => callback({ fixture: true }) } } : User,
    });
    const invoke = async (method, req) => {
        const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
        await module.exports[method](req, response);
        return JSON.parse(JSON.stringify({ status: response.statusCode, body: response.body }));
    };
    return { invoke, saves: () => saves };
}

test('full/partial names and emails match stored whitespace and case consistently', async () => {
    const { invoke } = controller();
    for (const search of ['cat patel', ' CAT   PATEL ', 'cat\tpatel', 'cat', 'pat', 'cat@gmail.com', 'CAT@GMAIL.COM', '@gmail', 'cat@gmail']) {
        const response = await invoke('getAllUsers', { query: { search, page: '1', limit: '25' } });
        assert.equal(response.status, 200, search);
        assert.deepEqual(response.body.data.map(user => user.email), ['cat@gmail.com'], search);
        assert.equal(response.body.pagination.total, 1);
    }
});

test('unmatched and regex-special queries remain literal; pagination uses the filtered count', async () => {
    const { invoke } = controller();
    for (const search of ['nobody', '.*', 'cat@gmailXcom']) {
        const { body } = await invoke('getAllUsers', { query: { search } });
        assert.deepEqual(body.data, []);
        assert.equal(body.pagination.total, 0);
    }
    const plus = await invoke('getAllUsers', { query: { search: 'other+tag' } });
    assert.equal(plus.body.data[0].email, 'other+tag@example.test');
    const paged = await invoke('getAllUsers', { query: { page: '2', limit: '1', search: '' } });
    assert.equal(paged.body.data.length, 1);
    assert.deepEqual(paged.body.pagination, { page: 2, limit: 1, total: 2, pages: 2 });
});

test('self-role changes, invalid roles, and last-admin demotion remain blocked', async () => {
    const api = controller({ adminCount: 1 });
    const adminUser = { _id: accounts[1]._id };
    const self = await api.invoke('changeUserRole', { params: { userId: adminUser._id }, body: { role: 'user' }, adminUser });
    assert.equal(self.status, 400);
    assert.match(self.body.message, /own role/);
    const last = await api.invoke('changeUserRole', { params: { userId: accounts[1]._id }, body: { role: 'user' }, adminUser: { _id: '000000000000000000000099' } });
    assert.equal(last.status, 409);
    assert.match(last.body.message, /last administrator/);
    const invalid = await api.invoke('changeUserRole', { params: { userId: accounts[0]._id }, body: { role: 'owner' }, adminUser });
    assert.equal(invalid.status, 400);
    assert.equal(api.saves(), 0);
});

test('admin authorization uses the database role and rejects missing identity', async () => {
    for (const role of ['user', 'admin', null]) {
        const module = { exports: {} };
        vm.runInNewContext(fs.readFileSync(require.resolve('../middleware/adminMiddleware'), 'utf8'), {
            module, console,
            require: id => id === 'mongoose' ? { Types: { ObjectId: { isValid: () => true } } }
                : { findById: () => ({ select: async () => role && ({ role }) }) },
        });
        const req = { user: { userId: accounts[0]._id, role: 'admin' } };
        let nextCalled = false, status;
        const res = { status(code) { status = code; return this; }, json() {} };
        await module.exports(req, res, () => { nextCalled = true; });
        assert.equal(nextCalled, role === 'admin');
        if (role !== 'admin') assert.equal(status, role ? 403 : 401);
        await module.exports({}, res, () => assert.fail('missing identity must not pass'));
        assert.equal(status, 401);
    }
});
