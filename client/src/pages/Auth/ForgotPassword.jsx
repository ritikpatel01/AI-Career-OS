import { API_BASE_URL } from "../../services/api";
import { useState } from "react";

import {
    Link,
    useNavigate
} from "react-router-dom";

import "./Login.css";


const ForgotPassword = () => {

    const navigate =
        useNavigate();


    const [step, setStep] =
        useState("email");


    const [email, setEmail] =
        useState("");


    const [code, setCode] =
        useState("");


    const [loading, setLoading] =
        useState(false);


    const [error, setError] =
        useState("");


    const [message, setMessage] =
        useState("");





    const sendCode = async (
        event
    ) => {

        event.preventDefault();

        setError("");
        setMessage("");


        const cleanEmail =
            email.trim();


        if (!cleanEmail) {

            setError(
                "Please enter your email address."
            );

            return;
        }


        setLoading(true);


        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/auth/forgot-password`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            email: cleanEmail
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data?.message ||
                    "Unable to send the code."
                );
            }


            setMessage(
                "If an account exists for this email, a verification code has been sent."
            );


            setStep("code");

        } catch (error) {

            setError(
                error.message
            );

        } finally {

            setLoading(false);
        }
    };


    const verifyCode = async (
        event
    ) => {

        event.preventDefault();

        setError("");
        setMessage("");


        if (!/^\d{6}$/.test(code)) {

            setError(
                "Enter the 6-digit verification code."
            );

            return;
        }


        setLoading(true);


        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/auth/verify-reset-code`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            email:
                                email.trim(),
                            code
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data?.message ||
                    "Invalid verification code."
                );
            }


            const resetToken =
                data?.data?.resetToken;


            if (!resetToken) {

                throw new Error(
                    "Verification succeeded but no reset session was created."
                );
            }


            navigate(
                "/reset-password",
                {
                    state: {
                        email:
                            email.trim(),

                        resetToken
                    }
                }
            );

        } catch (error) {

            setError(
                error.message
            );

        } finally {

            setLoading(false);
        }
    };


    return (

        <main className="login-page">

            <section className="login-form-panel">

                <div
                    className="login-form-wrapper"
                >

                    {/* ==================================================
                        AI CAREER OS BRAND
                    ================================================== */}

                    <Link
                        to="/login"
                        className="recovery-brand"
                    >

                        <div
                            className="recovery-brand-logo"
                            aria-hidden="true"
                        >

                            <span
                                className="recovery-logo-line recovery-logo-left"
                            />

                            <span
                                className="recovery-logo-line recovery-logo-center"
                            />

                            <span
                                className="recovery-logo-line recovery-logo-right"
                            />

                        </div>


                        <div className="recovery-brand-name">

                            <strong>
                                AI Career OS
                            </strong>

                            <span>
                                Career intelligence platform
                            </span>

                        </div>

                    </Link>


                    <div
                        className="login-heading"
                    >

                        <div
                            className="login-overline"
                        >
                            ACCOUNT RECOVERY
                        </div>


                        <h2>

                            {step === "email"
                                ? "Reset your password."
                                : "Check your email."
                            }

                        </h2>


                        <p>

                            {step === "email"
                                ? "Enter your account email and we'll send you a verification code."
                                : `We sent a 6-digit verification code to ${email}.`
                            }

                        </p>

                    </div>


                    {step === "email" && (

                        <form
                            className="real-login-form"
                            onSubmit={sendCode}
                        >

                            {error && (

                                <div className="form-error" role="alert" id="recovery-error">

                                    <span className="error-symbol">
                                        !
                                    </span>

                                    <p>
                                        {error}
                                    </p>

                                </div>

                            )}


                            <div className="real-field">

                                <label
                                    htmlFor="forgot-email"
                                >
                                    Email address
                                </label>


                                <div className="real-input">

                                    <svg
                                        viewBox="0 0 24 24"
                                    >

                                        <rect
                                            x="3"
                                            y="5"
                                            width="18"
                                            height="14"
                                            rx="2"
                                        />

                                        <path
                                            d="m4 7 8 6 8-6"
                                        />

                                    </svg>


                                    <input
                                        id="forgot-email"
                                        type="email"
                                        value={email}
                                        onChange={(event) =>
                                            setEmail(
                                                event.target.value
                                            )
                                        }
                                        placeholder="you@example.com"
                                        required
                                    />

                                </div>

                            </div>


                            {message && (

                                <div className="reset-success">

                                    {message}

                                </div>

                            )}


                            <button
                                type="submit"
                                className="primary-login-button"
                                disabled={loading}
                            >

                                {loading
                                    ? "Sending..."
                                    : "Send verification code"
                                }

                            </button>

                        </form>

                    )}


                    {step === "code" && (

                        <form
                            className="real-login-form"
                            onSubmit={verifyCode}
                        >

                            {error && (

                                <div className="form-error" role="alert" id="recovery-error">

                                    <span className="error-symbol">
                                        !
                                    </span>

                                    <p>
                                        {error}
                                    </p>

                                </div>

                            )}


                            <div className="real-field">

                                <label
                                    htmlFor="reset-code"
                                >
                                    Verification code
                                </label>


                                <div className="real-input">

                                    <input
                                        id="reset-code"
                                    aria-invalid={error === "Enter the 6-digit verification code." || undefined}
                                    aria-describedby={error === "Enter the 6-digit verification code." ? "recovery-error" : undefined}
                                        value={code}
                                        onChange={(event) =>
                                            setCode(
                                                event.target.value
                                                    .replace(/\D/g, "")
                                                    .slice(0, 6)
                                            )
                                        }
                                        inputMode="numeric"
                                        maxLength={6}
                                        placeholder="000000"
                                        autoFocus
                                        required
                                    />

                                </div>

                            </div>


                            <button
                                type="submit"
                                className="primary-login-button"
                                disabled={loading}
                            >

                                {loading
                                    ? "Verifying..."
                                    : "Verify code"
                                }

                            </button>


                            <button
                                type="button"
                                className="secondary-action"
                                onClick={() => {

                                    setStep("email");
                                    setCode("");
                                    setError("");
                                    setMessage("");

                                }}
                            >
                                Use another email
                            </button>

                        </form>

                    )}


                    <div className="create-account-section">


                        <div className="create-divider">

                            <span />

                            <small>
                                Remember your password?
                            </small>

                            <span />

                        </div>


                        <Link
                            to="/login"
                            className="create-account-link"
                        >

                            <span>
                                Back to sign in
                            </span>


                            <strong>
                                →
                            </strong>

                        </Link>


                    </div>


                </div>

            </section>

        </main>

    );

};


export default ForgotPassword;