const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host:
        process.env.MAIL_HOST ||
        "smtp.gmail.com",

    port:
        Number(process.env.MAIL_PORT) ||
        465,

    secure:
        String(
            process.env.MAIL_SECURE || "true"
        ) === "true",

    // Require STARTTLS when implicit TLS is disabled; never fall back to plaintext.
    requireTLS: true,

    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});


const sendPasswordResetCode = async (
    email,
    code
) => {

    const from =
        process.env.MAIL_FROM ||
        process.env.MAIL_USER;


    await transporter.sendMail({

        from: `"AI Career OS" <${from}>`,

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
};


module.exports = {
    sendPasswordResetCode
};