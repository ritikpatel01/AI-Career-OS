import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import { registerUser } from "../../services/authService";

import "./Register.css";

const Register = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setError("");
            setLoading(true);

            await registerUser(formData);

            navigate("/login");

        } catch (error) {
            setError(
                error.details?.length
                    ? error.details.join(", ")
                    : error.message
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">

            <div className="auth-container">

                {/* LEFT SIDE */}

                <div className="auth-brand-section">

                    <div className="auth-brand">

                        <div className="auth-brand-icon">
                            🧠
                        </div>

                        <span>
                            AI Career OS
                        </span>

                    </div>


                    <div className="auth-brand-content">

                        <span className="auth-eyebrow">
                            START YOUR CAREER JOURNEY
                        </span>

                        <h1>
                            Your career.
                            <span>
                                Your future.
                            </span>
                        </h1>

                        <p>
                            Create your AI Career OS account
                            and organize your skills, projects,
                            DSA preparation and interview journey
                            in one place.
                        </p>

                    </div>


                    <div className="auth-features">

                        <div>
                            <span>✓</span>
                            <p>
                                Personalized career tracking
                            </p>
                        </div>

                        <div>
                            <span>✓</span>
                            <p>
                                DSA and interview preparation
                            </p>
                        </div>

                        <div>
                            <span>✓</span>
                            <p>
                                Manage projects and skills
                            </p>
                        </div>

                    </div>

                </div>


                {/* RIGHT SIDE */}

                <div className="auth-form-section">

                    <div className="auth-form-wrapper">

                        <div className="auth-mobile-brand">

                            <div className="auth-brand-icon">
                                🧠
                            </div>

                            <span>
                                AI Career OS
                            </span>

                        </div>


                        <div className="auth-form-header">

                            <h2>
                                Create your account
                            </h2>

                            <p>
                                Start building your career
                                smarter today.
                            </p>

                        </div>


                        {error && (
                            <div className="auth-error">
                                {error}
                            </div>
                        )}


                        <form
                            className="auth-form"
                            onSubmit={handleSubmit}
                        >

                            {/* NAME */}

                            <div className="auth-field">

                                <label htmlFor="name">
                                    Full Name
                                </label>

                                <input
                                    id="name"
                                    type="text"
                                    name="name"
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />

                            </div>


                            {/* EMAIL */}

                            <div className="auth-field">

                                <label htmlFor="email">
                                    Email Address
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />

                            </div>


                            {/* PASSWORD */}

                            <div className="auth-field">

                                <div className="auth-label-row">

                                    <label htmlFor="password">
                                        Password
                                    </label>

                                    <span>
                                        Keep it secure
                                    </span>

                                </div>

                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    placeholder="Create a password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />

                            </div>


                            {/* REGISTER BUTTON */}

                            <button
                                type="submit"
                                className="auth-submit-button"
                                disabled={loading}
                            >
                                {loading
                                    ? "Creating account..."
                                    : "Create Account"}
                            </button>

                        </form>


                        <div className="auth-divider">

                            <span>
                                Already have an account?
                            </span>

                        </div>


                        <Link
                            to="/login"
                            className="auth-register-button"
                        >
                            Sign In
                        </Link>


                        <p className="auth-footer">
                            Your career journey starts here.
                        </p>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default Register;