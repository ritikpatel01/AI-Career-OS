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


    const API_URL =
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000";


    if (!email || !resetToken) {

        return (
            <main className="login-page">

                <section className="login-form-panel">

                    <div className="login-form-wrapper">

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
                    `${API_URL}/api/auth/reset-password`,
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
        <main className="login-page">

            <section className="login-form-panel">

                <div
                    className="login-form-wrapper"
                >

                    <div className="login-heading">

                        <div className="login-overline">
                            PASSWORD RESET
                        </div>

                        <h2>
                            Create a new
                            <br />
                            password.
                        </h2>

                        <p>
                            Choose a strong password for
                            your AI Career OS account.
                        </p>

                    </div>


                    <form
                        className="real-login-form"
                        onSubmit={handleSubmit}
                    >

                        {error && (
                            <div className="form-error">

                                <span className="error-symbol">
                                    !
                                </span>

                                <p>
                                    {error}
                                </p>

                            </div>
                        )}


                        {success && (
                            <div className="reset-success">
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


                        <button
                            type="submit"
                            className="primary-login-button"
                            disabled={loading}
                        >
                            {loading
                                ? "Updating..."
                                : "Update password"
                            }

                            {!loading && (
                                <span className="button-arrow">
                                    →
                                </span>
                            )}
                        </button>

                    </form>


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