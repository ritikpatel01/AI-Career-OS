const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { configuration, InterviewAIError } = require('../../ai-engine/interview/provider');
const quiet = { log() {}, error() {} };
const hosted = { NODE_ENV: 'production', GROQ_API_KEY: 'PRIVATE_KEY', GROQ_MODEL: 'configured-model' };
const validResult = { assessment: 'correct', accuracy: 4, relevance: 5, completeness: 3, technicalDepth: 3, clarity: 4, explanation: 'Correct core explanation with a useful example.', missingConcepts: [] };
function provider(env, respond) {
    const calls = [], module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(require.resolve('../../ai-engine/interview/provider'), 'utf8'), {
        module, process: { env }, URL, require: () => ({ post: async (...args) => { calls.push(args); return respond(...args); } }),
    });
    return { ...module.exports, calls };
}
test('production uses configured hosted model without defaulting to loopback', () => {
    assert.equal(configuration(hosted).provider, 'groq');
    for (const env of [{ NODE_ENV: 'production' }, { ...hosted, GROQ_MODEL: '' }, { ...hosted, GROQ_API_KEY: '' }, { ...hosted, INTERVIEW_AI_PROVIDER: 'unknown' }, { ...hosted, INTERVIEW_AI_TIMEOUT_MS: 'NaN' }, { ...hosted, INTERVIEW_AI_TIMEOUT_MS: '999999' }]) assert.throws(() => configuration(env), e => e.code === 'INTERVIEW_AI_CONFIG');
    const local = configuration({}); assert.equal(configuration({ INTERVIEW_AI_TIMEOUT_MS: '', OLLAMA_TIMEOUT_MS: '' }).timeout, 90000); assert.equal(local.provider, 'ollama'); assert.equal(local.model, 'qwen3:4b'); assert.match(local.url, /127\.0\.0\.1/);
    for (const OLLAMA_URL of ['', 'http://remote.example.test/api/generate', 'https://user:PRIVATE@remote.example.test/api/generate', 'https://localhost/api/generate']) assert.throws(() => configuration({ NODE_ENV: 'production', INTERVIEW_AI_PROVIDER: 'ollama', OLLAMA_URL }), e => e.code === 'INTERVIEW_AI_CONFIG');
    assert.equal(configuration({ NODE_ENV: 'production', INTERVIEW_AI_PROVIDER: 'ollama', OLLAMA_URL: 'https://remote.example.test/api/generate' }).provider, 'ollama');
});
test('Groq request uses configured model, bounded timeout, JSON output, no local call', async () => {
    const p = provider(hosted, () => ({ status: 200, data: { choices: [{ message: { content: JSON.stringify(validResult) }, finish_reason: 'stop' }] } }));
    assert.deepEqual(JSON.parse(await p.evaluatePrompt('fixture prompt')), validResult);
    const [url, body, config] = p.calls[0]; assert.equal(url, 'https://api.groq.com/openai/v1/chat/completions'); assert.equal(body.model, hosted.GROQ_MODEL); assert.equal(body.response_format.type, 'json_object'); assert.equal(config.timeout, 45000); assert.equal(config.maxRedirects, 0); assert.equal(config.headers.Authorization, 'Bearer PRIVATE_KEY'); assert.equal(body.max_completion_tokens, 512);
});
test('local Ollama and explicitly configured remote Ollama remain supported', async () => {
    for (const env of [{}, { NODE_ENV: 'production', INTERVIEW_AI_PROVIDER: 'ollama', OLLAMA_URL: 'https://remote.example.test/api/generate', OLLAMA_API_KEY: 'PRIVATE_KEY' }]) {
        const p = provider(env, () => ({ status: 200, data: { response: JSON.stringify(validResult) } })); await p.evaluatePrompt('prompt');
        assert.equal(p.calls[0][1].stream, false); assert.equal(p.calls[0][1].format, 'json'); assert.equal(p.calls[0][1].options.num_ctx, 8192);
    }
});
test('provider errors are classified without credentials or provider text', async () => {
    for (const [status, code] of [[408, 'INTERVIEW_AI_TIMEOUT'], [504, 'INTERVIEW_AI_TIMEOUT'], [401, 'INTERVIEW_AI_AUTH'], [403, 'INTERVIEW_AI_AUTH'], [404, 'INTERVIEW_AI_MODEL'], [400, 'INTERVIEW_AI_MODEL'], [422, 'INTERVIEW_AI_MODEL'], [429, 'INTERVIEW_AI_LIMIT'], [500, 'INTERVIEW_AI_UNAVAILABLE']]) {
        const p = provider(hosted, () => ({ status, data: { error: { message: 'PRIVATE_PROVIDER' } } }));
        await assert.rejects(p.evaluatePrompt('PRIVATE_ANSWER'), e => e.code === code && !JSON.stringify(e).includes('PRIVATE'));
    }
    for (const [code, expected] of [['ECONNABORTED', 'INTERVIEW_AI_TIMEOUT'], ['ETIMEDOUT', 'INTERVIEW_AI_TIMEOUT'], ['ECONNREFUSED', 'INTERVIEW_AI_UNAVAILABLE']]) {
        const p = provider(hosted, () => { throw Object.assign(Error('PRIVATE_ENDPOINT'), { code, config: { headers: { Authorization: 'PRIVATE_KEY' } } }); });
        await assert.rejects(p.evaluatePrompt('answer'), e => e.code === expected && !e.message.includes('PRIVATE'));
    }
    for (const choices of [[], [{ message: { content: '' } }], [{ finish_reason: 'length', message: { content: '{}' } }]]) await assert.rejects(provider(hosted, () => ({ status: 200, data: { choices } })).evaluatePrompt('prompt'), e => e.code === 'INTERVIEW_AI_RESPONSE');
});
function evaluator(raw, fail) {
    const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(require.resolve('../../ai-engine/interview/evaluator'), 'utf8'), { module, console: quiet, require: () => ({ InterviewAIError, evaluatePrompt: async () => { if (fail) throw fail; return raw; } }) });
    return module.exports.evaluateInterviewAnswer;
}
const question = { role: 'Frontend Developer', category: 'Technical', topic: 'JavaScript', difficulty: 'Intermediate', question: 'What is a closure in JavaScript?', expectedConcepts: ['lexical scope', 'function'], criticalConcepts: ['lexical scope'], answer: 'A closure is a function that retains access to its lexical scope after the outer function returns. For example, a counter function can retain a private count variable across calls.' };
test('provider JSON output feeds existing dimensions and weighted scoring', async () => {
    const result = await evaluator(JSON.stringify(validResult))(question);
    assert.equal(typeof result.score, 'number'); assert.ok(result.score >= 0 && result.score <= 100); assert.ok(result.dimensions); assert.ok(Array.isArray(result.missingConcepts));
    const weights = { accuracy: 30, relevance: 20, completeness: 20, technicalDepth: 20, clarity: 10 };
    const score = Math.round(Object.entries(weights).reduce((sum, [k, weight]) => sum + (result.dimensions[k] / 5) * weight, 0));
    assert.equal(result.score, score);
});
test('invalid JSON, invalid scores and outages fail instead of generating fallback scores', async () => {
    for (const raw of ['not JSON', '{}', JSON.stringify({ ...validResult, accuracy: 9 })]) await assert.rejects(evaluator(raw)(question), e => e.code === 'INTERVIEW_AI_RESPONSE');
    await assert.rejects(evaluator('', new InterviewAIError('INTERVIEW_AI_TIMEOUT'))(question), e => e.code === 'INTERVIEW_AI_TIMEOUT');
});
test('controller returns actionable safe failures and preserves success envelope', async () => {
    for (const [code, status] of [['INTERVIEW_AI_CONFIG', 503], ['INTERVIEW_AI_AUTH', 503], ['INTERVIEW_AI_TIMEOUT', 504], ['INTERVIEW_AI_MODEL', 503], ['INTERVIEW_AI_LIMIT', 503], ['INTERVIEW_AI_RESPONSE', 502], ['PRIVATE_ERROR', 500], [null, 201]]) {
        const logs = [], module = { exports: {} };
        vm.runInNewContext(fs.readFileSync(require.resolve('../controllers/interviewController'), 'utf8'), { module, console: { error: x => logs.push(x) }, require: () => ({ submitInterviewAnswer: async () => { if (code) throw Object.assign(Error('PRIVATE_KEY PRIVATE_ANSWER'), { code }); return { interview: { _id: 'fixture' }, evaluation: { score: 70 } }; } }) });
        const res = { status(s) { this.statusCode = s; return this; }, json(body) { this.body = body; return this; } };
        await module.exports.submitAnswer({ user: { userId: 'owner' }, body: question }, res);
        assert.equal(res.statusCode, status); assert.doesNotMatch(JSON.stringify([res.body, logs]), /PRIVATE/);
        if (!code) assert.equal(res.body.data.evaluation.score, 70);
    }
});
test('service does not save an interview when evaluation fails', async () => {
    const module = { exports: {} }; let writes = 0;
    vm.runInNewContext(fs.readFileSync(require.resolve('../services/interviewService'), 'utf8'), { module, console: quiet, require: id => id.includes('/evaluator') ? { evaluateInterviewAnswer: async () => { throw new InterviewAIError('INTERVIEW_AI_UNAVAILABLE'); } } : id.includes('/Interview') ? { create: async () => { writes++; } } : {} });
    await assert.rejects(module.exports.submitInterviewAnswer('owner', question), e => e.code === 'INTERVIEW_AI_UNAVAILABLE'); assert.equal(writes, 0);
});

