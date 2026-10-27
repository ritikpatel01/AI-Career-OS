const nodemailer = require("nodemailer");

// Lazy initialization permits startup without mail in development, but delivery
// always validates explicit settings. Never fall back to another SMTP server.
let transporter;
let sender;
function getTransport() {
    if (transporter) return transporter;
    const keys = ['MAIL_HOST', 'MAIL_PORT', 'MAIL_SECURE', 'MAIL_USER', 'MAIL_PASS', 'MAIL_FROM'];
    const env = process.env;
    const invalid = keys.filter(key => typeof env[key] !== 'string' || !env[key].trim());
    if (env.MAIL_HOST && !/^[a-zA-Z0-9.-]+$/.test(env.MAIL_HOST)) invalid.push('MAIL_HOST');
    if (!/^\d+$/.test(env.MAIL_PORT || '') || Number(env.MAIL_PORT) < 1 || Number(env.MAIL_PORT) > 65535) invalid.push('MAIL_PORT');
    if (!['true', 'false'].includes(env.MAIL_SECURE)) invalid.push('MAIL_SECURE');
    if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(env.MAIL_FROM || '')) invalid.push('MAIL_FROM');
    if (invalid.length) {
        const error = new Error('Invalid email configuration; check the named MAIL settings');
        error.code = 'ECONFIG';
        error.configurationFields = [...new Set(invalid)];
        throw error;
    }
    const transport = nodemailer.createTransport({
        host: env.MAIL_HOST, port: Number(env.MAIL_PORT), secure: env.MAIL_SECURE === 'true',
        requireTLS: true,
        connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
        auth: { user: env.MAIL_USER, pass: env.MAIL_PASS },
    });
    sender = env.MAIL_FROM;
    transporter = transport;
    return transporter;
}


const sendPasswordResetCode = async (
    email,
    code
) => {

    const transport = getTransport();
    const result = await transport.sendMail({
        from: { name: "AI Career OS", address: sender },
        to: email,

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
    // SMTP acceptance is not proof of inbox delivery. Explicit rejection is failure.
    if (result?.rejected?.length || (Array.isArray(result?.accepted) && !result.accepted.length)) {
        const error = new Error('Email was not accepted by the mail server');
        error.code = 'EENVELOPE';
        throw error;
    }
};


module.exports = {
    sendPasswordResetCode
};