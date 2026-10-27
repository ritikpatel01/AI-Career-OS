const test = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, copyFileSync, mkdirSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { spawnSync } = require('node:child_process');
const { allowedOrigins, corsOptions, validateEnvironment } = require('../config/runtime');

test('development origins remain available; production requires explicit HTTPS origins', () => {
    assert.ok(allowedOrigins({}).has('http://localhost:5173'));
    const env = { NODE_ENV: 'production', CORS_ORIGINS: 'https://frontend.example.test, https://other.example.test' };
    assert.deepEqual([...allowedOrigins(env)], ['https://frontend.example.test', 'https://other.example.test']);
    assert.ok(!allowedOrigins(env).has('http://localhost:5173'));
    for (const CORS_ORIGINS of ['', '*', 'https://*.example.test', 'http://frontend.example.test', 'https://host.example.test/path', 'https://user:pass@host.example.test']) {
        assert.throws(() => allowedOrigins({ ...env, CORS_ORIGINS }));
    }
    corsOptions(env).origin('https://frontend.example.test.evil.test', error => assert.equal(error.statusCode, 403));
    corsOptions(env).origin(undefined, (error, accepted) => { assert.equal(error, null); assert.equal(accepted, true); });
});

test('startup checks required values without exposing their contents', () => {
    assert.throws(() => validateEnvironment({}), /MONGO_URI/);
    const env = { NODE_ENV: 'production', MONGO_URI: 'fixture', JWT_SECRET: 'x'.repeat(48), CORS_ORIGINS: 'https://frontend.example.test', MAIL_HOST: 'mail.example.test', MAIL_PORT: '465', MAIL_SECURE: 'true', MAIL_USER: 'fixture', MAIL_PASS: 'PRIVATE_SENTINEL', MAIL_FROM: 'fixture@example.test' };
    assert.doesNotThrow(() => validateEnvironment(env));
    assert.throws(() => validateEnvironment({ ...env, JWT_SECRET: 'short' }), /JWT_SECRET/);
    assert.throws(() => validateEnvironment({ ...env, MAIL_PASS: '' }), /MAIL_PASS/);
    assert.throws(() => validateEnvironment({ ...env, MAIL_PORT: 'invalid' }), /Invalid mail transport/);
});

test('environment and backup exclusions work in an isolated git fixture; examples stay includable', t => {
    const directory = mkdtempSync(join(tmpdir(), 'career-ignore-test-'));
    try {
        const result = spawnSync('git', ['init', '-q', directory]);
        if (result.error?.code === 'ENOENT') { t.skip('git unavailable'); return; }
        assert.equal(result.status, 0);
        copyFileSync(resolve(__dirname, '../../.gitignore'), join(directory, '.gitignore'));
        for (const filename of ['server/.env', 'client/.env.save', 'server/.env.save.1', 'nested/project/.env.production', 'server/.env.example', 'client/.env.example']) {
            mkdirSync(join(directory, filename, '..'), { recursive: true }); writeFileSync(join(directory, filename), '# fixture only');
            const checked = spawnSync('git', ['-C', directory, 'check-ignore', '--quiet', '--no-index', filename]);
            assert.equal(checked.status, filename.endsWith('.example') ? 1 : 0, filename);
        }
    } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('mail transport requires encrypted delivery without contacting SMTP', async () => {
    const vm = require('node:vm'), { readFileSync } = require('node:fs');
    for (const secure of ['true', 'false']) {
        let options;
        const module = { exports: {} };
        vm.runInNewContext(readFileSync(require.resolve('../services/emailService'), 'utf8'), {
            module, process: { env: { MAIL_SECURE: secure, MAIL_HOST: 'smtp.example.test', MAIL_PORT: secure === 'true' ? '465' : '587', MAIL_USER: 'fixture', MAIL_PASS: 'fixture', MAIL_FROM: 'sender@example.test' } },
            require: id => { assert.equal(id, 'nodemailer'); return { createTransport(config) { options = config; return { sendMail: async () => { throw Error('Not invoked by this test'); } }; } }; },
        });
        await assert.rejects(module.exports.sendPasswordResetCode('recipient@example.test', '123456'), /Not invoked/);
        assert.equal(options.secure, secure === 'true'); assert.equal(options.requireTLS, true);
    }
});

test('database startup requires transaction capability and redacts connection errors', async () => {
    const vm = require('node:vm'), { readFileSync } = require('node:fs');
    for (const topology of [{ setName: 'fixture' }, { msg: 'isdbgrid' }, {}]) {
        let disconnected = false;
        const module = { exports: {} };
        vm.runInNewContext(readFileSync(require.resolve('../config/db'), 'utf8'), {
            module, console: { log() {} }, process: { env: { MONGO_URI: 'not-used-fixture' } },
            require: () => ({ connect: async () => {}, disconnect: async () => { disconnected = true; }, connection: { db: { admin: () => ({ command: async () => topology }) } } }),
        });
        if (Object.keys(topology).length) await assert.doesNotReject(module.exports());
        else { await assert.rejects(module.exports(), /replica set or sharded cluster/); assert.equal(disconnected, true); }
    }
    const module = { exports: {} };
    vm.runInNewContext(readFileSync(require.resolve('../config/db'), 'utf8'), {
        module, process: { env: {} }, require: () => ({ connect: async () => { throw Error('PRIVATE_CONNECTION_SENTINEL'); } }),
    });
    await assert.rejects(module.exports(), error => error.message === 'Database connection unavailable');
});
