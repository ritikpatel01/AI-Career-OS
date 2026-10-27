
import { useEffect, useState } from "react";
import "./Profile.css";
import { useAuth } from "../../context/AuthContext";
import {
    getProfile,
    createProfile,
    updateProfile
} from "../../services/profileService";

function ProfileIcon({ name }) {
    const paths = {
        person: "M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M16 5a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
        education: "m2 9 10-6 10 6-10 6L2 9Zm4 3v6l6 3 6-3v-6M22 9v8",
        link: "m10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 12a4 4 0 0 0 6 0l5-5a4 4 0 0 0-6-6l-1 1",
        location: "M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
        github: "M9 19c-4 1-4-2-6-2m12 5v-4a3 3 0 0 0-.8-2.3c2.7-.3 5.6-1.3 5.6-6A4.6 4.6 0 0 0 18.6 6a4.3 4.3 0 0 0-.1-3s-1-.3-3.3 1.2a11.4 11.4 0 0 0-6 0C6.9 2.7 5.9 3 5.9 3a4.3 4.3 0 0 0-.1 3 4.6 4.6 0 0 0-1.2 3.2c0 4.7 2.9 5.7 5.6 6A3 3 0 0 0 9.4 18v4",
        linkedin: "M4 9h4v12H4V9Zm2-6h.01M12 21V9h4v2c1-3 6-3 6 2v8M16 13v8",
        save: "m5 12 4 4L19 6",
    };
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.person} /></svg>;
}

const safeProfileLink = value => {
    try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : null; }
    catch { return null; }
};

// Presentation only: a placeholder URL must not appear as a real portfolio.
const portfolioPreviewLink = value => {
    const href = safeProfileLink(value);
    if (!href) return null;
    const hostname = new URL(href).hostname.replace(/^www\./, "");
    return ["yourportfolio.com", "example.com", "example.org", "example.net"].includes(hostname) ? null : href;
};

