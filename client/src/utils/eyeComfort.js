export const EYE_COMFORT_KEY = "ai-career-os:eye-comfort:v1";
export const EYE_COMFORT_EVENT = "ai-career-os:eye-comfort-change";
export const DEFAULT_EYE_COMFORT = Object.freeze({ version: 1, intensity: 100, contrast: "standard", reducedEffects: false });

export function normalizeEyeComfort(value) {
    if (!value || typeof value !== "object" || Array.isArray(value) || value.version !== 1) return { ...DEFAULT_EYE_COMFORT };
    return {
        version: 1,
        intensity: typeof value.intensity === "number" && Number.isFinite(value.intensity)
            ? Math.round(Math.max(80, Math.min(120, value.intensity))) : 100,
        contrast: ["standard", "high", "soft"].includes(value.contrast) ? value.contrast : "standard",
        reducedEffects: value.reducedEffects === true,
    };
}

export function readEyeComfort(storage) {
    try { return normalizeEyeComfort(JSON.parse((storage || globalThis.localStorage).getItem(EYE_COMFORT_KEY))); }
    catch { return { ...DEFAULT_EYE_COMFORT }; }
}

const mix = (hex, target, amount) => "#" + [0, 2, 4].map(offset => {
    const a = parseInt(hex.slice(offset, offset + 2), 16);
    const b = parseInt(target.slice(offset, offset + 2), 16);
    return Math.round(a + (b - a) * amount).toString(16).padStart(2, "0");
}).join("");

// Bound surface changes instead of dimming text, images, or the whole document.
export function eyeComfortTokens(preferences, theme = "dark") {
    const p = normalizeEyeComfort(preferences);
    const dark = theme !== "light";
    const high = p.contrast === "high";
    const soft = p.contrast === "soft";
    const shift = (p.intensity - 100) / 20;
    const target = dark ? (shift < 0 ? "000000" : "34465f") : (shift < 0 ? "d2d9e3" : "ffffff");
    const surface = hex => mix(hex, target, Math.abs(shift) * 0.55);
    const background = surface(dark ? (high ? "000000" : soft ? "121b29" : "0b1120") : (soft ? "e9edf2" : "f5f7fc"));
    const card = surface(dark ? (high ? "090f18" : soft ? "1b2636" : "121d30") : (soft ? "f1f3f6" : "ffffff"));
    const muted = surface(dark ? "19273c" : "edf2fa");
    const text = dark ? (soft ? "dce4f0" : high ? "ffffff" : "f1f5ff") : (high ? "080e18" : "172033");
    const secondary = dark ? (high ? "e5edfa" : "c0cce0") : (high ? "243247" : "44536a");
    const border = dark ? (high ? "a6bad5" : "50627e") : (high ? "52627a" : "8392a8");
    const primary = dark ? "a3c1ff" : "244bc0";
    const tokens = {
        "--app-bg": background, "--surface": card, "--surface-raised": card,
        "--surface-muted": muted, "--surface-hover": surface(dark ? "22334d" : "e4ebf7"),
        "--text-primary": text, "--text-secondary": secondary, "--text-muted": secondary,
        "--border-color": border, "--input-border": border, "--input-bg": card,
        "--primary-color": primary, "--primary-hover": dark ? "c6d9ff" : "173998",
        "--primary-soft": muted, "--text-on-primary": dark ? "#0b1120" : "#ffffff",
        "--focus-color": dark ? "#c6d9ff" : "#173998",
        "--sidebar-bg": background, "--sidebar-text": text, "--sidebar-muted": secondary,
        "--sidebar-hover": muted, "--sidebar-active": dark ? "#3151a8" : "#244bc0", "--sidebar-active-text": "#ffffff",
        "--table-header-bg": muted, "--table-row-hover": muted,
        "--comfort-button-bg": dark ? "#3151a8" : "#244bc0", "--comfort-button-text": "#ffffff",
    };
    return Object.fromEntries(Object.entries(tokens).map(([key, value]) => [key, /^[a-f0-9]{6}$/i.test(value) ? `#${value}` : value]));
}

let current;
let stopListening;
export const getEyeComfort = () => ({ ...(current || readEyeComfort()) });

export function applyEyeComfort(preferences, doc = globalThis.document) {
    const p = normalizeEyeComfort(preferences);
    if (!doc?.documentElement || !doc.body) return p;
    const active = p.intensity !== 100 || p.contrast !== "standard" || p.reducedEffects;
    const tokens = eyeComfortTokens(p, doc.documentElement.dataset.theme);
    for (const element of [doc.documentElement, doc.body]) {
        for (const [name, value] of Object.entries(tokens)) {
            if (active) element.style.setProperty(name, value);
            else element.style.removeProperty(name);
        }
    }
    doc.documentElement.dataset.eyeComfort = active ? "on" : "off";
    doc.documentElement.dataset.comfortContrast = p.contrast;
    doc.documentElement.dataset.comfortEffects = p.reducedEffects ? "reduced" : "standard";
    return p;
}

export function saveEyeComfort(preferences, storage, doc = globalThis.document) {
    current = applyEyeComfort(preferences, doc);
    let saved = true;
    try { (storage || globalThis.localStorage).setItem(EYE_COMFORT_KEY, JSON.stringify(current)); }
    catch { saved = false; }
    globalThis.window?.dispatchEvent(new CustomEvent(EYE_COMFORT_EVENT, { detail: { ...current } }));
    return { preferences: { ...current }, saved };
}

// Run once before React mounts. Theme changes reapply colors without changing
// the existing theme preference or writing to its legacy storage key.
export function initializeEyeComfort(win = globalThis.window, doc = globalThis.document) {
    if (stopListening) return stopListening;
    current = readEyeComfort();
    applyEyeComfort(current, doc);
    if (!win || !doc) return () => {};
    const observer = new win.MutationObserver(() => applyEyeComfort(current, doc));
    observer.observe(doc.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const onStorage = event => {
        if ((event.key === EYE_COMFORT_KEY || event.key === null) && (!event.storageArea || event.storageArea === win.localStorage)) {
            current = readEyeComfort();
            applyEyeComfort(current, doc);
            win.dispatchEvent(new CustomEvent(EYE_COMFORT_EVENT, { detail: { ...current } }));
        }
    };
    win.addEventListener("storage", onStorage);
    stopListening = () => { observer.disconnect(); win.removeEventListener("storage", onStorage); stopListening = undefined; };
    return stopListening;
}
