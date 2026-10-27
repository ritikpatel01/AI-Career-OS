// Build with Vite's existing config and record the emitted chunk graph without extra dependencies.
import { build } from "vite";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const root = fileURLToPath(new URL("../", import.meta.url));
const destination = process.argv[2];
if (!destination) throw new Error("Usage: node client/scripts/analyzeBundle.mjs /tmp/bundle.json");

await build({
    root,
    plugins: [{
        name: "record-emitted-bundle",
        writeBundle(options, bundle) {
            const assets = Object.values(bundle).map(asset => {
                const contents = readFileSync(resolve(options.dir, asset.fileName));
                return {
                    file: asset.fileName,
                    bytes: contents.length,
                    gzipBytes: gzipSync(contents).length,
                    ...(asset.type === "chunk" ? {
                        entry: asset.isEntry,
                        imports: asset.imports,
                        dynamicImports: asset.dynamicImports,
                        modules: Object.entries(asset.modules).map(([id, module]) => ({
                            id: relative(root, id),
                            renderedBytes: module.renderedLength,
                        })),
                    } : {}),
                };
            });
            writeFileSync(destination, JSON.stringify(assets, null, 2) + "\n");
        },
    }],
});