const Profile = () => {
    const { user } = useAuth();
    const displayName = typeof user?.name === "string" ? user.name.trim() : "";
    const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part.charAt(0)).join("").toUpperCase();
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
    const [loadFailed, setLoadFailed] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchProfile = async () => {
        try {
            setError("");
            setLoadFailed(false);
            setLoading(true);

            const response = await getProfile();

            if (response.data) {
                setProfile(response.data);
                setFormData({
                    bio: response.data.bio || "",
                    phone: response.data.phone || "",
                    location: response.data.location || "",
                    education: response.data.education?.[0]?.degree || "",
                    experience: response.data.experience?.[0]?.description || "",
                    github: response.data.socialLinks?.github || "",
                    linkedin: response.data.socialLinks?.linkedin || "",
                    portfolio: response.data.socialLinks?.portfolio || ""
                });
            }
        } catch (fetchError) {
            if (fetchError.message === "Profile not found") {
                setProfile(null);
            } else {
                setError(fetchError.message || "Failed to load your profile.");
                setLoadFailed(true);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setSuccess("");
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

            const preserveEntries = (entries, field, value) => {
                const existingEntries = Array.isArray(entries) ? entries : [];

                if (existingEntries.length === 0) {
                    return value.trim() ? [{ [field]: value }] : [];
                }

                return existingEntries.map((entry, index) =>
                    index === 0 ? { ...entry, [field]: value } : entry
                );
            };

            const profileData = {
                bio: formData.bio,
                phone: formData.phone,
                location: formData.location,

                education: preserveEntries(
                    profile?.education,
                    "degree",
                    formData.education
                ),
                experience: preserveEntries(
                    profile?.experience,
                    "description",
                    formData.experience
                ),

                socialLinks: {
                    github: formData.github,
                    linkedin: formData.linkedin,
                    portfolio: formData.portfolio
                }
            };

            let response;
            const isUpdating = Boolean(profile);

            if (isUpdating) {
                response = await updateProfile(profileData);
            } else {
                response = await createProfile(profileData);
            }

            setProfile(response.data);

            setSuccess(
                isUpdating
                    ? "Profile updated successfully."
                    : "Profile created successfully."
            );
        } catch (error) {
            setError(error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="profile-page">
                <div className="profile-loading" role="status">
                    Loading your profile...
                </div>
            </div>
        );
    }

    if (loadFailed) {
        return (
            <div className="profile-page">
                <div className="profile-message profile-error" role="alert">
                    {error}
                </div>
                <div className="profile-save-area">
                    <button type="button" onClick={fetchProfile}>
                        Retry loading profile
                    </button>
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
                        Bring your experience, background, and professional presence together.
                    </p>
                </div>
                <a className="profile-edit-link" href="#profile-bio"><ProfileIcon name="person" />Edit profile</a>
            </div>

            {/* Profile Overview */}

            <div className="profile-overview">

                <div className="profile-avatar" aria-hidden="true">
                    {initials || <ProfileIcon name="person" />}
                </div>

                <div className="profile-overview-content">

                    <span className="profile-identity-kicker">PROFESSIONAL IDENTITY</span>

                    <h2>
                        {displayName || "Your career profile"}
                    </h2>

                    <div className="profile-meta">

                        {formData.location && (
                            <span>
                                <ProfileIcon name="location" /> {formData.location}
                            </span>
                        )}

                        {formData.education && <span><ProfileIcon name="education" /> {formData.education}</span>}
                    </div>

                    <div className="profile-introduction">
                        <p className="profile-summary-bio">
                            {formData.bio ? (formData.bio.length > 220 ? `${formData.bio.slice(0, 220).trimEnd()}…` : formData.bio) : "Add a short introduction so your experience has a story behind it."}
                        </p>
                        {formData.bio.length > 220 && (
                            <details className="profile-full-bio">
                                <summary><span className="profile-bio-expand">Read full biography</span><span className="profile-bio-collapse">Collapse biography</span></summary>
                                <p>{formData.bio}</p>
                            </details>
                        )}
                    </div>

                    <div className="profile-social-links" role="group" aria-label="Professional profile links">
                        {[["github", "GitHub"], ["linkedin", "LinkedIn"], ["portfolio", "Portfolio"]].map(([key, label]) => {
                            const href = key === "portfolio" ? portfolioPreviewLink(formData[key]) : safeProfileLink(formData[key]);
                            return href ? <a key={key} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} (opens in a new tab)`}><ProfileIcon name={key === "portfolio" ? "link" : key} />{label}<span aria-hidden="true">↗</span></a> : null;
                        })}
                    </div>
                </div>

                <span className="profile-preview-label">Preview of your edits</span>

            </div>

            {/* Messages */}

            {error && (
                <div className="profile-message profile-error" role="alert">
                    {error}
                </div>
            )}

            {success && (
                <div className="profile-message profile-success" role="status">
                    {success}
                </div>
            )}

            {/* Main Form */}

            <form
                className="profile-form"
                onSubmit={handleSubmit}
                aria-busy={saving}
            >

                {/* Personal Information */}

                <section className="profile-section" aria-labelledby="profile-personal-title">

                    <div className="profile-section-header">

                        <div className="profile-section-icon">
                            <ProfileIcon name="person" />
                        </div>

                        <div>

                            <h2 id="profile-personal-title">Personal information</h2>

                            <p>
                                Basic information about you.
                            </p>

                        </div>

                    </div>

                    <div className="profile-field">

                        <label htmlFor="profile-bio">Bio</label>

                        <textarea
                            id="profile-bio"
                                name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Write a short professional introduction..."
                            rows="7"
                            aria-describedby="profile-bio-hint"
                        />
                        <p id="profile-bio-hint" className="profile-field-hint">A short introduction to your interests, strengths, and goals.</p>

                    </div>

                    <div className="profile-grid">

                        <div className="profile-field">

                            <label htmlFor="profile-phone">Phone</label>

                            <input
                                type="tel"
                                autoComplete="tel"
                                id="profile-phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Phone number"
                            />

                        </div>

                        <div className="profile-field">

                            <label htmlFor="profile-location">Location</label>

                            <input
                                type="text"
                                id="profile-location"
                                autoComplete="address-level2"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="City, Country"
                            />

                        </div>

                    </div>

                </section>

                {/* Education & Experience */}

                <section className="profile-section" aria-labelledby="profile-background-title">

                    <div className="profile-section-header">

                        <div className="profile-section-icon">
                            <ProfileIcon name="education" />
                        </div>

                        <div>

                            <h2 id="profile-background-title">Education &amp; experience</h2>

                            <p>
                                Build your professional background.
                            </p>


                        </div>

                    </div>

                    <div className="profile-field profile-background-group">

                        <label htmlFor="profile-education">Education</label>

                        <input
                            type="text"
                            id="profile-education"
                                name="education"
                            value={formData.education}
                            onChange={handleChange}
                            placeholder="e.g. B.Tech Computer Science"
                            aria-describedby="profile-education-hint"
                        />
                        <p id="profile-education-hint" className="profile-field-hint">Your qualification or current course of study.</p>

                    </div>

                    <div className="profile-field profile-background-group">

                        <label htmlFor="profile-experience">Experience</label>

                        <textarea
                            id="profile-experience"
                                name="experience"
                            value={formData.experience}
                            onChange={handleChange}
                            placeholder="Describe your internships, work experience or achievements..."
                            rows="7"
                            aria-describedby="profile-experience-hint"
                        />
                        <p id="profile-experience-hint" className="profile-field-hint">Focus on your work, responsibilities, and contributions.</p>

                    </div>

                    <p className="profile-field-hint profile-entry-note">This form edits the first education and experience entry. Additional entries and their details are preserved when you save.</p>

                </section>

                {/* Social Links */}

                <section className="profile-section profile-section-links" aria-labelledby="profile-links-title">

                    <div className="profile-section-header">

                        <div className="profile-section-icon">
                            <ProfileIcon name="link" />
                        </div>

                        <div>

                            <h2 id="profile-links-title">Professional links</h2>

                            <p>
                                Connect your online professional
                                presence.
                            </p>

                        </div>

                    </div>

                    <div className="profile-field">

                        <label htmlFor="profile-github">GitHub</label>

                        <input
                            type="url"
                            id="profile-github"
                                name="github"
                            value={formData.github}
                            onChange={handleChange}
                            placeholder="https://github.com/username"
                        />

                    </div>

                    <div className="profile-field">

                        <label htmlFor="profile-linkedin">LinkedIn</label>

                        <input
                            type="url"
                            id="profile-linkedin"
                                name="linkedin"
                            value={formData.linkedin}
                            onChange={handleChange}
                            placeholder="https://linkedin.com/in/username"
                        />

                    </div>

                    <div className="profile-field">

                        <label htmlFor="profile-portfolio">Portfolio</label>

                        <input
                            type="url"
                            id="profile-portfolio"
                                name="portfolio"
                            value={formData.portfolio}
                            onChange={handleChange}
                            placeholder="https://yourportfolio.com"
                        />

                    </div>

                </section>

                {/* Save */}

                <div className="profile-save-area">

                    <div className="profile-save-copy"><strong>{saving ? "Saving your profile…" : "Make it yours. Keep it current."}</strong><p>Your edits are saved only when you select Save changes.</p></div>

                    <button
                        type="submit"
                        disabled={saving}
                    >
                        <ProfileIcon name="save" />
                        {saving
                            ? "Saving..."
                            : "Save changes"}
                    </button>

                </div>

            </form>

        </div>
    );
};

export default function ProfileDesktopCanvas() {
    return (
        <div className="profile-desktop-scroll" role="region" aria-label="Profile page. Scroll horizontally to view all content on narrow screens." tabIndex={0}>
            <div className="profile-desktop-canvas">
                <Profile />
            </div>
        </div>
    );
}
