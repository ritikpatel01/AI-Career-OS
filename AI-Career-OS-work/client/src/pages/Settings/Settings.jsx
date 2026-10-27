
import { useEffect, useState } from "react";
import "./Settings.css";

const SETTINGS_KEY = "ai-career-os-settings";

const DEFAULT_SETTINGS = {
    name: "",
    email: "",
    education: "",
    careerGoal: "Full-stack Developer",
    experience: "Beginner",
    languages: ["JavaScript", "Python"],
    learningHours: "2",
    theme: "light",
    language: "English",
    timezone: "Asia/Kathmandu",
    privacy: {
        personalization: true,
        analytics: false,
    },
    notifications: {
        learning: true,
        projects: true,
        career: true,
        email: false,
    },
};

const NAV_ITEMS = [
    { id: "profile", icon: "◉", label: "Profile", group: "PERSONAL" },
    { id: "appearance", icon: "◐", label: "Appearance", group: "PERSONAL" },
    { id: "notifications", icon: "♧", label: "Notifications", group: "PREFERENCES" },
    { id: "ai", icon: "✳", label: "AI preferences", group: "PREFERENCES" },
    { id: "security", icon: "◇", label: "Security", group: "ACCOUNT" },
    { id: "account", icon: "⚙", label: "Account", group: "ACCOUNT" },
];

const LANGUAGE_OPTIONS = [
    "JavaScript",
    "Python",
    "Java",
    "C++",
    "TypeScript",
    "Go",
    "C",
    "SQL",
];

function applyTheme(theme) {
    const normalizedTheme = theme === "dark" ? "dark" : "light";

    document.documentElement.dataset.theme = normalizedTheme;
    document.body.dataset.theme = normalizedTheme;

    document.documentElement.style.colorScheme = normalizedTheme;
    document.body.style.colorScheme = normalizedTheme;

    return normalizedTheme;
}

function readSavedSettings() {
    const defaults = {
        ...DEFAULT_SETTINGS,
        languages: [...DEFAULT_SETTINGS.languages],
        privacy: { ...DEFAULT_SETTINGS.privacy },
        notifications: { ...DEFAULT_SETTINGS.notifications },
    };

    try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (!saved) return defaults;

        const parsed = JSON.parse(saved);

        return {
            ...defaults,
            ...parsed,
            theme: parsed.theme === "dark" ? "dark" : "light",
            languages: Array.isArray(parsed.languages)
                ? parsed.languages
                : [...defaults.languages],
            privacy: {
                ...defaults.privacy,
                ...(parsed.privacy || {}),
            },
            notifications: {
                ...defaults.notifications,
                ...(parsed.notifications || {}),
            },
        };
    } catch (error) {
        console.error("Unable to load settings:", error);
        return defaults;
    }
}

function SettingsField({ label, hint, children }) {
    return (
        <div className="settings-field">
            <div className="settings-field-label">{label}</div>
            {children}
            {hint && <p className="settings-field-hint">{hint}</p>}
        </div>
    );
}

function Toggle({ checked, onChange, label, description }) {
    return (
        <div className="settings-toggle-row">
            <div className="settings-toggle-copy">
                <strong>{label}</strong>
                {description && <p>{description}</p>}
            </div>

            <button
                type="button"
                className={`settings-switch ${checked ? "is-on" : ""}`}
                role="switch"
                aria-checked={checked}
                aria-label={label}
                onClick={() => onChange(!checked)}
            >
                <span />
            </button>
        </div>
    );
}

