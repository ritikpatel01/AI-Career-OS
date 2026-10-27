const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const crypto = require('node:crypto');
const valid = { MAIL_HOST: 'smtp.example.test', MAIL_PORT: '587', MAIL_SECURE: 'false', MAIL_USER: 'PRIVATE_USER', MAIL_PASS: 'PRIVATE_PASS', MAIL_FROM: 'sender@example.test' };
function service(env = valid, deliver = async () => ({ accepted: ['recipient@example.test'], rejected: [] })) {
    let creates = 0, options, mail;
    const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(require.resolve('../services/emailService'), 'utf8'), {
        module, process: { env }, require: () => ({ createTransport(config) { creates++; options = config; return { async sendMail(value) { mail = value; return deliver(value); } }; } }),
    });
    return { send: module.exports.sendPasswordResetCode, state: () => ({ creates, options, mail }) };
}
test('mail uses explicit encrypted transport, structured sender and reuses transport', async () => {
    const s = service(); await s.send('recipient@example.test', '123456'); await s.send('recipient@example.test', '654321');
    const { creates, options, mail } = s.state(); assert.equal(creates, 1); assert.equal(options.requireTLS, true); assert.equal(options.secure, false);
    assert.equal(options.host, valid.MAIL_HOST); assert.equal(mail.from.address, valid.MAIL_FROM); assert.match(mail.text, /654321/);
});
test('missing or malformed settings fail without creating a transport or exposing values', async () => {
    for (const env of [{}, { ...valid, MAIL_PASS: '' }, { ...valid, MAIL_PORT: 'abc' }, { ...valid, MAIL_FROM: 'injected\r\nPRIVATE_VALUE' }, { ...valid, MAIL_SECURE: 'maybe' }]) {
        const s = service(env); await assert.rejects(s.send('recipient@example.test', '123456'), e => e.code === 'ECONFIG' && !e.message.includes('PRIVATE_VALUE')); assert.equal(s.state().creates, 0);
    }
});
test('SMTP exceptions and explicit recipient rejections propagate', async () => {
    const failure = Object.assign(new Error('private'), { code: 'EAUTH' });
    await assert.rejects(service(valid, async () => { throw failure; }).send('recipient@example.test', '123456'), e => e === failure);
    for (const result of [{ rejected: ['recipient@example.test'] }, { accepted: [] }]) await assert.rejects(service(valid, async () => result).send('recipient@example.test', '123456'), e => e.code === 'EENVELOPE');
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
function controller({ unknown = false, mailFails = false, cleanupFails = false, loggerFails = false } = {}) {
    const calls = { delivered: 0, cleanup: 0, created: [], logs: [] }; const module = { exports: {} };
    const user = { _id: 'fixture-user' };
    const deps = {
        crypto, bcryptjs: {}, mongoose: {},
        '../models/User': { findOne: async () => unknown ? null : user },
        '../models/PasswordReset': { deleteMany: async () => {}, create: async value => { calls.created.push(value); return { _id: 'fixture-reset' }; }, deleteOne: async query => { calls.cleanup++; assert.equal(query._id, 'fixture-reset'); if (cleanupFails) throw Error('PRIVATE_DB'); } },
        '../services/emailService': { sendPasswordResetCode: async () => { calls.delivered++; if (mailFails) throw Object.assign(new Error('PRIVATE_SMTP'), { code: 'EAUTH' }); } },
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
