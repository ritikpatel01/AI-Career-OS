const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const privateMarker = 'PRIVATE_EXCEPTION_SENTINEL';
const cases = {
    activityController: ['getAllActivities', 'createNewActivity'],
    notificationController: ['getAllNotifications', 'createNotification', 'markAsRead'],
    skillController: ['getAllSkills', 'createNewSkill', 'updateSkillData', 'removeSkill'],
    progressController: ['getAllProgress', 'createNewProgress', 'updateProgressData'],
    knowledgeController: ['getItems', 'getItemById'],
    jobController: ['getJob', 'createNewJob'],
    resumeController: ['getAllResumes', 'createNewResume', 'getResume', 'updateResumeData', 'removeResume'],
    authController: ['register', 'login']
};
for (const [controller, handlers] of Object.entries(cases)) {
    test(`${controller} failure responses and logs do not disclose service exception details`, async () => {
        const logs = [];
        const fail = async () => { throw new Error(privateMarker); };
        const dependencies = new Proxy({}, { get: () => fail });
        const module = { exports: {} };
        vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../controllers', controller + '.js'), 'utf8'), {
            module, console: { error: (...args) => logs.push(args), log: (...args) => logs.push(args) },
            require: () => dependencies
        });
        for (const name of handlers) {
            const res = { code: 200, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; }, set() { return this; } };
            await module.exports[name]({ user: { userId: '000000000000000000000001' }, params: { id: '000000000000000000000002' }, query: {}, body: { name: 'Fixture', email: 'fixture@example.test', password: 'fixture-password' } }, res);
            assert.ok(res.code >= 400, name);
            assert.equal(res.data.success, false, name);
            assert.ok(!JSON.stringify(res.data).includes(privateMarker), name + ' response');
        }
        assert.ok(!JSON.stringify(logs).includes(privateMarker));
        assert.ok(logs.every(args => args.every(arg => typeof arg === 'string')), 'Logs must use fixed operation labels only');
    });
}
