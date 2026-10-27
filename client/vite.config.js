import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig(({ command, mode }) => {
    if (command === "build") {
        const env = loadEnv(mode, fileURLToPath(new URL(".", import.meta.url)), "VITE_");
        let api;
        try { api = new URL(env.VITE_API_URL); }
        catch { throw new Error("Set VITE_API_URL to an explicit API URL before building"); }
        const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(api.hostname);
        if (api.username || api.password || api.search || api.hash || !api.pathname.endsWith("/api") || (api.protocol !== "https:" && !(api.protocol === "http:" && loopback))) {
            throw new Error("VITE_API_URL must end in /api and use HTTPS (HTTP loopback is allowed for local previews only)");
        }
    }
    return { plugins: [react()] };
});
