// Resend HTTPS delivery. Never fall back to SMTP on Render Free.
function mailError(code, statusCode) {
    const error = new Error('Password recovery email request failed');
    error.code = code;
    if (Number.isInteger(statusCode)) error.statusCode = statusCode;
    return error;
}
function validateMailConfiguration(env = process.env) {
    const invalid = [];
    if (typeof env.RESEND_API_KEY !== 'string' || !env.RESEND_API_KEY.trim() || /\s/.test(env.RESEND_API_KEY.trim())) invalid.push('RESEND_API_KEY');
    if (typeof env.MAIL_FROM !== 'string' || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(env.MAIL_FROM)) invalid.push('MAIL_FROM');
    if (invalid.length) {
        const error = mailError('ECONFIG');
        error.message = `Invalid email configuration: ${invalid.join(', ')}`;
        error.configurationFields = invalid;
        throw error;
    }
    return { apiKey: env.RESEND_API_KEY.trim(), sender: env.MAIL_FROM };
}
async function sendWithResend(apiKey, message) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST', redirect: 'error', signal: controller.signal,
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(message),
        });
        if (!response.ok) {
            const code = response.status === 401 ? 'EMAIL_AUTH' : response.status === 429 ? 'EMAIL_RATE_LIMIT' : response.status >= 500 ? 'EMAIL_PROVIDER' : 'EMAIL_REJECTED';
            // Do not copy provider bodies: they can echo addresses or message data.
            try { await response.body?.cancel(); } catch { /* Ignore body cleanup errors. */ }
            throw mailError(code, response.status);
        }
        let result;
        try { result = await response.json(); }
        catch { throw mailError(controller.signal.aborted ? 'ETIMEDOUT' : 'EMAIL_RESPONSE'); }
        if (result?.error || typeof result?.id !== 'string' || !result.id.trim()) throw mailError('EMAIL_RESPONSE');
        // Acceptance is not proof of inbox delivery; do not expose IDs or message data.
    } catch (error) {
        if (controller.signal.aborted) throw mailError('ETIMEDOUT');
        if (['EMAIL_AUTH', 'EMAIL_RATE_LIMIT', 'EMAIL_PROVIDER', 'EMAIL_REJECTED', 'EMAIL_RESPONSE'].includes(error?.code)) throw error;
        throw mailError('ECONNECTION');
    } finally { clearTimeout(timer); }
}

const sendPasswordResetCode = async (
    email,
    code
) => {

    const { apiKey, sender } = validateMailConfiguration();
    await sendWithResend(apiKey, {
        from: `AI Career OS <${sender}>`,
        to: [email],

        subject:
            "Your AI Career OS password reset code",

        text:
            `Your AI Career OS password reset code is ${code}. ` +
            `This code expires in 10 minutes.`,

        html: `
            <!DOCTYPE html>

            <html>
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Password Reset</title>
            </head>

            <body
                style="
                    margin:0;
                    padding:0;
                    background:#f4f7fb;
                    font-family:Arial,Helvetica,sans-serif;
                "
            >

                <div
                    style="
                        max-width:560px;
                        margin:40px auto;
                        padding:24px;
                    "
                >

                    <div
                        style="
                            background:#ffffff;
                            border:1px solid #e5e7eb;
                            border-radius:16px;
                            padding:32px;
                            box-shadow:0 10px 30px rgba(15,23,42,0.07);
                        "
                    >

                        <div
                            style="
                                width:46px;
                                height:46px;
                                border-radius:12px;
                                background:#eef2ff;
                                display:flex;
                                align-items:center;
                                justify-content:center;
                                margin-bottom:20px;
                            "
                        >
                            <span
                                style="
                                    color:#4f46e5;
                                    font-size:22px;
                                    font-weight:800;
                                "
                            >
                                AI
                            </span>
                        </div>

                        <h1
                            style="
                                margin:0 0 10px;
                                color:#111827;
                                font-size:24px;
                            "
                        >
                            Reset your password
                        </h1>

                        <p
                            style="
                                margin:0 0 24px;
                                color:#64748b;
                                font-size:14px;
                                line-height:1.6;
                            "
                        >
                            We received a request to reset the password
                            for your AI Career OS account.
                        </p>

                        <div
                            style="
                                padding:22px;
                                text-align:center;
                                background:#f8fafc;
                                border:1px solid #e5e7eb;
                                border-radius:12px;
                                margin-bottom:22px;
                            "
                        >

                            <div
                                style="
                                    color:#64748b;
                                    font-size:12px;
                                    margin-bottom:8px;
                                "
                            >
                                Verification code
                            </div>

                            <div
                                style="
                                    color:#111827;
                                    font-size:34px;
                                    font-weight:800;
                                    letter-spacing:8px;
                                "
                            >
                                ${code}
                            </div>

                        </div>

                        <p
                            style="
                                margin:0;
                                color:#64748b;
                                font-size:13px;
                                line-height:1.6;
                            "
                        >
                            This code expires in
                            <strong>10 minutes</strong>.
                            For your security, never share this code
                            with anyone.
                        </p>

                        <div
                            style="
                                margin-top:26px;
                                padding-top:18px;
                                border-top:1px solid #e5e7eb;
                                color:#94a3b8;
                                font-size:11px;
                            "
                        >
                            AI Career OS
                            <br />
                            Career intelligence platform
                        </div>

                    </div>

                </div>

            </body>
            </html>
        `
    });
};

module.exports = { sendPasswordResetCode, validateMailConfiguration };
