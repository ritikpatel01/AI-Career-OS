// Legacy filename retained for operators. Resend has no SMTP verify() step.
// This checks local configuration only: it cannot prove API access or delivery.
async function runMailConfigurationTest({ check, logFailure, log = console.log }) {
    try {
        check();
        log(JSON.stringify({ event: 'mail_configuration_check', provider: 'resend', success: true, networkChecked: false, emailSent: false }));
        return 0;
    } catch (error) {
        try { logFailure('configuration_test', error); } catch { /* No raw errors. */ }
        log(JSON.stringify({ event: 'mail_configuration_check', provider: 'resend', success: false, networkChecked: false, emailSent: false }));
        return 1;
    }
}
if (require.main === module) {
    const path = require('node:path');
    require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
    const { validateMailConfiguration } = require('../services/emailService');
    const { logMailFailure } = require('../utils/mailDiagnostics');
    runMailConfigurationTest({ check: () => validateMailConfiguration(), logFailure: logMailFailure })
        .then(code => { process.exitCode = code; })
        .catch(() => { process.exitCode = 1; });
}
module.exports = { runMailConfigurationTest };
