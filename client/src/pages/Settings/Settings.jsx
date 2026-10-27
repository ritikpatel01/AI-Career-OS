
import { cloneElement, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Settings.css";
import { useAuth } from "../../context/AuthContext";
import { DEFAULT_EYE_COMFORT, EYE_COMFORT_EVENT, getEyeComfort, saveEyeComfort } from "../../utils/eyeComfort.js";
import { APP_ZOOM_EVENT, DEFAULT_APP_ZOOM, getAppZoom, saveAppZoom } from "../../utils/appZoom.js";

const SETTINGS_KEY = "ai-career-os-settings";

const DEFAULT_SETTINGS = {
    name: "",
    email: "",
    education: "",
    careerGoal: "Full-stack Developer",
    experience: "Beginner",
    languages: ["JavaScript", "Python"],
    learningHours: "2",
    theme: "dark",
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

const SECTION_DESCRIPTIONS = {
    profile: "Your signed-in identity and professional profile.",
    appearance: "Choose a comfortable look for your workspace.",
    notifications: "Record notification choices for future use.",
    ai: "Record learning goals and technologies for future use.",
    security: "Password recovery and browser-local privacy preferences.",
    account: "Manage local preferences and restore their defaults.",
};

function SettingsIcon({ name }) {
    const paths = {
        profile: "M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M16 5a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
        appearance: "M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z",
        notifications: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
        ai: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z",
        security: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6",
        account: "M4 5h16v14H4V5Zm0 5h16M9 10v9",
    };
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d={paths[name] || paths.account} />
        </svg>
    );
}

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

const SECTION_KEYS = {
    appearance: ["theme"],
    notifications: ["notifications"],
    ai: ["careerGoal", "experience", "languages", "learningHours"],
    security: ["privacy"],
    account: ["language", "timezone"],
};

// Deterministic device defaults retain the existing theme, goal, and timezone.
const ENUM_OPTIONS = {
    careerGoal: ["Full-stack Developer", "Frontend Developer", "Backend Developer", "AI Engineer", "Data Scientist", "DevOps Engineer", "Other"],
    experience: ["Beginner", "Intermediate", "Advanced"],
    learningHours: ["1", "2", "3", "4", "5+"],
    theme: ["light", "dark"],
    language: ["English", "Hindi", "Nepali"],
    timezone: ["Asia/Kathmandu", "Asia/Kolkata", "UTC"],
};
const isRecord = value => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const normalizeBoolean = (value, fallback) => value === true || value === "true" ? true : value === false || value === "false" ? false : fallback;
function normalizeSettings(value) {
    const input = isRecord(value) ? value : {};
    const result = { ...DEFAULT_SETTINGS };
    for (const [key, options] of Object.entries(ENUM_OPTIONS)) result[key] = options.includes(input[key]) ? input[key] : DEFAULT_SETTINGS[key];
    for (const key of ["name", "email", "education"]) result[key] = typeof input[key] === "string" ? input[key] : DEFAULT_SETTINGS[key];
    result.languages = Array.isArray(input.languages)
        ? [...new Set(input.languages.filter(item => typeof item === "string" && LANGUAGE_OPTIONS.includes(item)))]
        : [...DEFAULT_SETTINGS.languages];
    for (const section of ["privacy", "notifications"]) {
        result[section] = Object.fromEntries(Object.entries(DEFAULT_SETTINGS[section]).map(([key, fallback]) =>
            [key, normalizeBoolean(isRecord(input[section]) ? input[section][key] : undefined, fallback)]));
    }
    return result;
}
function readStoredSettings() {
    // A storage-access failure must remain a failure, not trigger data replacement.
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { values: {}, recovered: false };
    try {
        const parsed = JSON.parse(raw);
        if (isRecord(parsed)) return { values: parsed, recovered: false };
    } catch { /* Invalid JSON cannot be safely partially reconstructed. */ }
    return { values: {}, recovered: true };
}
function readSettingsSnapshot() {
    try {
        const stored = readStoredSettings();
        return { preferences: normalizeSettings(stored.values), notice: stored.recovered
            ? "Saved preferences could not be read. Validated defaults are shown; Save or Reset can repair this browser's preference storage. Nothing has been changed yet." : "" };
    } catch {
        return { preferences: normalizeSettings({}), notice: "Browser storage is unavailable. Defaults are shown; changes may only last for this visit." };
    }
}
function persistPreferences(values) {
    const stored = readStoredSettings();
    const normalized = normalizeSettings({ ...stored.values, ...values });
    const safeValues = Object.fromEntries(Object.keys(values).filter(key => Object.hasOwn(DEFAULT_SETTINGS, key)).map(key => [key, normalized[key]]));
    for (const section of ["privacy", "notifications"]) {
        if (Object.hasOwn(safeValues, section) && isRecord(stored.values[section])) {
            safeValues[section] = { ...stored.values[section], ...safeValues[section] };
        }
    }
    // Retain every recoverable legacy/unknown field. Replace malformed roots
    // only during an explicit successful Save or Reset, never initialization.
    const next = { ...(stored.recovered ? normalizeSettings({}) : stored.values), ...safeValues };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    return { preferences: normalizeSettings(next), recovered: stored.recovered };
}
const manualSections = Object.keys(SECTION_KEYS).filter(key => key !== "appearance");
const sectionIsDirty = (draft, saved, section) => (SECTION_KEYS[section] || []).some(key => JSON.stringify(draft[key]) !== JSON.stringify(saved[key]));

function SettingsField({ label, hint, children }) {
    const generatedId = useId();
    const id = children.props.id || generatedId;
    const hintId = `${id}-hint`;
    return (
        <div className="settings-field">
            <label className="settings-field-label" htmlFor={id}>{label}</label>
            {cloneElement(children, { id, "aria-describedby": hint ? hintId : children.props["aria-describedby"] })}
            {hint && <p id={hintId} className="settings-field-hint">{hint}</p>}
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
                className={`settings-switch ${checked === true ? "is-on" : ""}`}
                role="switch"
                aria-checked={checked === true}
                aria-label={label}
                onClick={() => onChange(!checked)}
            >
                <span />
            </button>
        </div>
    );
}

function Settings() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("profile");
    const [initialSnapshot] = useState(readSettingsSnapshot);
    const [settings, setSettings] = useState(initialSnapshot.preferences);
    const [savedSettings, setSavedSettings] = useState(initialSnapshot.preferences);
    const [storageNotice, setStorageNotice] = useState(initialSnapshot.notice);
    const settingsRef = useRef(settings);
    const savedRef = useRef(savedSettings);
    settingsRef.current = settings;
    savedRef.current = savedSettings;
    const hasUnsavedChanges = manualSections.some(section => sectionIsDirty(settings, savedSettings, section));
    const currentSectionDirty = sectionIsDirty(settings, savedSettings, activeTab);
    const [savedMessage, setSavedMessage] = useState("");
    const [saveError, setSaveError] = useState(false);
    const [comfort, setComfort] = useState(getEyeComfort);
    const [comfortMessage, setComfortMessage] = useState("");
    const [comfortError, setComfortError] = useState(false);
    const [zoomPreferences, setZoomPreferences] = useState(getAppZoom);
    const [zoomMessage, setZoomMessage] = useState("");
    const [zoomError, setZoomError] = useState(false);

    useEffect(() => {
        const syncSettings = (event) => {
            if (event.key !== SETTINGS_KEY && event.key !== null) return;
            if (event.storageArea && event.storageArea !== window.localStorage) return;
            const snapshot = readSettingsSnapshot();
            const baseline = savedRef.current;
            const draft = settingsRef.current;
            const dirtySections = manualSections.filter(section => sectionIsDirty(draft, baseline, section));
            const next = { ...snapshot.preferences };
            for (const section of dirtySections) for (const key of SECTION_KEYS[section]) next[key] = draft[key];
            setSettings(next);
            setSavedSettings(snapshot.preferences);
            setStorageNotice(snapshot.notice || (dirtySections.length
                ? "Preferences changed in another tab. Your unsaved sections were kept; saving a section will replace its stored values."
                : "Preferences updated from another tab."));
            setSavedMessage("");
            setSaveError(false);
        };
        window.addEventListener("storage", syncSettings);
        return () => window.removeEventListener("storage", syncSettings);
    }, []);

    useEffect(() => {
        if (!hasUnsavedChanges) return;
        const warnBeforeUnload = (event) => { event.preventDefault(); event.returnValue = ""; };
        window.addEventListener("beforeunload", warnBeforeUnload);
        return () => window.removeEventListener("beforeunload", warnBeforeUnload);
    }, [hasUnsavedChanges]);

    useEffect(() => {
        const syncZoom = event => setZoomPreferences(event.detail);
        window.addEventListener(APP_ZOOM_EVENT, syncZoom);
        return () => window.removeEventListener(APP_ZOOM_EVENT, syncZoom);
    }, []);

    const updateZoom = (zoom) => {
        const result = saveAppZoom({ ...DEFAULT_APP_ZOOM, zoom });
        setZoomPreferences(result.preferences);
        setZoomError(!result.supported || !result.saved);
        setZoomMessage(!result.supported
            ? "This browser does not support website zoom. You can still use your browser’s own zoom controls."
            : result.saved ? "Website zoom applied and saved in this browser."
            : "Zoom applied for this visit, but could not be saved. Check your browser storage.");
    };

    useEffect(() => {
        const syncComfort = event => setComfort(event.detail);
        window.addEventListener(EYE_COMFORT_EVENT, syncComfort);
        return () => window.removeEventListener(EYE_COMFORT_EVENT, syncComfort);
    }, []);

    const updateComfort = (next) => {
        const result = saveEyeComfort(next);
        setComfort(result.preferences);
        setComfortError(!result.saved);
        setComfortMessage(result.saved
            ? "Applied across the website and saved in this browser."
            : "Applied for this visit, but could not be saved. Check your browser storage.");
    };

    // Apply the saved theme on mount and whenever the selected theme changes.
    useEffect(() => {
        applyTheme(settings.theme);
    }, [settings.theme]);

    // Theme is a device preference; never save other sections with it.
    const updateSetting = (key, value) => {
        setSettings((previous) => ({ ...previous, [key]: value }));
        setSavedMessage("");
        setSaveError(false);
        if (key === "theme") {
            const theme = applyTheme(value);
            try {
                const result = persistPreferences({ theme });
                setSavedSettings(previous => ({ ...previous, theme }));
                setStorageNotice("");
                setSavedMessage(result.recovered ? "Preference storage repaired. Theme applied and saved in this browser." : "Theme applied and saved in this browser.");
            } catch (error) {
                setSaveError(true);
                setSavedMessage("Theme applied for this visit, but could not be saved. Check your browser storage.");
            }
        }
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
        setSaveError(false);
        try {
            const keys = SECTION_KEYS[activeTab];
            if (!keys) return;
            const result = persistPreferences(Object.fromEntries(keys.map(key => [key, settings[key]])));
            const savedValues = Object.fromEntries(keys.map(key => [key, result.preferences[key]]));
            setSettings(previous => ({ ...previous, ...savedValues }));
            setSavedSettings(previous => ({ ...previous, ...savedValues }));
            setStorageNotice("");
            setSavedMessage(`${result.recovered ? "Preference storage repaired. " : ""}Section saved in this browser. These recorded preferences do not activate application features.`);
        } catch {
            setSaveError(true);
            setSavedMessage("Could not save preferences. Your changes remain unsaved; check browser storage and try again.");
        }
    };

    const resetSettings = () => {
        if (!window.confirm("Reset browser preference sections and theme to their defaults? Eye comfort, website zoom, and account data will not change.")) return;
        const defaults = normalizeSettings({});
        setSaveError(false);
        try {
            const keys = [...new Set(Object.values(SECTION_KEYS).flat())];
            persistPreferences(Object.fromEntries(keys.map(key => [key, defaults[key]])));
            setSettings(defaults);
            setSavedSettings(defaults);
            setStorageNotice("");
            applyTheme(defaults.theme);
            setSavedMessage("Browser preference sections and theme reset and saved. Eye comfort, website zoom, and account data are unchanged.");
        } catch {
            setSaveError(true);
            setSavedMessage("Could not save the reset. Your current controls and stored preferences have not been reset.");
        }
    };

    const currentTab = NAV_ITEMS.find((item) => item.id === activeTab);
    const displayName = typeof user?.name === "string" && user.name.trim()
        ? user.name.trim() : "Name unavailable";
    const displayEmail = typeof user?.email === "string" && user.email.trim()
        ? user.email.trim() : "Email unavailable";
    const displayInitial = displayName.charAt(0).toUpperCase();

    return (
        <div className={`settings-page theme-${settings.theme}`}>
            <header className="settings-page-header">
                <div>
                    <p className="settings-eyebrow">YOUR WORKSPACE</p>
                    <h1>Settings</h1>
                    <p className="settings-header-description">
                        Manage your workspace appearance and browser-local preferences.
                    </p>
                </div>

                <div className="settings-storage-badge">
                    <SettingsIcon name="account" />
                    <span>Preferences stored in this browser</span>
                </div>
            </header>

            <div className="settings-layout">
                <nav className="settings-menu" aria-label="Settings sections">
                    <div className="settings-menu-heading">
                        <span className="settings-menu-icon"><SettingsIcon name="account" /></span>
                        <div>
                            <strong>Preferences</strong>
                            <p>Make yourself at home</p>
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
                                        aria-pressed={activeTab === item.id}
                                        className={`settings-nav-item ${
                                            activeTab === item.id ? "active" : ""
                                        }`}
                                        onClick={() => {
                                            setActiveTab(item.id);
                                            setSavedMessage("");
                                            setSaveError(false);
                                        }}
                                    >
                                        <span className="settings-nav-icon">
                                            <SettingsIcon name={item.id} />
                                        </span>
                                        <span>{item.label}{sectionIsDirty(settings, savedSettings, item.id) && item.id !== "appearance" && <small className="settings-unsaved-dot" aria-label="Unsaved changes"> •</small>}</span>
                                        {activeTab === item.id && (
                                            <span className="settings-nav-indicator" />
                                        )}
                                    </button>
                                )
                            )}
                        </div>
                    ))}

                    <div className="settings-menu-note">
                        <strong>Local to this browser</strong>
                        <p>
                            Preferences are shared by accounts on this device.
                            They do not sync across devices.
                        </p>
                    </div>
                </nav>

                <div className="settings-main">
                    <div className="settings-section-heading">
                        <div>
                            <h2>{currentTab?.label}</h2>
                            <p>
                                {SECTION_DESCRIPTIONS[activeTab]}
                            </p>
                        </div>
                    </div>

                    {storageNotice && <div className="settings-storage-notice" role="status">{storageNotice}</div>}
                    {activeTab !== "profile" && <div className="settings-behavior-bar">
                        <span className={currentSectionDirty && activeTab !== "appearance" ? "is-dirty" : ""}>{activeTab === "appearance" ? "Applies immediately · Browser-local" : currentSectionDirty ? "Unsaved changes" : "Browser-local preferences"}</span>
                        <p>{activeTab === "appearance" ? "Theme, eye comfort, and website zoom have independent resets." : "Recorded for future use · Shared by accounts in this browser"}</p>
                    </div>}
                    {savedMessage && (
                        <div className={`settings-feedback${saveError ? " is-error" : ""}`} role={saveError ? "alert" : "status"}>
                            <span aria-hidden="true">{saveError ? "!" : "✓"}</span>
                            {savedMessage}
                        </div>
                    )}

                    {activeTab === "profile" && (
                        <section className="settings-card">
                            <div className="settings-card-heading">
                                <div><h3>Account identity</h3><p>From your signed-in account. These details cannot be edited here.</p></div>
                            </div>
                            <div className="settings-profile-preview">
                                <div className="settings-large-avatar">{displayInitial}</div>
                                <div><strong>{displayName}</strong><p>{displayEmail}</p></div>
                            </div>
                            <div className="settings-info-note">
                                <p>Browser-local names and emails are not used as account identity. Existing local values are retained without updating your account.</p>
                            </div>
                            <div className="settings-card-footer">
                                <p>Manage your biography, education, experience, and professional links on Profile.</p>
                                <Link to="/profile" className="settings-primary-button">Open Profile</Link>
                            </div>
                        </section>
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
                                <span><SettingsIcon name="appearance" /></span>
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
                                    Theme changes apply immediately. Save status is shown above.
                                </p>
                            </div>

                            <div className="settings-card-footer">
                                <p>Choose the theme you prefer.</p>
                                <span className="settings-applied-label">Applied immediately</span>
                            </div>

                            <div className="settings-card-divider" />
                            <section className="settings-comfort" aria-labelledby="settings-comfort-title">
                                <div className="settings-subheading">
                                    <h3 id="settings-comfort-title">Brightness &amp; Eye Comfort</h3>
                                    <p>Adjust page colors across the website. These controls do not change your monitor’s physical brightness.</p>
                                </div>
                                <div className="settings-comfort-slider-heading">
                                    <label htmlFor="settings-visual-intensity">Visual intensity</label>
                                    <output htmlFor="settings-visual-intensity">{comfort.intensity}%</output>
                                </div>
                                <input id="settings-visual-intensity" className="settings-comfort-range" type="range" min="80" max="120" step="1"
                                    value={comfort.intensity} aria-describedby="settings-intensity-hint"
                                    aria-valuetext={`${comfort.intensity} percent visual intensity`}
                                    onChange={event => updateComfort({ ...comfort, intensity: Number(event.target.value) })} />
                                <div className="settings-comfort-scale" aria-hidden="true"><span>Gentler</span><span>Default · 100%</span><span>Brighter surfaces</span></div>
                                <p id="settings-intensity-hint" className="settings-field-hint">Changes surface colors while keeping text sharp. Use arrow keys for small adjustments or Home / End for the limits.</p>
                                <fieldset className="settings-comfort-options">
                                    <legend>Text contrast</legend>
                                    {[
                                        ["standard", "Standard", "Balanced text and surfaces."],
                                        ["high", "High contrast", "Stronger text and clearer borders."],
                                        ["soft", "Soft contrast", "Gentler surfaces with readable text."],
                                    ].map(([value, label, hint]) => (
                                        <label key={value} className="settings-comfort-option">
                                            <input type="radio" name="settings-comfort-contrast" value={value} checked={comfort.contrast === value}
                                                onChange={() => updateComfort({ ...comfort, contrast: value })} />
                                            <span><strong>{label}</strong><small>{hint}</small></span>
                                        </label>
                                    ))}
                                </fieldset>
                                <Toggle label="Reduce decorative intensity" description="Remove decorative shadows and surface gradients. Text, images, and focus indicators stay clear."
                                    checked={comfort.reducedEffects} onChange={value => updateComfort({ ...comfort, reducedEffects: value })} />
                                <div className="settings-card-footer">
                                    <p>Applied immediately. Shared by accounts in this browser; no server sync.</p>
                                    <button type="button" className="settings-primary-button" onClick={() => updateComfort({ ...DEFAULT_EYE_COMFORT })}>Reset eye comfort</button>
                                </div>
                                {comfortMessage && <p className={`settings-feedback${comfortError ? " is-error" : ""}`} role={comfortError ? "alert" : "status"}>{comfortMessage}</p>}
                            </section>

                            <div className="settings-card-divider" />
                            <section className="settings-zoom" aria-labelledby="settings-zoom-title">
                                <div className="settings-subheading">
                                    <h3 id="settings-zoom-title">Zoom &amp; Text Size</h3>
                                    <p>Resize text and controls together across the website. Your browser and operating system settings stay unchanged.</p>
                                </div>
                                <div className="settings-comfort-slider-heading">
                                    <label htmlFor="settings-website-zoom">Website zoom</label>
                                    <output htmlFor="settings-website-zoom">{zoomPreferences.zoom}%</output>
                                </div>
                                <input id="settings-website-zoom" className="settings-comfort-range" type="range" min="80" max="150" step="5"
                                    value={zoomPreferences.zoom} aria-describedby="settings-zoom-hint" aria-valuetext={`${zoomPreferences.zoom} percent website zoom`}
                                    onChange={event => updateZoom(Number(event.target.value))} />
                                <div className="settings-comfort-scale" aria-hidden="true"><span>80% · Smaller</span><span>150% · Larger</span></div>
                                <p id="settings-zoom-hint" className="settings-field-hint">Default: 100%. Use arrow keys to adjust in 5% steps. This scales the whole interface, including text.</p>
                                <div className="settings-zoom-presets" role="group" aria-label="Quick website zoom choices">
                                    {[100, 125, 150].map(value => <button key={value} type="button" aria-pressed={zoomPreferences.zoom === value} onClick={() => updateZoom(value)}>{value}%</button>)}
                                </div>
                                <div className="settings-card-footer">
                                    <p>Applied immediately and shared by accounts in this browser. Theme and eye comfort are kept separately.</p>
                                    <button type="button" className="settings-primary-button" onClick={() => updateZoom(DEFAULT_APP_ZOOM.zoom)}>Reset to default (100%)</button>
                                </div>
                                {zoomMessage && <p className={`settings-feedback${zoomError ? " is-error" : ""}`} role={zoomError ? "alert" : "status"}>{zoomMessage}</p>}
                            </section>
                        </section>
                    )}

                    {activeTab === "notifications" && (
                        <section className="settings-card">
                            <div className="settings-card-heading">
                                <div>
                                    <h3>Notification preferences</h3>
                                    <p>
                                        Record preferences for future updates. These switches do not control current notifications.
                                    </p>
                                </div>
                                <span><SettingsIcon name="notifications" /></span>
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


                            <div className="settings-card-footer">
                                <p>Your notification choices can be changed anytime.</p>
                                <button
                                    type="button"
                                    className="settings-primary-button"
                                    onClick={saveSettings}
                                    disabled={!currentSectionDirty && !storageNotice}
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
                                        Record browser-local goals for future use. The AI assistant does not currently use these preferences.
                                    </p>
                                </div>
                                <span><SettingsIcon name="ai" /></span>
                            </div>

                            <SettingsField
                                label="Target career"
                                hint="A browser-local goal; this does not select or change your Roadmap."
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
                                hint="Recorded locally; this does not change recommended task difficulty."
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
                                hint="A local target only; this does not schedule learning sessions."
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


                            <div className="settings-card-footer">
                                <p>Save your choices to keep your preferences.</p>
                                <button
                                    type="button"
                                    className="settings-primary-button"
                                    onClick={saveSettings}
                                    disabled={!currentSectionDirty && !storageNotice}
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
                                <span><SettingsIcon name="security" /></span>
                            </div>

                            <div className="settings-subheading">
                                <h4>Password and authentication</h4>
                                <p>Use email verification to reset your account password securely.</p>
                            </div>
                            <div className="settings-card-footer">
                                <p>You will need access to the email address you use to sign in.</p>
                                <Link to="/forgot-password" className="settings-primary-button">
                                    Reset password
                                </Link>
                            </div>

                            <div className="settings-card-divider" />

                            <div className="settings-subheading">
                                <h4>Privacy preferences</h4>
                                <p>
                                    Record choices for future analytics and personalization support.
                                </p>
                            </div>

                            <div className="settings-toggle-list">
                                <Toggle
                                    label="Personalized experience"
                                    description="Stored locally for future use; this does not currently personalize your dashboard."
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
                                <p>Stored in this browser only. These switches do not currently change data collection or personalization.</p>
                                <button
                                    type="button"
                                    className="settings-primary-button"
                                    onClick={saveSettings}
                                    disabled={!currentSectionDirty && !storageNotice}
                                >
                                    Save privacy preferences
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
                                        Record local language and timezone preferences.
                                    </p>
                                </div>
                                <span><SettingsIcon name="account" /></span>
                            </div>


                            <div className="settings-subheading">
                                <h4>Application preferences</h4>
                                <p>
                                    Record language and timezone preferences for future use; the application does not currently apply them.
                                </p>
                            </div>

                            <SettingsField
                                label="Language"
                                hint="Saved locally only; does not translate the application."
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
                                hint="Saved locally only; does not change displayed dates or schedules."
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
                                    Restore browser preference sections and theme to their defaults.
                                </p>
                            </div>

                            <div className="settings-danger-zone">
                                <div>
                                    <h4>Reset browser preferences</h4>
                                    <p>
                                        This resets the preference controls on this device. Legacy local identity values are retained; account data is unchanged. Eye comfort and website zoom each have their own reset in Appearance.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="settings-danger-button"
                                    onClick={resetSettings}
                                >
                                    Reset browser preferences
                                </button>
                            </div>

                            <div className="settings-card-footer">
                                <p>Save your application preferences.</p>
                                <button
                                    type="button"
                                    className="settings-primary-button"
                                    onClick={saveSettings}
                                    disabled={!currentSectionDirty && !storageNotice}
                                >
                                    Save account preferences
                                </button>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function SettingsDesktopCanvas() {
    return (
        <div className="settings-desktop-scroll" role="region" aria-label="Settings page. Scroll horizontally to view all content on narrow screens." tabIndex={0}>
            <div className="settings-desktop-canvas">
                <Settings />
            </div>
        </div>
    );
}
