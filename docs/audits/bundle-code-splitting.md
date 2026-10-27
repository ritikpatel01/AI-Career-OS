# Production bundle analysis and safe route splitting

Date: 2026-10-24. Continued the existing UI/UX working tree and reviewed `ui-ux-polish.md` before editing. This pass changes route loading, not page functionality or catalog data.

## Baseline and evidence

Ran the existing `npm run build` in client before edits: 444 modules, one JavaScript chunk. Vite reported:

| Asset | Before, kB | After, kB | Before gzip, kB | After gzip, kB |
|---|---:|---:|---:|---:|
| Entry JavaScript | 3,303.37 | 287.72 | 1,041.06 | 89.47 |
| Eager CSS | 533.03 | 533.26 | 81.49 | 81.53 |

Entry JavaScript is **91.29% smaller**, with **91.41% less reported gzip**. These are build-output byte comparisons, not measured latency or Web Vitals claims. CSS was deliberately retained and grew slightly for the new loading/error state.

Before splitting, App statically imported every route. Module/chunk analysis showed Roadmap pulling the complete lesson/practice catalogs into the entry bundle, Documents importing react-markdown/remark-gfm and their parser dependencies, Activities importing Axios, and large Interview/Resume page implementations also loading initially. ReactDOM and React Router are necessary shared application code; moving them to a manually named vendor chunk would not remove their initial download.

## Changes and reasons

- `client/src/App.jsx`: use React.lazy for the 23 non-landing pages, including auth and admin routes, with literal dynamic imports. Landing remains eager. Route paths, nesting, ProtectedRoute, auth provider and page props are unchanged. Wrap public route rendering in the shared loading/error boundary.
- `client/src/components/common/Layout.jsx`: wrap only Outlet content in the same boundary so a delayed or failed protected page does not remove the sidebar, navigation, or main shell. Notification/outlet context and mobile controls remain intact.
- `client/src/components/common/RouteContent.jsx`: accessible Suspense status and scoped error boundary with explicit reload recovery. Navigation to another pathname resets an error without keying/remounting the healthy shared layout. Existing page-level loading and error handling remains in place.
- `client/src/styles/routeContent.css`: small scoped status/error styling using the existing tokens, without changing existing page styles.
- `client/src/styles/routeStyles.js`: preserve the established eager stylesheet order from the baseline module graph. Existing global/page CSS overlaps make navigation-dependent CSS loading risky; splitting CSS was deliberately avoided. Original page CSS imports remain and Vite deduplicates them.
- `client/scripts/analyzeBundle.mjs`: use Vite's current configuration and Node built-ins to record actual emitted assets, static/dynamic imports and module membership. No analysis package or config threshold change is needed.
- `client/scripts/auditUiPolish.mjs`: add optional production-preview mode and wait for route loading to settle; default development audit remains available.
- `client/scripts/auditRouteChunks.mjs`: compiled-route browser regression audit for cold landing, direct navigation/refresh, unauthenticated redirects, delayed chunks, failed chunks, navigation recovery and reload recovery.
- `docs/audits/bundle-code-splitting.md`, `bundle-analysis.json`, `bundle-route-browser.json`, `bundle-ui-browser.json`, `bundle-auth-browser.json`: measured results and explicit verification scope.

No new dependency, manual vendor split, chunk-size warning suppression, Vite config change, exercise/catalog modification, completion-key change, API contract change, auth/recovery/Settings behavior edit, env-file change, schema migration, or production user data modification was made.

## Final emitted graph

Fresh ordinary production build: **447 modules, 26 JavaScript chunks**. Largest JavaScript chunks (Vite output):

| Chunk | kB | gzip kB | Loaded when |
|---|---:|---:|---|
| Roadmap | 2,465.97 | 809.05 | Roadmap opened |
| Entry | 287.72 | 89.47 | Application entry |
| Documents | 180.39 | 52.46 | Documents opened |
| Activities | 64.72 | 22.58 | Activities opened |
| Interview | 63.58 | 15.55 | Interview opened |
| Resume | 35.95 | 9.07 | Resume opened |

All careerRoadmaps modules belong to the Roadmap chunk; react-markdown/remark-gfm belong to Documents; Axios belongs to Activities. None of these modules remain in the entry chunk. Shared React/router/API/context code is reused rather than duplicated. The emitted module inventory contains **zero duplicate module IDs across chunks** and the static chunk-import graph contains **no cycles**. Dynamic route chunks naturally reference shared entry exports; that is not a static import cycle.

Total emitted JavaScript is about **3,306.58 kB**, versus 3,303.37 kB before. This optimization defers code; it does not remove the catalog or claim to reduce the total download after visiting every page. The small total increase is loading/error handling and chunk/import overhead. Two tiny service chunks are automatically shared by Vite; no small component was manually split.

