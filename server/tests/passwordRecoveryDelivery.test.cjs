const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const crypto = require('node:crypto');
const valid = { RESEND_API_KEY: 're_PRIVATE_KEY', MAIL_FROM: 'sender@example.test' };
function service(env = valid, respond = async () => ({ ok: true, status: 200, json: async () => ({ id: 'fixture-email-id' }) })) {
    const calls = [], timers = []; let cleared = 0;
    const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(require.resolve('../services/emailService'), 'utf8'), {
        module, process: { env }, AbortController,
        setTimeout(fn, delay) { timers.push({ fn, delay }); return timers.length; },
        clearTimeout() { cleared++; },
        fetch: async (...args) => { calls.push(args); return respond(...args, timers); },
    });
    return { send: module.exports.sendPasswordResetCode, check: module.exports.validateMailConfiguration, calls, timers, cleared: () => cleared };
}
test('Resend HTTPS request preserves sender, subject, text and HTML template', async () => {
    const s = service(); assert.equal(await s.send('recipient@example.test', '123456'), undefined);
    const [url, request] = s.calls[0], body = JSON.parse(request.body);
    assert.equal(url, 'https://api.resend.com/emails'); assert.equal(request.method, 'POST'); assert.equal(request.redirect, 'error');
    assert.equal(request.headers.Authorization, 'Bearer re_PRIVATE_KEY'); assert.equal(request.headers['Content-Type'], 'application/json');
    assert.equal(body.from, 'AI Career OS <sender@example.test>'); assert.deepEqual(body.to, ['recipient@example.test']);
    assert.equal(body.subject, 'Your AI Career OS password reset code'); assert.match(body.text, /123456/); assert.match(body.html, /123456/); assert.match(body.html, /10 minutes/);
    assert.equal(s.timers[0].delay, 20000); assert.equal(s.cleared(), 1);
});
test('missing API key, SMTP-only settings and invalid sender fail without a network request', async () => {
    for (const env of [{}, { MAIL_HOST: 'smtp.example.test', MAIL_USER: 'old', MAIL_PASS: 'PRIVATE' }, { ...valid, RESEND_API_KEY: '' }, { ...valid, RESEND_API_KEY: 'key\nPRIVATE' }, { ...valid, MAIL_FROM: 'injected\r\nPRIVATE_VALUE' }]) {
        const s = service(env); await assert.rejects(s.send('recipient@example.test', '123456'), e => e.code === 'ECONFIG' && !e.message.includes('PRIVATE')); assert.equal(s.calls.length, 0);
    }
});
test('provider rejection, authentication, rate limits and failures are never success', async () => {
    for (const [status, code] of [[400, 'EMAIL_REJECTED'], [401, 'EMAIL_AUTH'], [403, 'EMAIL_REJECTED'], [422, 'EMAIL_REJECTED'], [429, 'EMAIL_RATE_LIMIT'], [500, 'EMAIL_PROVIDER']]) {
        let cancelled = false;
        const s = service(valid, async () => ({ ok: false, status, body: { cancel: async () => { cancelled = true; } }, json: () => { throw Error('Do not read sensitive provider error body'); } }));
        await assert.rejects(s.send('recipient@example.test', '123456'), e => e.code === code && e.statusCode === status && !e.message.includes('PRIVATE'));
        assert.equal(s.cleared(), 1); assert.equal(cancelled, true); assert.equal(s.calls.length, 1);
    }
});
test('malformed success bodies fail and network exceptions are sanitized', async () => {
    for (const value of [{}, { id: '' }, { error: 'PRIVATE', id: 'fixture-id' }, null]) await assert.rejects(service(valid, async () => ({ ok: true, json: async () => value })).send('recipient@example.test', '123456'), e => e.code === 'EMAIL_RESPONSE');
    await assert.rejects(service(valid, async () => ({ ok: true, json: async () => { throw Error('PRIVATE_BODY'); } })).send('recipient@example.test', '123456'), e => e.code === 'EMAIL_RESPONSE');
    await assert.rejects(service(valid, async () => { throw Error('PRIVATE_KEY recipient@example.test 123456'); }).send('recipient@example.test', '123456'), e => e.code === 'ECONNECTION' && !e.message.includes('PRIVATE'));
});
test('timeout aborts the request and clears the timer, including slow response bodies', async () => {
    for (const bodyTimeout of [false, true]) {
        const s = service(valid, async (_url, options, timers) => {
            if (!bodyTimeout) { timers[0].fn(); assert.equal(options.signal.aborted, true); throw Error('PRIVATE_ABORT'); }
            return { ok: true, json: async () => { timers[0].fn(); throw Error('PRIVATE_ABORT'); } };
        });
        await assert.rejects(s.send('recipient@example.test', '123456'), e => e.code === 'ETIMEDOUT'); assert.equal(s.cleared(), 1);
    }
});
function diagnostics(logger) {
    const module = { exports: {} }; vm.runInNewContext(fs.readFileSync(require.resolve('../utils/mailDiagnostics'), 'utf8'), { module, console: { error: logger } }); return module.exports.logMailFailure;
}
test('diagnostics allow only safe metadata, never raw provider text, addresses or secrets', () => {
    const logs = []; const log = diagnostics(v => logs.push(v));
    log('delivery', { name: 'Error', code: 'EAUTH', responseCode: 535, command: 'AUTH PLAIN', response: 'recipient@example.test PRIVATE_PASS 123456', message: 'PRIVATE_TOKEN', configurationFields: ['MAIL_PASS', 'PRIVATE_PASS'] });
    const data = JSON.parse(logs[0]); assert.equal(data.code, 'EAUTH'); assert.equal(data.smtpStatus, 535); assert.equal(data.command, 'AUTH PLAIN');
    assert.doesNotMatch(logs.join(''), /PRIVATE|123456|@/);
    log('cleanup', { name: 'PRIVATE_NAME', code: 'PRIVATE_CODE', command: 'AUTH PRIVATE_PASS' }); assert.doesNotMatch(logs.join(''), /PRIVATE/);
    assert.doesNotThrow(() => diagnostics(() => { throw Error('logger broken'); })('delivery', {}));
    assert.doesNotThrow(() => log('delivery', { get code() { throw Error('getter'); } }));
});
function controller({ unknown = false, mailFails = false, cleanupFails = false, loggerFails = false, deliver } = {}) {
    const calls = { delivered: 0, cleanup: 0, created: [], logs: [] }; const module = { exports: {} };
    const user = { _id: 'fixture-user' };
    const deps = {
        crypto, bcryptjs: {}, mongoose: {},
        '../models/User': { findOne: async () => unknown ? null : user },
        '../models/PasswordReset': { deleteMany: async () => {}, create: async value => { calls.created.push(value); return { _id: 'fixture-reset' }; }, deleteOne: async query => { calls.cleanup++; assert.equal(query._id, 'fixture-reset'); if (cleanupFails) throw Error('PRIVATE_DB'); } },
        '../services/emailService': { sendPasswordResetCode: async (email, code) => { calls.delivered++; if (deliver) return deliver(email, code); if (mailFails) throw Object.assign(new Error('PRIVATE_SMTP'), { code: 'EAUTH' }); } },
        '../utils/mailDiagnostics': { logMailFailure: diagnostics(value => { calls.logs.push(value); if (loggerFails) throw Error('logger'); }) },
    };
    vm.runInNewContext(fs.readFileSync(require.resolve('../controllers/passwordResetController'), 'utf8'), { module, require: id => deps[id], console: { error: () => {} }, Buffer });
    return { calls, run: async () => { const res = { set() {}, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } }; await module.exports.forgotPassword({ body: { email: 'recipient@example.test' } }, res); return res; } };
}
test('known, unknown, failed-delivery and failed-cleanup responses remain identical', async () => {
    let expected;
    for (const scenario of [{}, { unknown: true }, { mailFails: true }, { mailFails: true, cleanupFails: true }, { mailFails: true, loggerFails: true }]) {
        const c = controller(scenario), res = await c.run(); assert.equal(res.statusCode, 200);
        expected ||= JSON.stringify(res.body); assert.equal(JSON.stringify(res.body), expected);
        assert.equal(c.calls.delivered, scenario.unknown ? 0 : 1); assert.equal(c.calls.cleanup, scenario.mailFails ? 1 : 0);
        if (scenario.unknown) assert.equal(c.calls.created.length, 0);
        if (scenario.mailFails) assert.equal(JSON.parse(c.calls.logs[0]).stage, 'delivery');
        if (scenario.cleanupFails) assert.equal(JSON.parse(c.calls.logs[1]).stage, 'cleanup');
        if (!scenario.unknown) { const record = c.calls.created[0]; assert.match(record.codeHash, /^[a-f0-9]{64}$/); assert.ok(record.expiresAt.getTime() > Date.now()); assert.equal(record.code, undefined); }
        assert.doesNotMatch(c.calls.logs.join(''), /PRIVATE|recipient@/);
    }
});


