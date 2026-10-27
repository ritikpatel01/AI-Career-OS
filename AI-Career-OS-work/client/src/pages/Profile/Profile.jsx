
import { useEffect, useState } from "react";
import "./Profile.css";
import {
    getProfile,
    createProfile,
    updateProfile
} from "../../services/profileService";

const Profile = () => {
    const [profile, setProfile] = useState(null);

    const [formData, setFormData] = useState({
        bio: "",

        phone: "",
        location: "",
        education: "",
        experience: "",
        github: "",
        linkedin: "",
        portfolio: ""
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setError("");

                const response = await getProfile();

                if (response.data) {
                    setProfile(response.data);

                    setFormData({
                        bio: response.data.bio || "",
                        phone: response.data.phone || "",
                        location: response.data.location || "",
                        education:
                            response.data.education?.[0]?.degree || "",
                        experience:
                            response.data.experience?.[0]?.description || "",
                        github:
                            response.data.socialLinks?.github || "",
                        linkedin:
                            response.data.socialLinks?.linkedin || "",
                        portfolio:
                            response.data.socialLinks?.portfolio || ""
                    });
                }
            } catch (error) {
                if (error.message !== "Profile not found") {
                    setError(error.message);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

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
            setSuccess("");
            setSaving(true);

            const profileData = {
                bio: formData.bio,
                phone: formData.phone,
                location: formData.location,

                education: formData.education
                    ? [
                          {
                              degree: formData.education
                          }
                      ]
                    : [],

                experience: formData.experience
                    ? [
                          {
                              description: formData.experience
                          }
                      ]
                    : [],

                socialLinks: {
                    github: formData.github,
                    linkedin: formData.linkedin,
                    portfolio: formData.portfolio
                }
            };

            let response;

            if (profile) {
                response = await updateProfile(profileData);
            } else {
                response = await createProfile(profileData);
            }

            setProfile(response.data);

            setSuccess("Profile updated successfully.");
        } catch (error) {
            setError(error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="profile-page">
                <div className="profile-loading">
                    Loading your profile...
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">

            {/* Page Header */}

            <div className="profile-page-header">
                <div>
                    <span className="profile-eyebrow">
                        CAREER PROFILE
                    </span>

                    <h1>My Profile</h1>

                    <p>
                        Manage your professional identity and
                        career information.
                    </p>
                </div>
            </div>

            {/* Profile Overview */}

            <div className="profile-overview">

                <div className="profile-avatar">
                    {formData.bio
                        ? formData.bio.charAt(0).toUpperCase()
                        : "U"}
                </div>

                <div className="profile-overview-content">

                    <h2>
                        {formData.education ||
                            "Career Profile"}
                    </h2>

                    <p>
                        {formData.bio ||
                            "Add a short bio to introduce yourself."}
                    </p>

                    <div className="profile-meta">

                        {formData.location && (
                            <span>
                                📍 {formData.location}
                            </span>
                        )}

                        {formData.github && (
                            <span>
                                💻 GitHub
                            </span>
                        )}

                        {formData.linkedin && (
                            <span>
                                🔗 LinkedIn
                            </span>
                        )}

                    </div>
                </div>

            </div>

            {/* Messages */}

            {error && (
                <div className="profile-message profile-error">
                    {error}
                </div>
            )}

            {success && (
                <div className="profile-message profile-success">
                    {success}
                </div>
            )}

            {/* Main Form */}

            <form
                className="profile-form"
                onSubmit={handleSubmit}
            >

                {/* Personal Information */}

                <section className="profile-section">

                    <div className="profile-section-header">

                        <div className="profile-section-icon">
                            👤
                        </div>

                        <div>

                            <h2>Personal Information</h2>

                            <p>
                                Basic information about you.
                            </p>

                        </div>

                    </div>

                    <div className="profile-field">

                        <label>Bio</label>

                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Write a short professional introduction..."
                            rows="4"
                        />

                    </div>

                    <div className="profile-grid">

                        <div className="profile-field">

                            <label>Phone</label>

                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Phone number"
                            />

                        </div>

                        <div className="profile-field">

                            <label>Location</label>

                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="City, Country"
                            />

                        </div>

                    </div>

                </section>

                {/* Education & Experience */}

                <section className="profile-section">

                    <div className="profile-section-header">

                        <div className="profile-section-icon">
                            🎓
                        </div>

                        <div>

                            <h2>Education & Experience</h2>

                            <p>
                                Build your professional background.
                            </p>

                        </div>

                    </div>

                    <div className="profile-field">

                        <label>Education</label>

                        <input
                            type="text"
                            name="education"
                            value={formData.education}
                            onChange={handleChange}
                            placeholder="e.g. B.Tech Computer Science"
                        />

                    </div>

                    <div className="profile-field">

                        <label>Experience</label>

                        <textarea
                            name="experience"
                            value={formData.experience}
                            onChange={handleChange}
                            placeholder="Describe your internships, work experience or achievements..."
                            rows="5"
                        />

                    </div>

                </section>

                {/* Social Links */}

                <section className="profile-section">

                    <div className="profile-section-header">

                        <div className="profile-section-icon">
                            🔗
                        </div>

                        <div>

                            <h2>Professional Links</h2>

                            <p>
                                Connect your online professional
                                presence.
                            </p>

                        </div>

                    </div>

                    <div className="profile-field">

                        <label>GitHub</label>

                        <input
                            type="url"
                            name="github"
                            value={formData.github}
                            onChange={handleChange}
                            placeholder="https://github.com/username"
                        />

                    </div>

                    <div className="profile-field">

                        <label>LinkedIn</label>

                        <input
                            type="url"
                            name="linkedin"
                            value={formData.linkedin}
                            onChange={handleChange}
                            placeholder="https://linkedin.com/in/username"
                        />

                    </div>

                    <div className="profile-field">

                        <label>Portfolio</label>

                        <input
                            type="url"
                            name="portfolio"
                            value={formData.portfolio}
                            onChange={handleChange}
                            placeholder="https://yourportfolio.com"
                        />

                    </div>

                </section>

                {/* Save */}

                <div className="profile-save-area">

                    <button
                        type="submit"
                        disabled={saving}
                    >
                        {saving
                            ? "Saving..."
                            : "Save Changes"}
                    </button>

                </div>

            </form>

        </div>
    );
};

export default Profile;