The **>500 kB warning remains for Roadmap**. Its full catalog is still loaded when Roadmap opens. Per-career/phase data loading would need a separately scoped change and persistence/catalog validation; this pass did not disguise that cost by slicing the same eager data into arbitrarily named files.

## Tests and browser verification

- `node --test --test-isolation=none --test-reporter=spec client/src/data/careerRoadmaps/*.test.js`: **95 tests, 93 passed, 0 failed, 2 skipped**. The skips are existing missing PyTorch/TensorFlow runtime dependencies (10 and 9 reference solutions respectively), not lazy-loading failures. Coverage, IDs, keys, aliases, associations, filters, rendering safeguards and available executable solutions passed.
- `npm run build` in client: **passed**, with the measured chunk sizes above and only the remaining large-Roadmap warning.
- `node client/scripts/analyzeBundle.mjs /tmp/bundle.json`: passed; writes actual emitted graph without modifying Vite configuration. JSON gzipBytes use Node zlib; the table uses Vite's displayed compressor figures, which can differ slightly.
- Production browser fixture build used `VITE_API_URL=http://localhost:5000/api` and a separate `/tmp/ai-career-bundle-preview` output directory. It uses the same source/configuration as the normal build; only API origin/output location differ. No env files were changed.
- Existing UI browser audit passed against compiled assets at **1440, 768 and 390px**. All 16 standard sidebar routes, Settings behavior/labels/theme/storage error recovery, Notes/Resources/Practice, navigation and mobile keyboard checks passed. No unexpected console/Vite errors or uncaught exceptions. One intentional quota error is explicitly expected.
- Dedicated compiled-route audit passed **all 24 routes** (landing, auth, 16 standard protected routes, 3 admin routes), direct URL loads and refreshes. Auth state/admin role and API responses in this broad sweep are isolated fixtures, not proof of real admin authorization. Missing-token navigation redirected to login.
- Cold landing requested only the entry JS; Roadmap/Documents/Activities/Settings chunks were not requested. A held Skills chunk kept the existing sidebar node intact. React Router may keep the prior page visible during a transition; a fresh direct Skills load displayed the Suspense status inside the existing shell until the chunk was released.
- Intentionally failing the real Documents chunk request produced the recoverable error panel while keeping navigation visible. Navigating to Dashboard worked; returning and using Reload fetched the chunk successfully. Exactly one intentional failed chunk and its expected React/error-boundary logs were recorded. **No unexpected chunk HTTP errors or runtime exceptions** remained.

Initial failed harness checks were investigated: React Router transitions can retain the old page instead of showing the fallback, so both transition continuity and direct-load Suspense were tested separately. The real persistence harness also originally imported a development `/src/...` URL; it now reads the known exercise ID in Node rather than requesting nonexistent source modules from a production server. Neither issue required changing application behavior to satisfy a test.

### Real authenticated persistence, distinct from fixture tests

Using compiled assets on port 5174, the normal login form, the existing two dedicated audit accounts, the current local API and its configured MongoDB: real completion PUTs returned 200, refresh and route navigation retained completion, sign-out/sign-in restored progress, sequential repeated updates retained one record with unique keys, foreign reads/writes returned 404, unauthenticated writes returned 401, and a real validator 400 rolled back the optimistic save. Browser exception collection was empty. Test data was restricted to those dedicated accounts; no credentials or user identifiers are included in the committed report.

## Reproduce and remaining staging checks

Ordinary build: `npm --prefix client run build`.

Graph capture: `node client/scripts/analyzeBundle.mjs /tmp/bundle.json`.

For browser fixtures, build from client with `VITE_API_URL=http://localhost:5000/api npm run build -- --outDir /tmp/ai-career-bundle-preview --emptyOutDir`, then from repository root run:

- `UI_AUDIT_PREVIEW_DIR=/tmp/ai-career-bundle-preview node client/scripts/auditRouteChunks.mjs`
- `UI_AUDIT_PREVIEW_DIR=/tmp/ai-career-bundle-preview node client/scripts/auditUiPolish.mjs`

These scripts need Node's built-in WebSocket, installed frontend dependencies, `/usr/bin/google-chrome` and free port 5197. They run sequentially and intercept API requests, never send recovery email or change real passwords. API fixtures cover fetch and Axios/XHR.

Still requires staging: deployed-host deep-link rewrite rules, asset base/CDN configuration, atomic releases and old hashed-asset retention/cache headers, rolling-deployment stale-chunk recovery, real network latency/Web Vitals, email delivery, external integrations, Safari/Firefox, and actual administrator authorization. Local preview provides SPA fallback, so it cannot certify a reverse proxy. No deployment was performed. Existing multi-tab persistence limitations and placeholder root/server test commands remain as recorded in earlier audits.

The workspace is not recognized as a Git repository; current source/test/build evidence was used rather than claiming a verified Git baseline. Existing working-tree work was preserved.