test('submission contract passes provider output through scoring, persistence and API envelope', async () => {
    const providerFixture = provider(hosted, () => ({ status: 200, data: { choices: [{ message: { content: JSON.stringify(validResult) } }] } }));
    const ai = { exports: {} };
    vm.runInNewContext(fs.readFileSync(require.resolve('../../ai-engine/interview/evaluator'), 'utf8'), { module: ai, console: quiet, require: () => providerFixture });
    let saved;
    const service = { exports: {} };
    vm.runInNewContext(fs.readFileSync(require.resolve('../services/interviewService'), 'utf8'), { module: service, console: quiet, require: id => id.includes('/evaluator') ? ai.exports : id.includes('/Interview') ? { create: async record => { saved = record; return { ...record, _id: 'fixture-interview' }; } } : {} });
    const controller = { exports: {} };
    vm.runInNewContext(fs.readFileSync(require.resolve('../controllers/interviewController'), 'utf8'), { module: controller, console: quiet, require: () => service.exports });
    const validated = require('../validators/interviewValidator').validate(question); assert.equal(validated.error, undefined);
    const res = { status(value) { this.statusCode = value; return this; }, json(body) { this.body = body; return this; } };
    await controller.exports.submitAnswer({ user: { userId: 'fixture-owner' }, body: validated.value }, res);
    assert.equal(res.statusCode, 201); assert.equal(res.body.success, true); assert.equal(saved.user, 'fixture-owner'); assert.equal(saved.answer, question.answer);
    assert.equal(saved.score, res.body.data.evaluation.score); assert.equal(saved.status, 'completed'); assert.equal(providerFixture.calls.length, 1);
});

