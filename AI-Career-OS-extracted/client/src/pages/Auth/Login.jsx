
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

const Icon = ({ name, size = 20 }) => {
    const common = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.7,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true,
    };

    const paths = {
        mail: <>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m4 7 8 6 8-6" />
        </>,
        lock: <>
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </>,
        eye: <>
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
        </>,
        eyeOff: <>
            <path d="m3 3 18 18" />
            <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
            <path d="M9.9 5.2A11 11 0 0 1 12 5c6.5 0 10 7 10 7a15 15 0 0 1-3.1 3.9" />
            <path d="M6.2 6.2C3.5 8 2 12 2 12s3.5 7 10 7c1.3 0 2.5-.3 3.6-.8" />
        </>,
        shield: <>
            <path d="M12 3 19 6v5c0 4.8-2.8 8-7 10-4.2-2-7-5.2-7-10V6l7-3Z" />
            <path d="m9 12 2 2 4-5" />
        </>,
        file: <>
            <rect x="5" y="3" width="14" height="18" rx="2" />
            <path d="M8 8h8M8 12h8M8 16h5" />
        </>,
        chart: <>
            <path d="M4 19V5M4 19h16" />
            <path d="M8 15v-4M12 15V7M16 15V4" />
        </>,
        folder: <>
            <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
        </>,
        user: <>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
        </>,
    };

    return <svg {...common}>{paths[name] || null}</svg>;
};

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        if (error) setError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (loading) return;

        const email = formData.email.trim();
        const password = formData.password;

        if (!email) {
            setError("Please enter your email address.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        if (!password) {
            setError("Please enter your password.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const apiBase = (
                import.meta.env.VITE_API_URL ||
                "http://localhost:5000/api"
            ).replace(/\/+$/, "");

            const response = await fetch(`${apiBase}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            let result = null;

            try {
                result = await response.json();
            } catch {
                result = null;
            }

            if (!response.ok) {
                throw new Error(
                    result?.message ||
                    result?.error ||
                    "Unable to sign in. Please check your credentials."
                );
            }

            const token =
                result?.token ||
                result?.accessToken ||
                result?.data?.token ||
                result?.data?.accessToken ||
                result?.data?.user?.token;

            const user =
                result?.user ||
                result?.data?.user ||
                result?.data?.profile ||
                null;

            if (!token) {
                throw new Error(
                    "The server did not return an authentication token."
                );
            }

            // Keep authentication storage consistent with AuthContext.
            login(user, token, rememberMe);

            navigate("/dashboard", { replace: true });
        } catch (requestError) {
            console.error("Login Error:", requestError);

            setError(
                requestError.message ||
                "Something went wrong while signing in."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="login-page">
            {/* LEFT: Brand and product showcase */}
            <section className="login-brand-panel">
                <div className="brand-orb brand-orb-one" />
                <div className="brand-orb brand-orb-two" />

                <div className="login-brand-content">
                    <Link to="/login" className="company-brand">
                        <div className="company-logo" aria-hidden="true">
                            <span className="logo-line logo-line-left" />
                            <span className="logo-line logo-line-center" />
                            <span className="logo-line logo-line-right" />
                        </div>

                        <div className="company-name">
                            <strong>AI Career OS</strong>
                            <span>Career intelligence platform</span>
                        </div>
                    </Link>

                    <div className="brand-message">
                        <div className="brand-eyebrow">
                            <span className="eyebrow-dot" />
                            YOUR CAREER WORKSPACE
                        </div>

                        <h1>
                            Your career,
                            <br />
                            <span>in one workspace.</span>
                        </h1>

                        <p className="brand-description">
                            Build your profile, strengthen your skills,
                            manage projects, prepare for interviews and
                            discover opportunities — all in one connected
                            workspace.
                        </p>
                    </div>

                    <div className="workspace-list">
                        <div className="workspace-item">
                            <div className="workspace-icon">
                                <Icon name="file" />
                            </div>
                            <div>
                                <strong>Profile & Resume</strong>
                                <span>Keep your career information organised.</span>
                            </div>
                            <span className="workspace-arrow">↗</span>
                        </div>

                        <div className="workspace-item">
                            <div className="workspace-icon">
                                <Icon name="chart" />
                            </div>
                            <div>
                                <strong>Skills & Progress</strong>
                                <span>Know what to learn and improve next.</span>
                            </div>
                            <span className="workspace-arrow">↗</span>
                        </div>

                        <div className="workspace-item">
                            <div className="workspace-icon">
                                <Icon name="folder" />
                            </div>
                            <div>
                                <strong>Projects & GitHub</strong>
                                <span>Turn your work into career evidence.</span>
                            </div>
                            <span className="workspace-arrow">↗</span>
                        </div>

                        <div className="workspace-item">
                            <div className="workspace-icon">
                                <Icon name="user" />
                            </div>
                            <div>
                                <strong>Interviews & Jobs</strong>
                                <span>Prepare for your next opportunity.</span>
                            </div>
                            <span className="workspace-arrow">↗</span>
                        </div>
                    </div>

                    {/* Decorative product preview, not a screenshot */}
                    <div className="dashboard-preview">
                        <div className="preview-topbar">
                            <div className="preview-brand">
                                <span className="preview-logo">✳</span>
                                <span>Career dashboard</span>
                            </div>
                            <span className="preview-live">
                                <i /> LIVE WORKSPACE
                            </span>
                        </div>

                        <div className="preview-greeting">
                            <div>
                                <span>YOUR NEXT CHAPTER</span>
                                <h3>Keep building your future.</h3>
                            </div>
                            <div className="preview-avatar">AI</div>
                        </div>

                        <div className="preview-stats">
                            <div>
                                <span>Projects</span>
                                <strong>Build</strong>
                                <small>Show your work</small>
                            </div>
                            <div>
                                <span>Skills</span>
                                <strong>Grow</strong>
                                <small>Learn every day</small>
                            </div>
                            <div>
                                <span>Career</span>
                                <strong>Advance</strong>
                                <small>Move forward</small>
                            </div>
                        </div>

                        <div className="preview-progress">
                            <div>
                                <span>Career development</span>
                                <strong>One step at a time</strong>
                            </div>
                            <div className="preview-progress-track">
                                <span />
                            </div>
                        </div>
                    </div>

                    <div className="workflow-bar">
                        <span className="workflow-label">YOUR WORKFLOW</span>
                        <div className="workflow-steps">
                            <span>Plan</span><i />
                            <span>Practice</span><i />
                            <span>Improve</span><i />
                            <span>Move forward</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* RIGHT: Real sign-in form */}
            <section className="login-form-panel">
                <div className="login-form-wrapper">
                    <div className="login-mobile-brand">
                        <div className="company-logo" aria-hidden="true">
                            <span className="logo-line logo-line-left" />
                            <span className="logo-line logo-line-center" />
                            <span className="logo-line logo-line-right" />
                        </div>
                        <div className="company-name">
                            <strong>AI Career OS</strong>
                            <span>Career intelligence platform</span>
                        </div>
                    </div>

                    <div className="login-heading">
                        <div className="login-overline">
                            <span>WELCOME BACK</span>
                            <span className="heading-line" />
                        </div>

                        <h2>
                            Sign in to your
                            <br />
                            workspace.
                        </h2>

                        <p>
                            Continue building your career from your
                            personalised workspace.
                        </p>
                    </div>

                    <form
                        className="real-login-form"
                        onSubmit={handleSubmit}
                        noValidate
                    >
                        {error && (
                            <div className="form-error" role="alert">
                                <span className="error-symbol">!</span>
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="real-field">
                            <label htmlFor="login-email">Email address</label>

                            <div className="real-input">
                                <Icon name="mail" size={19} />
                                <input
                                    id="login-email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    required
                                />
                            </div>
                        </div>

                        <div className="real-field">
                            <div className="password-label-row">
                                <label htmlFor="login-password">Password</label>
                                <Link
                                    to="/forgot-password"
                                    className="forgot-password-link"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <div className="real-input">
                                <Icon name="lock" size={19} />
                                <input
                                    id="login-password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    required
                                />

                                <button
                                    type="button"
                                    className="password-action"
                                    onClick={() => setShowPassword((value) => !value)}
                                    aria-label={
                                        showPassword ? "Hide password" : "Show password"
                                    }
                                >
                                    <Icon
                                        name={showPassword ? "eyeOff" : "eye"}
                                        size={18}
                                    />
                                </button>
                            </div>
                        </div>

                        <div className="login-options">
                            <label className="remember-control">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(event) =>
                                        setRememberMe(event.target.checked)
                                    }
                                />
                                <span className="custom-checkbox" />
                                <span>Remember me</span>
                            </label>

                            <span className="login-status">
                                <i />
                                Secure sign in
                            </span>
                        </div>

                        <button
                            type="submit"
                            className="primary-login-button"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="button-spinner" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign in
                                    <span className="button-arrow">→</span>
                                </>
                            )}
                        </button>

                        <p className="form-footnote">
                            By signing in, you continue to your personal
                            career workspace.
                        </p>
                    </form>

                    <div className="create-account-section">
                        <div className="create-divider">
                            <span />
                            <small>New to AI Career OS?</small>
                            <span />
                        </div>

                        <Link to="/register" className="create-account-link">
                            <span className="create-account-icon">＋</span>
                            <span>Create an account</span>
                            <strong>→</strong>
                        </Link>
                    </div>

                    <div className="login-trust">
                        <div className="trust-icon">
                            <Icon name="shield" size={21} />
                        </div>
                        <div>
                            <strong>Your workspace is private.</strong>
                            <span>
                                Your career journey, organised in one place.
                            </span>
                        </div>
                    </div>

                    <footer className="login-footer">
                        <span>© {new Date().getFullYear()} AI Career OS</span>
                        <span className="footer-separator">•</span>
                        <span>Built for your next chapter</span>
                    </footer>
                </div>
            </section>
        </main>
    );
};

export default Login;
