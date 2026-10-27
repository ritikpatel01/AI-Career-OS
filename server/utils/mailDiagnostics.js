// Never copy provider messages/responses: they can contain recipients or credentials.
const codes = new Set(['ECONFIG', 'EAUTH', 'ECONNECTION', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ESOCKET', 'EDNS', 'ENOTFOUND', 'EENVELOPE', 'EMESSAGE', 'ESTREAM']);
const commands = new Set(['CONN', 'EHLO', 'HELO', 'STARTTLS', 'AUTH', 'AUTH PLAIN', 'AUTH LOGIN', 'MAIL FROM', 'RCPT TO', 'DATA']);
const fields = new Set(['MAIL_HOST', 'MAIL_PORT', 'MAIL_SECURE', 'MAIL_USER', 'MAIL_PASS', 'MAIL_FROM']);
function logMailFailure(stage, error) {
    try {
        const diagnostic = {
            event: 'password_recovery_failure',
            stage: ['delivery', 'cleanup', 'request'].includes(stage) ? stage : 'request',
            name: ['Error', 'TypeError', 'RangeError'].includes(error?.name) ? error.name : 'Error',
            code: codes.has(error?.code) ? error.code : 'UNKNOWN',
        };
        if (Number.isInteger(error?.responseCode) && error.responseCode >= 400 && error.responseCode <= 599) diagnostic.smtpStatus = error.responseCode;
        if (commands.has(error?.command)) diagnostic.command = error.command;
        if (Array.isArray(error?.configurationFields)) diagnostic.configurationFields = error.configurationFields.filter(value => fields.has(value));
        console.error(JSON.stringify(diagnostic));
    } catch { /* Diagnostics must never interrupt recovery or cleanup. */ }
}
module.exports = { logMailFailure };
