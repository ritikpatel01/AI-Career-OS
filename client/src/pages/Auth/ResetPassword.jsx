import { API_BASE_URL } from "../../services/api";
import { useState } from "react";
import "./Login.css";

import {
    Link,
    useLocation,
    useNavigate
} from "react-router-dom";

import "./Login.css";


const ResetPassword = () => {

    const location =
        useLocation();

    const navigate =
        useNavigate();


    const email =
        location.state?.email ||
        "";

    const resetToken =
        location.state?.resetToken ||
        "";


    const [password, setPassword] =
        useState("");


    const [confirmPassword, setConfirmPassword] =
        useState("");


    const [showPassword, setShowPassword] =
        useState(false);


    const [showConfirm, setShowConfirm] =
        useState(false);


    const [loading, setLoading] =
        useState(false);


    const [error, setError] =
        useState("");


    const [success, setSuccess] =
        useState("");





    if (!email || !resetToken) {

        return (
            <main className="login-page reset-password-page">

                <section className="login-form-panel">

                    <div className="login-form-wrapper">

                        <Link to="/login" className="reset-brand" aria-label="AI Career OS sign in">
                        <span className="reset-brand-mark" aria-hidden="true">✳</span>
                        <span>AI Career OS</span>
                    </Link>
                    <div className="reset-lock" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7">
                            <rect x="5" y="10" width="14" height="11" rx="3" />
                            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                            <path d="M12 14v3" />
                        </svg>
                    </div>

                    <div className="login-heading">

                            <div className="login-overline">
                                PASSWORD RESET
                            </div>

                            <h2>
                                Reset session expired.
                            </h2>

                            <p>
                                Start the password recovery
                                process again.
                            </p>

                        </div>


                        <Link
                            to="/forgot-password"
                            className="primary-login-button"
                            style={{
                                textDecoration: "none"
                            }}
                        >
                            Request a new code
                        </Link>

                    </div>

                </section>

            </main>
        );
    }


    const handleSubmit = async (
        event
    ) => {

        event.preventDefault();

        setError("");
        setSuccess("");


        if (password.length < 8) {

            setError(
                "Password must be at least 8 characters long."
            );

            return;
        }


        if (password !== confirmPassword) {

            setError(
                "Passwords do not match."
            );

            return;
        }


        setLoading(true);


        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/auth/reset-password`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            email,
                            resetToken,
                            newPassword:
                                password
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data?.message ||
                    "Unable to reset password."
                );
            }


            setSuccess(
                "Your password has been changed successfully."
            );


            setTimeout(() => {

                navigate(
                    "/login",
                    {
                        replace: true
                    }
                );

            }, 1200);

        } catch (error) {

            setError(
                error.message
            );

        } finally {

            setLoading(false);
        }
    };


    return (
        <main className="login-page reset-password-page">

            <section className="login-form-panel">

                <div
                    className="login-form-wrapper"
                >

                    <Link to="/login" className="reset-brand" aria-label="AI Career OS sign in">
                        <span className="reset-brand-mark" aria-hidden="true">✳</span>
                        <span>AI Career OS</span>
                    </Link>
                    <div className="reset-lock" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7">
                            <rect x="5" y="10" width="14" height="11" rx="3" />
                            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                            <path d="M12 14v3" />
                        </svg>
                    </div>

                    <div className="login-heading">

                        <div className="login-overline">
                            PASSWORD RESET
                        </div>

                        <h2>
                            Set your new password.
                        </h2>

                        <p>
                            Make it unique. Get back to building your future.
                        </p>

                    </div>


                    <form
                        className="real-login-form"
                        onSubmit={handleSubmit}
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


                        {success && (
                            <div className="reset-success" role="status">
                                {success}
                            </div>
                        )}


                        <div className="real-field">

                            <label htmlFor="new-password">
                                New password
                            </label>

                            <div className="real-input">

                                <svg
                                    viewBox="0 0 24 24"
                                >
                                    <rect
                                        x="5"
                                        y="10"
                                        width="14"
                                        height="11"
                                        rx="2"
                                    />

                                    <path
                                        d="M8 10V7a4 4 0 0 1 8 0v3"
                                    />

                                    <circle
                                        cx="12"
                                        cy="15"
                                        r="1"
                                    />
                                </svg>

                                <input
                                    id="new-password"
                                    autoComplete="new-password"
                                    aria-invalid={error === "Password must be at least 8 characters long." || undefined}
                                    aria-describedby={error === "Password must be at least 8 characters long." ? "recovery-error reset-length-hint" : "reset-length-hint"}
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Enter new password"
                                    required
                                />

                                <button
                                    type="button"
                                    className="password-action"
                                    aria-label={showPassword ? "Hide new password" : "Show new password"}
                                    aria-pressed={showPassword}
                                    onClick={() =>
                                        setShowPassword(
                                            (value) =>
                                                !value
                                        )
                                    }
                                >
                                    {showPassword
                                        ? "Hide"
                                        : "Show"
                                    }
                                </button>

                            </div>

                        </div>


                        <p id="reset-length-hint" className={`reset-guidance${password.length >= 8 ? " is-met" : ""}`}>
                            <span aria-hidden="true">{password.length >= 8 ? "✓" : "○"}</span> At least 8 characters
                        </p>

                        <div className="real-field">

                            <label htmlFor="confirm-password">
                                Confirm password
                            </label>

                            <div className="real-input">

                                <svg
                                    viewBox="0 0 24 24"
                                >
                                    <rect
                                        x="5"
                                        y="10"
                                        width="14"
                                        height="11"
                                        rx="2"
                                    />

                                    <path
                                        d="M8 10V7a4 4 0 0 1 8 0v3"
                                    />

                                    <circle
                                        cx="12"
                                        cy="15"
                                        r="1"
                                    />
                                </svg>

                                <input
                                    id="confirm-password"
                                    autoComplete="new-password"
                                    aria-invalid={error === "Passwords do not match." || undefined}
                                    aria-describedby={error === "Passwords do not match." ? "recovery-error reset-match-hint" : "reset-match-hint"}
                                    type={
                                        showConfirm
                                            ? "text"
                                            : "password"
                                    }
                                    value={
                                        confirmPassword
                                    }
                                    onChange={(event) =>
                                        setConfirmPassword(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Confirm new password"
                                    required
                                />

                                <button
                                    type="button"
                                    className="password-action"
                                    aria-label={showConfirm ? "Hide confirmation password" : "Show confirmation password"}
                                    aria-pressed={showConfirm}
                                    onClick={() =>
                                        setShowConfirm(
                                            (value) =>
                                                !value
                                        )
                                    }
                                >
                                    {showConfirm
                                        ? "Hide"
                                        : "Show"
                                    }
                                </button>

                            </div>

                        </div>


                        <p id="reset-match-hint" className={`reset-guidance reset-match${confirmPassword && password === confirmPassword ? " is-met" : ""}`} aria-live="polite">
                            {confirmPassword ? (password === confirmPassword ? "✓ Passwords match" : "Passwords don’t match yet") : "Re-enter your password to confirm"}
                        </p>

                        <button
                            type="submit"
                            className="primary-login-button"
                            disabled={loading}
                        >
                            {loading && <span className="reset-loading-icon" aria-hidden="true" />}
                            {loading ? "Updating password…" : "Update password"}

                            {!loading && (
                                <span className="button-arrow">
                                    →
                                </span>
                            )}
                        </button>

                    </form>
                    <Link to="/login" className="reset-back">← Back to sign in</Link>


                    <div className="login-trust">

                        <div className="trust-icon">

                            <svg
                                viewBox="0 0 24 24"
                            >
                                <path
                                    d="M12 3 19 6v5c0 4.8-2.8 8-7 10-4.2-2-7-5.2-7-10V6l7-3Z"
                                />

                                <path
                                    d="m9 12 2 2 4-5"
                                />

                            </svg>

                        </div>

                        <div>

                            <strong>
                                Password reset protected
                            </strong>

                            <span>
                                Your verification session is
                                temporary and can only be used once.
                            </span>

                        </div>

                    </div>

                </div>

            </section>

        </main>
    );
};


export default ResetPassword;