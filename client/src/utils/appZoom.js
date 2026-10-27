export const APP_ZOOM_KEY = "ai-career-os:display-scale:v1";
export const APP_ZOOM_EVENT = "ai-career-os:display-scale-change";
export const DEFAULT_APP_ZOOM = Object.freeze({ version: 1, zoom: 100 });

export function normalizeAppZoom(value) {
    if (!value || typeof value !== "object" || Array.isArray(value) || value.version !== 1) return { ...DEFAULT_APP_ZOOM };
    return { version: 1, zoom: typeof value.zoom === "number" && Number.isFinite(value.zoom)
        ? Math.round(Math.max(80, Math.min(150, value.zoom)) / 5) * 5 : 100 };
}
export function readAppZoom(storage) {
    try { return normalizeAppZoom(JSON.parse((storage || globalThis.localStorage).getItem(APP_ZOOM_KEY))); }
    catch { return { ...DEFAULT_APP_ZOOM }; }
}
let current;
let cleanup;
export const getAppZoom = () => ({ ...(current || readAppZoom()) });

// CSS zoom changes layout dimensions, but not media-query viewport dimensions.
// Adjust existing breakpoints in place so their original order/specificity and
// page-specific responsive designs remain intact. Never scale a rewritten rule.
const originalMediaQueries = new WeakMap();
export function scaleZoomMediaQuery(query, scale) {
    const length = (_match, prefix, number, unit) => `${prefix}${Number((Number(number) * scale).toFixed(4))}${unit}`;
    return query
        .replace(/(\b(?:min-|max-)?(?:width|height)\s*:\s*)(\d+(?:\.\d+)?)(px|em|rem)\b/gi, length)
        .replace(/(\b(?:width|height)\s*(?:[<>]=?|=)\s*)(\d+(?:\.\d+)?)(px|em|rem)\b/gi, length)
        .replace(/(\d+(?:\.\d+)?)(px|em|rem)(\s*(?:[<>]=?|=)\s*(?:width|height)\b)/gi,
            (_match, number, unit, suffix) => `${Number((Number(number) * scale).toFixed(4))}${unit}${suffix}`);
}
export function synchronizeZoomMedia(doc, scale) {
    const visit = rules => {
        for (const rule of rules) {
            if (rule.media) {
                if (!originalMediaQueries.has(rule)) originalMediaQueries.set(rule, rule.media.mediaText);
                const original = originalMediaQueries.get(rule);
                const next = scale === 1 ? original : scaleZoomMediaQuery(original, scale);
                if (rule.media.mediaText !== next) rule.media.mediaText = next;
            }
            if (rule.cssRules) visit(rule.cssRules);
        }
    };
    for (const sheet of doc?.styleSheets || []) {
        // Cross-origin stylesheets cannot be inspected; never bypass that boundary.
        try { visit(sheet.cssRules || []); } catch (error) { if (error.name !== "SecurityError") throw error; }
    }
}

export function applyAppZoom(value, doc = globalThis.document, win = globalThis.window) {
    const preferences = normalizeAppZoom(value);
    const root = doc?.documentElement;
    if (!root) return { preferences, supported: false };
    const supported = !win?.CSS?.supports || win.CSS.supports("zoom", "1.25");
    // Landing and login keep their original composition; saved zoom still
    // applies to the workspace. Browser zoom is untouched.
    const originalScale = ["/", "/login"].includes(win?.location?.pathname);
    const active = supported && !originalScale && preferences.zoom !== 100;
    const scale = active ? preferences.zoom / 100 : 1;
    synchronizeZoomMedia(doc, scale);
    root.dataset.appZoom = active ? "on" : "off";
    root.dataset.appZoomCompact = active && (win?.innerWidth || 1280) / scale <= 768 ? "true" : "false";
    // Legacy attribute is retained for compatibility; media rules now own reflow.
    root.dataset.appZoomReflow = "false";
    if (active) {
        root.style.setProperty("zoom", String(scale));
        root.style.setProperty("--app-zoom-scale", String(scale));
    } else {
        root.style.removeProperty("zoom");
        root.style.removeProperty("--app-zoom-scale");
    }
    return { preferences, supported };
}
export function saveAppZoom(value, storage, doc = globalThis.document, win = globalThis.window) {
    const result = applyAppZoom(value, doc, win);
    current = result.preferences;
    let saved = true;
    try { (storage || globalThis.localStorage).setItem(APP_ZOOM_KEY, JSON.stringify(current)); }
    catch { saved = false; }
    if (win?.dispatchEvent) win.dispatchEvent(new win.CustomEvent(APP_ZOOM_EVENT, { detail: { ...current } }));
    return { ...result, saved };
}
export function initializeAppZoom(win = globalThis.window, doc = globalThis.document) {
    if (cleanup) return cleanup;
    current = readAppZoom();
    applyAppZoom(current, doc, win);
    if (!win || !doc) return () => {};
    const onResize = () => applyAppZoom(current, doc, win);
    const onStyleLoad = event => { if (event.target?.tagName === "LINK") onResize(); };
    const observer = win.MutationObserver && doc.head ? new win.MutationObserver(onResize) : null;
    observer?.observe(doc.head, { childList: true, subtree: true, characterData: true });
    const onStorage = event => {
        if (event.key !== APP_ZOOM_KEY && event.key !== null) return;
        if (event.storageArea && event.storageArea !== win.localStorage) return;
        current = readAppZoom();
        applyAppZoom(current, doc, win);
        win.dispatchEvent(new win.CustomEvent(APP_ZOOM_EVENT, { detail: { ...current } }));
    };
    win.addEventListener("resize", onResize);
    win.addEventListener("storage", onStorage);
    win.addEventListener("load", onStyleLoad, true);
    cleanup = () => {
        win.removeEventListener("resize", onResize);
        win.removeEventListener("storage", onStorage);
        win.removeEventListener("load", onStyleLoad, true);
        observer?.disconnect();
        cleanup = undefined;
    };
    return cleanup;
}