test('frontend posts the expected authenticated payload and surfaces safe API failures', async () => {
    const source = fs.readFileSync(require.resolve('../../client/src/pages/Interview/Interview.jsx'), 'utf8');
    const start = source.indexOf('const evaluateAnswerWithAI =');
    const end = source.indexOf('/* =========================================================\n   MAIN COMPONENT', start);
    let response = { ok: true, json: async () => ({ success: true, data: { evaluation: { score: 76 } } }) }, request;
    const context = { getAuthToken: () => 'fixture-token', API_BASE_URL: 'https://api.example.test/api', AbortController, setTimeout: () => 1, clearTimeout() {}, fetch: async (url, options) => { request = { url, options }; return response; } };
    const evaluate = vm.runInNewContext(source.slice(start, end) + '\nevaluateAnswerWithAI', context);
    assert.equal((await evaluate(question)).score, 76);
    assert.equal(request.url, 'https://api.example.test/api/interviews/answer'); assert.equal(request.options.method, 'POST'); assert.equal(request.options.headers.Authorization, 'Bearer fixture-token'); assert.deepEqual(JSON.parse(request.options.body), question);
    response = { ok: false, json: async () => ({ success: false, message: 'The evaluation service is temporarily unreachable. Please try again later.' }) };
    await assert.rejects(evaluate(question), /temporarily unreachable/);
});
