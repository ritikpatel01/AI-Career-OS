// Real HTTP/auth/Mongoose tests against a disposable loopback replica set.
// Never loads .env. SMTP is replaced before app import; only test data is written.
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { mkdtemp, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const net = require('node:net');
const { once } = require('node:events');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const freePort = async () => {
    const server = net.createServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
    const port = server.address().port; await new Promise(resolve => server.close(resolve)); return port;
};

test('release security on isolated MongoDB and real HTTP routes (mail transport stubbed)', { timeout: 90000 }, async t => {
    const directory = await mkdtemp(join(tmpdir(), 'career-release-test-'));
    const port = await freePort();
    const child = spawn('mongod', ['--dbpath', directory, '--port', String(port), '--bind_ip', '127.0.0.1', '--replSet', 'releaseAudit', '--nounixsocket', '--quiet', '--setParameter', 'ttlMonitorEnabled=false', '--logpath', join(directory, 'mongo.log')], { stdio: 'ignore' });
    let spawnError; child.on('error', error => { spawnError = error; });
    const admin = new mongoose.mongo.MongoClient(`mongodb://127.0.0.1:${port}/?directConnection=true`, { serverSelectionTimeoutMS: 250 });
    const oldEnv = { NODE_ENV: process.env.NODE_ENV, JWT_SECRET: process.env.JWT_SECRET, CORS_ORIGINS: process.env.CORS_ORIGINS };
    const originalError = console.error, originalLog = console.log;
    const logs = []; let server;
    const emailPath = require.resolve('../services/emailService');
    const cachedEmail = require.cache[emailPath];
    try {
        let connected = false;
        for (let i = 0; i < 60; i++) {
            if (spawnError) { if (spawnError.code === 'ENOENT') { t.skip('mongod unavailable; replica-set checks not executed'); return; } throw spawnError; }
            if (child.exitCode !== null) throw Error('Disposable mongod exited before readiness');
            try { await admin.connect(); connected = true; break; } catch { await delay(100); }
        }
        assert.ok(connected, 'Disposable database did not start');
        await admin.db('admin').command({ replSetInitiate: { _id: 'releaseAudit', members: [{ _id: 0, host: `127.0.0.1:${port}` }] } });
        for (let i = 0; i < 100; i++) { if ((await admin.db('admin').command({ hello: 1 })).isWritablePrimary) break; await delay(100); }
        await mongoose.connect(`mongodb://127.0.0.1:${port}/release_security_test?replicaSet=releaseAudit`, { serverSelectionTimeoutMS: 5000 });
        process.env.NODE_ENV = 'test'; process.env.JWT_SECRET = crypto.randomBytes(48).toString('hex'); delete process.env.CORS_ORIGINS;
        const deliveries = []; let mailFails = false;
        require.cache[emailPath] = { id: emailPath, filename: emailPath, loaded: true, exports: { sendPasswordResetCode: async (email, code) => { if (mailFails) throw Error('PRIVATE_PROVIDER_SENTINEL'); deliveries.push({ email, code }); } } };
        console.error = (...args) => logs.push(args.join(' ')); console.log = () => {};
        const app = require('../app');
        const User = require('../models/User'), PasswordReset = require('../models/PasswordReset');
        await Promise.all([User.init(), PasswordReset.init()]);
        server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
        const base = `http://127.0.0.1:${server.address().port}/api`;
        const request = async (path, { method = 'GET', body, token, origin } = {}) => {
            const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(origin ? { Origin: origin } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
            return { status: response.status, data: await response.json(), headers: response.headers };
        };
        const email = 'release-test@example.com', oldPassword = 'Old-local-fixture-123!', password = 'New-local-fixture-456!';
        let oldJWT, legacyJWT, freshJWT, userId;
        const challenge = async () => {
            const r = await request('/auth/forgot-password', { method: 'POST', body: { email } }); assert.equal(r.status, 200);
            return deliveries.at(-1).code;
        };
        const verify = code => request('/auth/verify-reset-code', { method: 'POST', body: { email, code } });
        const verifiedToken = async () => { const r = await verify(await challenge()); assert.equal(r.status, 200); return r.data.data.resetToken; };
        const reset = (resetToken, newPassword = password) => request('/auth/reset-password', { method: 'POST', body: { email, resetToken, newPassword } });

        await t.test('registration/sign-in and legacy JWT compatibility before reset', async () => {
            const r = await request('/auth/register', { method: 'POST', body: { name: 'Release fixture', email, password: oldPassword } }); assert.equal(r.status, 201);
            assert.equal(r.headers.get("cache-control"), "no-store");
            oldJWT = r.data.token; userId = r.data.user.id;
            assert.equal(jwt.verify(oldJWT, process.env.JWT_SECRET).ver, 0);
            // Simulate an existing database account with no additive field and a pre-upgrade JWT.
            await User.collection.updateOne({ _id: new mongoose.Types.ObjectId(userId) }, { $unset: { authVersion: '' } });
            legacyJWT = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
            assert.equal((await request('/roadmaps', { token: legacyJWT })).status, 200);
            assert.equal((await request('/auth/login', { method: 'POST', body: { email, password: oldPassword } })).status, 200);
            assert.equal((await request('/roadmaps')).status, 401);
            assert.equal((await request('/roadmaps', { token: jwt.sign({ userId }, 'wrong-fixture-secret') })).status, 401);
            assert.equal((await request('/roadmaps', { token: jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: -1 }) })).status, 401);
        });
        await t.test('SMTP failure/unknown/success have identical public responses; failed challenge is removed and logs redacted', async () => {
            const unknown = await request('/auth/forgot-password', { method: 'POST', body: { email: 'unknown@example.com' } });
            mailFails = true; const failed = await request('/auth/forgot-password', { method: 'POST', body: { email } }); mailFails = false;
            assert.equal(failed.status, 200); assert.deepEqual(failed.data, unknown.data);
            assert.equal(await PasswordReset.countDocuments({ email }), 0);
            const success = await request('/auth/forgot-password', { method: 'POST', body: { email } });
            assert.deepEqual(success.data, unknown.data); assert.equal(success.headers.get('cache-control'), 'no-store');
            assert.ok(!logs.join(' ').includes('PRIVATE_PROVIDER_SENTINEL'));
            const find = User.findOne;
            try {
                User.findOne = async () => { throw Error('PRIVATE_LOOKUP_SENTINEL'); };
                const unavailable = await request('/auth/forgot-password', { method: 'POST', body: { email } });
                assert.equal(unavailable.status, 200); assert.deepEqual(unavailable.data, unknown.data);
                assert.ok(!logs.join(' ').includes('PRIVATE_LOOKUP_SENTINEL'));
            } finally { User.findOne = find; }

        });
        await t.test('verification expiry, concurrent attempt cap, one-use code and aligned TTL', async () => {
            const expiredCode = await challenge(); await PasswordReset.updateOne({ email }, { $set: { expiresAt: new Date(Date.now() - 1000) } }); assert.equal((await verify(expiredCode)).status, 400);
            await challenge(); const attempts = await Promise.all(Array.from({ length: 12 }, () => verify('invalid-code')));
            assert.equal(attempts.filter(r => r.status === 400).length, 5); assert.equal(attempts.filter(r => r.status === 429).length, 7);
            assert.equal((await PasswordReset.findOne({ email })).attempts, 5);
            const code = await challenge(); await PasswordReset.updateOne({ email }, { $set: { expiresAt: new Date(Date.now() + 30000) } });
            const results = await Promise.all([verify(code), verify(code)]); assert.equal(results.filter(r => r.status === 200).length, 1);
            assert.equal((await verify(code)).status, 400);
            const record = await PasswordReset.findOne({ email }); assert.equal(record.expiresAt.getTime(), record.resetTokenExpiresAt.getTime()); assert.ok(record.expiresAt > new Date(Date.now() + 9 * 60000));
            assert.ok((await PasswordReset.collection.indexes()).some(i => i.key.expiresAt === 1 && i.expireAfterSeconds === 0));
        });
        await t.test('expired/invalid tokens and short passwords rejected without changing account', async () => {
            const token = await verifiedToken();
            assert.equal((await reset(token, 'short')).status, 400); assert.equal((await reset('invalid-token')).status, 400);
            await PasswordReset.updateOne({ email }, { $set: { resetTokenExpiresAt: new Date(Date.now() - 1000) } }); assert.equal((await reset(token)).status, 400);
            const token2 = await verifiedToken(); await PasswordReset.updateOne({ email }, { $set: { expiresAt: new Date(Date.now() - 1000) } }); assert.equal((await reset(token2)).status, 400);
            assert.equal((await request('/auth/login', { method: 'POST', body: { email, password: oldPassword } })).status, 200);
        });
        await t.test('two concurrent resets commit exactly once and invalidate old JWTs atomically', async () => {
            const token = await verifiedToken(); const results = await Promise.all([reset(token), reset(token)]);
            assert.equal(results.filter(r => r.status === 200).length, 1); assert.equal(results.filter(r => r.status === 400).length, 1);
            assert.equal((await User.findById(userId)).authVersion, 1); assert.equal((await reset(token)).status, 400);
            for (const token of [oldJWT, legacyJWT]) assert.equal((await request('/roadmaps', { token })).status, 401);
            assert.equal((await request('/auth/login', { method: 'POST', body: { email, password: oldPassword } })).status, 401);
            const login = await request('/auth/login', { method: 'POST', body: { email, password } }); assert.equal(login.status, 200); freshJWT = login.data.token;
            assert.equal(jwt.verify(freshJWT, process.env.JWT_SECRET).ver, 1); assert.equal((await request('/roadmaps', { token: freshJWT })).status, 200);
        });
        await t.test('failed password write rolls back consumption/version; retry can succeed', async () => {
            const token = await verifiedToken(); const original = User.updateOne;
            try { User.updateOne = async () => { throw Error('PRIVATE_DB_SENTINEL'); }; assert.equal((await reset(token)).status, 500); } finally { User.updateOne = original; }
            assert.equal((await PasswordReset.findOne({ email, resetTokenHash: crypto.createHash('sha256').update(token).digest('hex') })).usedAt, null); assert.equal((await User.findById(userId)).authVersion, 1);
            assert.ok(!logs.join(' ').includes('PRIVATE_DB_SENTINEL'));
            assert.equal((await reset(token)).status, 200); assert.equal((await request('/roadmaps', { token: freshJWT })).status, 401);
        });
        await t.test('liveness/readiness and CORS are truthful, fail closed and disclose no details', async () => {
            assert.equal((await request('/health')).status, 200); assert.equal((await request('/ready')).status, 200);
            assert.equal((await request('/health', { origin: 'https://unlisted.example.test' })).status, 403);
            assert.equal((await request('/health', { origin: 'http://localhost:5173' })).headers.get('access-control-allow-origin'), 'http://localhost:5173');
            // Connected driver with a failed ping must still report unavailable.
            const db = mongoose.connection.db, originalAdmin = db.admin;
            try { db.admin = () => ({ command: async () => { throw Error('PRIVATE_DB_SENTINEL'); } }); const r = await request('/ready'); assert.equal(r.status, 503); assert.ok(!JSON.stringify(r.data).includes('PRIVATE')); } finally { db.admin = originalAdmin; }
            await mongoose.disconnect();
            assert.equal((await request('/health')).status, 200); assert.equal((await request('/ready')).status, 503);
            assert.equal((await request('/roadmaps', { token: freshJWT })).status, 503);
        });
    } finally {
        console.error = originalError; console.log = originalLog;
        if (server) await new Promise(resolve => server.close(resolve));
        await mongoose.disconnect(); await admin.close();
        if (cachedEmail) require.cache[emailPath] = cachedEmail; else delete require.cache[emailPath];
        for (const [key, value] of Object.entries(oldEnv)) if (value === undefined) delete process.env[key]; else process.env[key] = value;
        if (child.exitCode === null && !spawnError) { const exited = once(child, 'exit'); child.kill('SIGTERM'); await exited; }
        await rm(directory, { recursive: true, force: true });
    }
});