export default function Settings() {
    const [activeTab, setActiveTab] = useState("profile");
    const [settings, setSettings] = useState(readSavedSettings);
    const [savedMessage, setSavedMessage] = useState("");
    const [passwordMessage, setPasswordMessage] = useState("");

    const [passwordForm, setPasswordForm] = useState({
        current: "",
        next: "",
        confirm: "",
    });

    // Apply the saved theme on mount and whenever the selected theme changes.
    useEffect(() => {
        applyTheme(settings.theme);
    }, [settings.theme]);

    // Update the global theme and persist all current settings immediately.
    const updateSetting = (key, value) => {
        setSettings((previous) => {
            const next = { ...previous, [key]: value };

            if (key === "theme") {
                const theme = applyTheme(value);
                next.theme = theme;

                try {
                    localStorage.setItem(
                        SETTINGS_KEY,
                        JSON.stringify(next)
                    );
                } catch (error) {
                    console.error("Unable to save theme:", error);
                }
            }

            return next;
        });

        setSavedMessage("");
    };

    const updateNotification = (key, value) => {
        setSettings((previous) => ({
            ...previous,
            notifications: {
                ...previous.notifications,
                [key]: value,
            },
        }));
        setSavedMessage("");
    };

    const updatePrivacy = (key, value) => {
        setSettings((previous) => ({
            ...previous,
            privacy: {
                ...previous.privacy,
                [key]: value,
            },
        }));
        setSavedMessage("");
    };

    const toggleLanguage = (language) => {
        const selected = settings.languages.includes(language);

        updateSetting(
            "languages",
            selected
                ? settings.languages.filter((item) => item !== language)
                : [...settings.languages, language]
        );
    };

    const saveSettings = (event) => {
        event?.preventDefault();

        try {
            const theme = applyTheme(settings.theme);

            const settingsToSave = {
                ...settings,
                theme,
            };

            localStorage.setItem(
                SETTINGS_KEY,
                JSON.stringify(settingsToSave)
            );

            setSavedMessage("Your preferences have been saved.");
        } catch (error) {
            console.error("Unable to save settings:", error);
            setSavedMessage(
                "Could not save settings. Check your browser storage."
            );
        }
    };

    const resetSettings = () => {
        const confirmed = window.confirm(
            "Reset all preferences to their default values?"
        );

        if (!confirmed) return;

        const defaults = {
            ...DEFAULT_SETTINGS,
            languages: [...DEFAULT_SETTINGS.languages],
            privacy: { ...DEFAULT_SETTINGS.privacy },
            notifications: { ...DEFAULT_SETTINGS.notifications },
        };

        setSettings(defaults);
        applyTheme(defaults.theme);
        setPasswordMessage("");

        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaults));
            setSavedMessage("Your preferences have been reset.");
        } catch (error) {
            console.error("Unable to reset settings:", error);
            setSavedMessage("Could not save the reset preferences.");
        }
    };

    const submitPasswordChange = (event) => {
        event.preventDefault();
        setPasswordMessage("");

        if (
            !passwordForm.current ||
            !passwordForm.next ||
            !passwordForm.confirm
        ) {
            setPasswordMessage("Please complete all password fields.");
            return;
        }

        if (passwordForm.next.length < 8) {
            setPasswordMessage(
                "Your new password must contain at least 8 characters."
            );
            return;
        }

        if (passwordForm.next !== passwordForm.confirm) {
            setPasswordMessage("Your new passwords do not match.");
            return;
        }

        setPasswordMessage(
            "The form is valid. Connect it to your backend password-change API to update your password."
        );
    };

    const currentTab = NAV_ITEMS.find((item) => item.id === activeTab);
    const displayName = settings.name.trim() || "Your name";
    const displayInitial = displayName.charAt(0).toUpperCase();

    return (
        <div className={`settings-page theme-${settings.theme}`}>
            <header className="settings-page-header">
                <div>
                    <p className="settings-eyebrow">WORKSPACE PREFERENCES</p>
                    <h1>Settings</h1>
                    <p className="settings-header-description">
                        Personalize your workspace, manage your preferences,
                        and organize your career goals.
                    </p>
                </div>

                <div className="settings-header-avatar">
                    {displayInitial}
                </div>
            </header>

            <div className="settings-layout">
                <aside className="settings-menu">
                    <div className="settings-menu-heading">
                        <span className="settings-menu-icon">⚙</span>
                        <div>
                            <strong>Settings</strong>
                            <p>Manage your workspace</p>
                        </div>
                    </div>

                    {["PERSONAL", "PREFERENCES", "ACCOUNT"].map((group) => (
                        <div className="settings-nav-group" key={group}>
                            <p className="settings-nav-group-title">{group}</p>

                            {NAV_ITEMS.filter((item) => item.group === group).map(
                                (item) => (
                                    <button
                                        type="button"
                                        key={item.id}
                                        className={`settings-nav-item ${
                                            activeTab === item.id ? "active" : ""
                                        }`}
                                        onClick={() => {
                                            setActiveTab(item.id);
                                            setSavedMessage("");
                                            setPasswordMessage("");
                                        }}
                                    >
                                        <span className="settings-nav-icon">
                                            {item.icon}
                                        </span>
                                        <span>{item.label}</span>
                                        {activeTab === item.id && (
                                            <span className="settings-nav-indicator" />
                                        )}
                                    </button>
                                )
                            )}
                        </div>
                    ))}

                    <div className="settings-menu-note">
                        <span>✦</span>
                        <strong>Keep growing.</strong>
                        <p>
                            Small improvements create lasting career progress.
                        </p>
                    </div>
                </aside>

                <main className="settings-main">
                    <div className="settings-breadcrumb">
                        <span>Workspace</span>
                        <span>/</span>
                        <span>Settings</span>
                        <span>/</span>
                        <strong>{currentTab?.label}</strong>
                    </div>

                    <div className="settings-section-heading">
                        <div>
                            <h2>{currentTab?.label}</h2>
                            <p>
                                Manage your{" "}
                                {currentTab?.label.toLowerCase()} preferences.
                            </p>
                        </div>
                        <span className="settings-section-symbol">
                            {currentTab?.icon}
                        </span>
                    </div>

                    {savedMessage && (
                        <div className="settings-feedback" role="status">
                            <span>✓</span>
                            {savedMessage}
                        </div>
                    )}

                    {activeTab === "profile" && (
                        <form onSubmit={saveSettings}>
                            <section className="settings-card">
                                <div className="settings-card-heading">
                                    <div>
                                        <h3>Personal information</h3>
                                        <p>
                                            Keep your personal and career
                                            information up to date.
                                        </p>
                                    </div>
                                    <span>◉</span>
                                </div>

                                <div className="settings-profile-preview">
                                    <div className="settings-large-avatar">
                                        {displayInitial}
                                    </div>
                                    <div>
                                        <strong>{displayName}</strong>
                                        <p>
                                            {settings.email ||
                                                "Add your email address"}
                                        </p>
                                        <span className="settings-profile-badge">
                                            CAREER WORKSPACE
                                        </span>
                                    </div>
                                </div>

                                <div className="settings-form-grid">
                                    <SettingsField label="Full name">
                                        <input
                                            className="settings-input"
                                            type="text"
                                            autoComplete="name"
                                            placeholder="Enter your full name"
                                            value={settings.name}
                                            onChange={(event) =>
                                                updateSetting(
                                                    "name",
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </SettingsField>

                                    <SettingsField label="Email address">
                                        <input
                                            className="settings-input"
                                            type="email"
                                            autoComplete="email"
                                            placeholder="you@example.com"
                                            value={settings.email}
                                            onChange={(event) =>
                                                updateSetting(
                                                    "email",
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </SettingsField>

                                    <SettingsField label="Education">
                                        <select
                                            className="settings-input"
                                            value={settings.education}
                                            onChange={(event) =>
                                                updateSetting(
                                                    "education",
                                                    event.target.value
                                                )
                                            }
                                        >
                                            <option value="">Select your education</option>
                                            <option value="High school">High school</option>
                                            <option value="Diploma">Diploma</option>
                                            <option value="Bachelor's degree">
                                                Bachelor's degree
                                            </option>
                                            <option value="Master's degree">
                                                Master's degree
                                            </option>
                                            <option value="Doctorate">Doctorate</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </SettingsField>

                                    <SettingsField label="Career goal">
                                        <select
                                            className="settings-input"
                                            value={settings.careerGoal}
                                            onChange={(event) =>
                                                updateSetting(
                                                    "careerGoal",
                                                    event.target.value
                                                )
                                            }
                                        >
                                            <option value="Full-stack Developer">
                                                Full-stack Developer
                                            </option>
                                            <option value="Frontend Developer">
                                                Frontend Developer
                                            </option>
                                            <option value="Backend Developer">
                                                Backend Developer
                                            </option>
                                            <option value="AI Engineer">AI Engineer</option>
                                            <option value="Data Scientist">
                                                Data Scientist
                                            </option>
                                            <option value="DevOps Engineer">
                                                DevOps Engineer
                                            </option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </SettingsField>

                                    <SettingsField label="Experience level">
                                        <select
                                            className="settings-input"
                                            value={settings.experience}
                                            onChange={(event) =>
                                                updateSetting(
                                                    "experience",
                                                    event.target.value
                                                )
                                            }
                                        >
                                            <option value="Beginner">Beginner</option>
                                            <option value="Intermediate">
                                                Intermediate
                                            </option>
                                            <option value="Advanced">Advanced</option>
                                        </select>
                                    </SettingsField>

                                    <SettingsField label="Learning hours per day">
                                        <select
                                            className="settings-input"
                                            value={settings.learningHours}
                                            onChange={(event) =>
                                                updateSetting(
                                                    "learningHours",
                                                    event.target.value
                                                )
                                            }
                                        >
                                            <option value="1">1 hour</option>
                                            <option value="2">2 hours</option>
                                            <option value="3">3 hours</option>
                                            <option value="4">4 hours</option>
                                            <option value="5+">5+ hours</option>
                                        </select>
                                    </SettingsField>
                                </div>

                                <div className="settings-card-divider" />

                                <div className="settings-subheading">
                                    <h4>Programming languages</h4>
                                    <p>
                                        Choose the languages you are learning
                                        or using.
                                    </p>
                                </div>

                                <div className="settings-language-grid">
                                    {LANGUAGE_OPTIONS.map((language) => {
                                        const selected =
                                            settings.languages.includes(language);

                                        return (
                                            <button
                                                type="button"
                                                key={language}
                                                className={`settings-language-option ${
                                                    selected ? "selected" : ""
                                                }`}
                                                aria-pressed={selected}
                                                onClick={() =>
                                                    toggleLanguage(language)
                                                }
                                            >
                                                <span className="settings-language-check">
                                                    {selected ? "✓" : "+"}
                                                </span>
                                                {language}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="settings-card-footer">
                                    <p>
                                        Your profile helps personalize your
                                        career workspace.
                                    </p>
                                    <button
                                        className="settings-primary-button"
                                        type="submit"
                                    >
                                        Save profile
                                    </button>
                                </div>
                            </section>
                        </form>
                    )}

                    {activeTab === "appearance" && (
                        <section className="settings-card">
                            <div className="settings-card-heading">
                                <div>
                                    <h3>Workspace appearance</h3>
                                    <p>
                                        Choose the appearance that feels
                                        comfortable for your workspace.
                                    </p>
                                </div>
                                <span>◐</span>
                            </div>

                            <div className="settings-theme-grid">
                                {[
                                    {
                                        value: "light",
                                        title: "Light mode",
                                        description: "A bright, clean workspace.",
                                    },
                                    {
                                        value: "dark",
                                        title: "Dark mode",
                                        description: "A darker look for low-light use.",
                                    },
                                ].map((theme) => (
                                    <button
                                        type="button"
                                        key={theme.value}
                                        className={`settings-theme-option ${
                                            settings.theme === theme.value
                                                ? "selected"
                                                : ""
                                        }`}
                                        aria-pressed={
                                            settings.theme === theme.value
                                        }
                                        onClick={() =>
                                            updateSetting("theme", theme.value)
                                        }
                                    >
                                        <div
                                            className={`settings-theme-preview ${theme.value}`}
                                        >
                                            <div className="settings-preview-sidebar" />
                                            <div className="settings-preview-content">
                                                <span />
                                                <span />
                                                <span />
                                            </div>
                                        </div>

                                        <div className="settings-theme-copy">
                                            <div>
                                                <strong>{theme.title}</strong>
                                                <p>{theme.description}</p>
                                            </div>
                                            <span className="settings-theme-check">
                                                {settings.theme === theme.value
                                                    ? "✓"
                                                    : ""}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="settings-info-note">
                                <span>ⓘ</span>
                                <p>
                                    Your theme is applied immediately and saved
                                    in this browser. Pages must use the global
                                    theme variables to change their surfaces.
                                </p>
                            </div>

                            <div className="settings-card-footer">
                                <p>Choose the theme you prefer.</p>
                                <button
                                    type="button"
                                    className="settings-primary-button"
                                    onClick={saveSettings}
                                >
                                    Save appearance
                                </button>
                            </div>
                        </section>
                    )}

                    {activeTab === "notifications" && (
                        <section className="settings-card">
                            <div className="settings-card-heading">
                                <div>
                                    <h3>Notification preferences</h3>
                                    <p>
                                        Choose the updates you want to receive.
                                    </p>
                                </div>
                                <span>♧</span>
                            </div>

                            <div className="settings-toggle-list">
                                <Toggle
                                    label="Learning reminders"
                                    description="Reminders to stay consistent with your learning plan."
                                    checked={settings.notifications.learning}
                                    onChange={(value) =>
                                        updateNotification("learning", value)
                                    }
                                />
                                <Toggle
                                    label="Project updates"
                                    description="Updates about your projects and milestones."
                                    checked={settings.notifications.projects}
                                    onChange={(value) =>
                                        updateNotification("projects", value)
                                    }
                                />
                                <Toggle
                                    label="Career opportunities"
                                    description="Career tips, interview preparation, and job-related updates."
                                    checked={settings.notifications.career}
                                    onChange={(value) =>
                                        updateNotification("career", value)
                                    }
                                />
                                <Toggle
                                    label="Email notifications"
                                    description="Allow the app to use your email preference for future notifications."
                                    checked={settings.notifications.email}
                                    onChange={(value) =>
                                        updateNotification("email", value)
                                    }
                                />
                            </div>

                            <div className="settings-info-note">
                                <span>ⓘ</span>
                                <p>
                                    These options are saved as preferences.
                                    Actual reminders and emails require a
                                    notification service or backend integration.
                                </p>
                            </div>

                            <div className="settings-card-footer">
                                <p>Your notification choices can be changed anytime.</p>
                                <button
                                    type="button"
                                    className="settings-primary-button"
                                    onClick={saveSettings}
                                >
                                    Save preferences
                                </button>
                            </div>
                        </section>
                    )}

                    {activeTab === "ai" && (
                        <section className="settings-card">
                            <div className="settings-card-heading">
                                <div>
                                    <h3>AI personalization</h3>
                                    <p>
                                        Help your AI career assistant tailor
                                        suggestions to your goals.
                                    </p>
                                </div>
                                <span>✳</span>
                            </div>

                            <SettingsField
                                label="Target career"
                                hint="The role you want your learning roadmap to support."
                            >
                                <select
                                    className="settings-input"
                                    value={settings.careerGoal}
                                    onChange={(event) =>
                                        updateSetting("careerGoal", event.target.value)
                                    }
                                >
                                    <option value="Full-stack Developer">
                                        Full-stack Developer
                                    </option>
                                    <option value="Frontend Developer">
                                        Frontend Developer
                                    </option>
                                    <option value="Backend Developer">
                                        Backend Developer
                                    </option>
                                    <option value="AI Engineer">AI Engineer</option>
                                    <option value="Data Scientist">Data Scientist</option>
                                    <option value="DevOps Engineer">
                                        DevOps Engineer
                                    </option>
                                    <option value="Other">Other</option>
                                </select>
                            </SettingsField>

                            <SettingsField
                                label="Current experience"
                                hint="This helps determine the difficulty of recommended tasks."
                            >
                                <select
                                    className="settings-input"
                                    value={settings.experience}
                                    onChange={(event) =>
                                        updateSetting("experience", event.target.value)
                                    }
                                >
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </SettingsField>

                            <SettingsField
                                label="Daily learning target"
                                hint="Set a realistic daily target for your learning plan."
                            >
                                <select
                                    className="settings-input"
                                    value={settings.learningHours}
                                    onChange={(event) =>
                                        updateSetting(
                                            "learningHours",
                                            event.target.value
                                        )
                                    }
                                >
                                    <option value="1">1 hour per day</option>
                                    <option value="2">2 hours per day</option>
                                    <option value="3">3 hours per day</option>
                                    <option value="4">4 hours per day</option>
                                    <option value="5+">5+ hours per day</option>
                                </select>
                            </SettingsField>

                            <div className="settings-card-divider" />

                            <div className="settings-subheading">
                                <h4>Preferred technologies</h4>
                                <p>
                                    Select the technologies you want to focus on.
                                </p>
                            </div>

                            <div className="settings-language-grid">
                                {LANGUAGE_OPTIONS.map((language) => {
                                    const selected =
                                        settings.languages.includes(language);

                                    return (
                                        <button
                                            type="button"
                                            key={language}
                                            className={`settings-language-option ${
                                                selected ? "selected" : ""
                                            }`}
                                            aria-pressed={selected}
                                            onClick={() => toggleLanguage(language)}
                                        >
                                            <span className="settings-language-check">
                                                {selected ? "✓" : "+"}
                                            </span>
                                            {language}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="settings-info-note">
                                <span>ⓘ</span>
                                <p>
                                    These preferences are stored locally.
                                    Personalized AI responses require your AI
                                    service to read these settings.
                                </p>
                            </div>

                            <div className="settings-card-footer">
                                <p>Save your choices to keep your preferences.</p>
                                <button
                                    type="button"
                                    className="settings-primary-button"
                                    onClick={saveSettings}
                                >
                                    Save AI preferences
                                </button>
                            </div>
                        </section>
                    )}

                    {activeTab === "security" && (
                        <section className="settings-card">
                            <div className="settings-card-heading">
                                <div>
                                    <h3>Security and privacy</h3>
                                    <p>
                                        Manage your password and privacy
                                        preferences.
                                    </p>
                                </div>
                                <span>🔒</span>
                            </div>

                            <div className="settings-info-note">
                                <span>ⓘ</span>
                                <p>
                                    Password changes require a backend
                                    authentication API. This form validates your
                                    input but does not change your actual password.
                                </p>
                            </div>

                            <form onSubmit={submitPasswordChange}>
                                <div className="settings-subheading">
                                    <h4>Password and authentication</h4>
                                    <p>
                                        Use a strong password that you do not
                                        use elsewhere.
                                    </p>
                                </div>

                                <SettingsField label="Current password">
                                    <input
                                        type="password"
                                        className="settings-input"
                                        placeholder="Enter current password"
                                        autoComplete="current-password"
                                        value={passwordForm.current}
                                        onChange={(event) =>
                                            setPasswordForm((previous) => ({
                                                ...previous,
                                                current: event.target.value,
                                            }))
                                        }
                                    />
                                </SettingsField>

                                <SettingsField label="New password">
                                    <input
                                        type="password"
                                        className="settings-input"
                                        placeholder="Enter new password"
                                        autoComplete="new-password"
                                        value={passwordForm.next}
                                        onChange={(event) =>
                                            setPasswordForm((previous) => ({
                                                ...previous,
                                                next: event.target.value,
                                            }))
                                        }
                                    />
                                </SettingsField>

                                <SettingsField label="Confirm new password">
                                    <input
                                        type="password"
                                        className="settings-input"
                                        placeholder="Confirm new password"
                                        autoComplete="new-password"
                                        value={passwordForm.confirm}
                                        onChange={(event) =>
                                            setPasswordForm((previous) => ({
                                                ...previous,
                                                confirm: event.target.value,
                                            }))
                                        }
                                    />
                                </SettingsField>

                                {passwordMessage && (
                                    <div className="settings-feedback" role="status">
                                        {passwordMessage}
                                    </div>
                                )}

                                <div className="settings-card-footer">
                                    <p>Your password is never saved in local storage.</p>
                                    <button
                                        type="submit"
                                        className="settings-primary-button"
                                    >
                                        Validate password change
                                    </button>
                                </div>
                            </form>

                            <div className="settings-card-divider" />

                            <div className="settings-subheading">
                                <h4>Privacy preferences</h4>
                                <p>
                                    Choose how optional data and personalization
                                    should be handled.
                                </p>
                            </div>

                            <div className="settings-toggle-list">
                                <Toggle
                                    label="Personalized experience"
                                    description="Use your saved career preferences to personalize your dashboard."
                                    checked={settings.privacy.personalization}
                                    onChange={(value) =>
                                        updatePrivacy("personalization", value)
                                    }
                                />
                                <Toggle
                                    label="Usage analytics"
                                    description="Allow optional usage analytics when analytics integration is available."
                                    checked={settings.privacy.analytics}
                                    onChange={(value) =>
                                        updatePrivacy("analytics", value)
                                    }
                                />
                            </div>

                            <div className="settings-card-footer">
                                <p>Save your privacy preferences.</p>
                                <button
                                    type="button"
                                    className="settings-primary-button"
                                    onClick={saveSettings}
                                >
                                    Save security preferences
                                </button>
                            </div>
                        </section>
                    )}

                    {activeTab === "account" && (
                        <section className="settings-card">
                            <div className="settings-card-heading">
                                <div>
                                    <h3>Account preferences</h3>
                                    <p>
                                        Manage your account details and
                                        application preferences.
                                    </p>
                                </div>
                                <span>♙</span>
                            </div>

                            <div className="settings-info-note">
                                <span>ⓘ</span>
                                <p>
                                    These preferences are saved in your browser.
                                    Account changes require a backend integration
                                    to sync across devices.
                                </p>
                            </div>

                            <div className="settings-subheading">
                                <h4>Application preferences</h4>
                                <p>
                                    Choose how you want the application to behave.
                                </p>
                            </div>

                            <SettingsField
                                label="Language"
                                hint="Select your preferred application language."
                            >
                                <select
                                    className="settings-input"
                                    value={settings.language}
                                    onChange={(event) =>
                                        updateSetting("language", event.target.value)
                                    }
                                >
                                    <option value="English">English</option>
                                    <option value="Hindi">Hindi</option>
                                    <option value="Nepali">Nepali</option>
                                </select>
                            </SettingsField>

                            <SettingsField
                                label="Timezone"
                                hint="Choose the timezone used for your schedule."
                            >
                                <select
                                    className="settings-input"
                                    value={settings.timezone}
                                    onChange={(event) =>
                                        updateSetting("timezone", event.target.value)
                                    }
                                >
                                    <option value="Asia/Kathmandu">
                                        Nepal (Asia/Kathmandu)
                                    </option>
                                    <option value="Asia/Kolkata">
                                        India (Asia/Kolkata)
                                    </option>
                                    <option value="UTC">UTC</option>
                                </select>
                            </SettingsField>

                            <div className="settings-card-divider" />

                            <div className="settings-subheading">
                                <h4>Reset preferences</h4>
                                <p>
                                    Restore your saved settings to their default
                                    values.
                                </p>
                            </div>

                            <div className="settings-danger-zone">
                                <div>
                                    <h4>Reset all settings</h4>
                                    <p>
                                        This resets your saved application
                                        preferences on this device.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="settings-danger-button"
                                    onClick={resetSettings}
                                >
                                    Reset settings
                                </button>
                            </div>

                            <div className="settings-card-footer">
                                <p>Save your application preferences.</p>
                                <button
                                    type="button"
                                    className="settings-primary-button"
                                    onClick={saveSettings}
                                >
                                    Save account preferences
                                </button>
                            </div>
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
}