test('connection diagnostics retain only allowlisted underlying code and timeout phase', () => {
    const logs = [], log = diagnostics(v => logs.push(v));
    log('connection_test', { code: 'ESOCKET', command: 'CONN', originalCode: 'ECONNREFUSED', timeoutType: 'CONNECT_TIMEOUT', message: 'PRIVATE_USER PRIVATE_PASS PRIVATE_CODE', response: 'recipient@example.test' });
    const record = JSON.parse(logs[0]); assert.equal(record.stage, 'connection_test'); assert.equal(record.originalCode, 'ECONNREFUSED'); assert.equal(record.timeoutType, 'CONNECT_TIMEOUT');
    log('connection_test', { code: 'ESOCKET', originalCode: 'PRIVATE_CODE', timeoutType: 'PRIVATE_TYPE' });
    assert.equal(JSON.parse(logs[1]).originalCode, undefined); assert.equal(JSON.parse(logs[1]).timeoutType, undefined);
    assert.doesNotMatch(logs.join(''), /PRIVATE|@/);
});

test('legacy diagnostic checks configuration only without contacting Resend or sending email', async () => {
    const { runMailConfigurationTest } = require('../scripts/verifyMailConnection');
    const logs = [], logFailure = diagnostics(v => logs.push(v)), s = service();
    assert.equal(await runMailConfigurationTest({ check: () => s.check(), logFailure, log: v => logs.push(v) }), 0);
    assert.equal(s.calls.length, 0); assert.equal(JSON.parse(logs[0]).networkChecked, false); assert.equal(JSON.parse(logs[0]).emailSent, false);
    assert.equal(await runMailConfigurationTest({ check: () => service({}).check(), logFailure, log: v => logs.push(v) }), 1);
    assert.equal(JSON.parse(logs.at(-1)).success, false); assert.doesNotMatch(logs.join(''), /re_PRIVATE|recipient@/);
});
test('Resend HTTP diagnostics keep only safe status and configuration field names', () => {
    const logs = [], log = diagnostics(v => logs.push(v));
    log('delivery', { code: 'EMAIL_REJECTED', statusCode: 403, message: 'PRIVATE_KEY recipient@example.test 123456', response: { error: 'PRIVATE' } });
    assert.equal(JSON.parse(logs[0]).httpStatus, 403); assert.equal(JSON.parse(logs[0]).code, 'EMAIL_REJECTED'); assert.doesNotMatch(logs[0], /PRIVATE|@|123456/);
    log('configuration_test', { code: 'ECONFIG', configurationFields: ['RESEND_API_KEY', 'MAIL_FROM', 'PRIVATE_KEY'] }); assert.deepEqual(JSON.parse(logs[1]).configurationFields, ['RESEND_API_KEY', 'MAIL_FROM']);
});


test('mocked Resend acceptance/rejection integrates with generic responses and challenge cleanup', async () => {
    for (const status of [200, 403, 429, 500]) {
        const mail = service(valid, async () => ({ ok: status === 200, status, json: async () => ({ id: 'fixture-id' }) }));
        const c = controller({ deliver: mail.send }), result = await c.run();
        assert.equal(result.statusCode, 200); assert.equal(result.body.success, true);
        assert.equal(mail.calls.length, 1); assert.equal(c.calls.cleanup, status === 200 ? 0 : 1);
        assert.doesNotMatch(JSON.stringify([result.body, c.calls.logs]), /fixture-id|recipient@|re_PRIVATE/);
        if (status !== 200) assert.equal(JSON.parse(c.calls.logs[0]).httpStatus, status);
    }
    const c = controller({ deliver: service({}).send }); await c.run(); assert.equal(c.calls.cleanup, 1);
    assert.equal(JSON.parse(c.calls.logs[0]).code, 'ECONFIG');
});
