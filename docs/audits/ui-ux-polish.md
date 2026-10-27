# UI/UX polish and production-readiness pass

Date: 2026-10-24. Continued the existing working tree and preserved the completed Roadmap audit and catalog. This is a targeted first polish pass, not a certification that every production integration or user journey is ready.

## Architecture inspected

The frontend uses React, Vite, React Router, page-level CSS, `index.css`, and the existing shared theme tokens in `styles/theme.css`. Protected routes render `components/common/Layout.jsx`, which uses `components/layout/Sidebar.jsx` and an Outlet. The mobile drawer is controlled by Layout. Legacy Sidebar/DashboardLayout/Spinner implementations also exist; the routed shell was identified before editing, and unused implementations were not removed. Main routes include Dashboard, Profile, Projects, Resume, Roadmap, Skills, DSA, Interview, Jobs, Notifications, GitHub, Knowledge, Progress, Activities, Documents, and Settings, plus auth/admin routes.

The backend uses Express routes/controllers/services, JWT authentication, Joi validation, and Mongoose. Roadmap user ownership, completion persistence, and API contracts were left unchanged. Existing password recovery routes implement email-code verification and a reset token. Frontend scripts were dev/build/preview; root/server test commands remain placeholders. The meaningful Roadmap tests use Node's test runner directly. No new UI framework or dependency was introduced; Axios was already imported by Activities and declared at repository root.

Reviewed `roadmap-practice-audit.md` and the actual catalog/coverage tests. The 2,571 exercises, 285 topics, 34 phases, completion IDs/keys, aliases, and coverage manifest remain unchanged in this pass.

## Confirmed issues and disposition

| Severity | Confirmed issue | Disposition |
|---|---|---|
| Critical | None demonstrated in the checked flows | This is not a full security assessment |
| High | Settings used a nested main element that inherited the global 250px sidebar offset and padding, squeezing its desktop form into a narrow column; its aside also inherited global sidebar sizing | Changed only the local Settings content/menu elements to div/nav; preserved existing classes and grid design. Screenshot review confirms the corrected column alignment |
| High | Password recovery appended `/api/auth/...` to a configured base already ending in `/api` | Both recovery pages now use the existing shared API base and `/auth/...` endpoints |
| High | Settings collected current/new passwords in a validation-only form that never changed the password | Replaced that nonfunctional form with a link to the existing email-verified password recovery flow; no password-change endpoint or security shortcut was invented |
| High | Mobile drawer lacked keyboard containment and focus restoration; background controls remained interactive while the drawer was open | Move focus into the visible drawer, contain Tab/Shift+Tab, make main inert while open, and restore toggle focus on close. Preserve Escape/backdrop/route-change/desktop-resize behavior |
| High | Activities imported Axios without declaring it in the client package; the local build relied on parent node_modules | Declared the already-used Axios dependency and updated the client lockfile; verified a clean isolated client install/build |
| Medium | Eight Profile fields, Settings fields, and the Roadmap career selector lacked associated accessible labels | Connected existing Profile labels and IDs, reused SettingsField to generate stable label/control/hint associations, named the Roadmap selector |
| Medium | Visiting Settings changed a fresh default-dark session to light | Aligned Settings defaults with the existing application default, while retaining explicit saved light preferences |
| Medium | A failed Settings storage save used success styling and a checkmark | Error feedback now uses an alert, error colors and error symbol; successful saves retain status feedback |
| Medium | Repeated sidebar links had no skip-to-content shortcut | Added a keyboard-visible link targeting the existing main content |
| Low | Duplicate legacy shells and overlapping global/page styles remain | Documented; broad deletion or style rewrite was avoided |
| Low | Large production bundle warning remains | Not hidden or fixed through an unrelated refactor |

## Files changed and why

- `client/src/components/common/Layout.jsx`: mobile focus lifecycle/containment, inert background and skip link. No auth or notification behavior changed.
- `client/src/styles/navigation.css`: small keyboard-visible skip-link style using existing theme tokens.
- `client/src/pages/Settings/Settings.jsx`: correct local layout semantics, shared field labeling, theme consistency, truthful save feedback, and real password-recovery entry point.
- `client/src/pages/Settings/Settings.css`: scoped error feedback and link-button text decoration.
- `client/src/pages/Profile/Profile.jsx`: associate eight existing labels with their controls.
- `client/src/pages/Roadmap/Roadmap.jsx`: accessible name for the existing career selector only.
- `client/src/pages/Auth/ForgotPassword.jsx`, `ResetPassword.jsx`: reuse shared API base for the three existing recovery requests.
- `client/package.json`, `client/package-lock.json`: declare the already-used Axios runtime dependency so frontend-only installs work.
- `client/scripts/auditUiPolish.mjs`: repeatable isolated Chrome regression audit; mocks API responses explicitly and does not claim to test real authentication.
- `docs/audits/ui-ux-polish.md`, `ui-ux-polish-browser.json`: findings and actual browser results.

No exercise content, registration, coverage data, completion-key generation, database schemas, backend routes, production user data, env files, or backup files were changed in this pass. Existing dedicated audit progress was the only real saved data used for verification. The workspace still has no recognized Git repository, so a Git baseline diff cannot be certified; inspected file contents and test results are the evidence.

## Validation performed

### Automated tests and builds

- `node --test --test-isolation=none --test-reporter=spec client/src/data/careerRoadmaps/*.test.js`: **95 tests: 93 passed, 0 failed, 2 skipped**. Catalog/manifest agreement, associations, required fields, unique IDs, filters, legacy aliases, completion keys, rendering safeguards, RAG regression, and available executable solutions passed.
- Skipped PyTorch/TensorFlow groups: dependencies unavailable; 10 PyTorch and 9 TensorFlow reference solutions were not runtime-executed. These existing skips are not UI failures.
- `npm run build` in client: **passed**, 444 modules.
- Clean copy of the frontend in a fresh `/tmp` directory with no parent node_modules or env files: `npm ci --ignore-scripts` and production build **both passed** using the updated client lockfile. This checks the declared frontend dependency closure; it does not test production environment values.
- Remaining build warning: main JS about 3,303 kB / 1,041 kB gzip, CSS about 533 kB / 81 kB gzip. No warning threshold was raised.

### Browser UI regression — mocked APIs

Run `node client/scripts/auditUiPolish.mjs` from the repository root. It currently requires Node with built-in WebSocket, installed frontend dependencies, Google Chrome at `/usr/bin/google-chrome`, and free local port 5197. Optional `UI_AUDIT_RESULT=/tmp/result.json` writes results; `UI_AUDIT_SCREENSHOTS=/tmp` writes screenshots. Isolated temporary Chrome profile is removed after the run. API interception covers both fetch and Axios/XHR; fixture user/token do not authenticate against the backend.

Passed:

- Dashboard, Roadmap, Settings, Profile at **1440, 768, 390px**: no viewport overflow, no unlabeled fields in the checked page states, shared main shell present, dark theme stable.
- All **16 sidebar routes** loaded directly with the shared shell. This covers Vite route loading, not reverse-proxy refresh rules on a deployed host.
- Actual browser Tab key presses remain within the open mobile navigation, initial focus enters the drawer, main becomes inert, Escape restores focus, and selecting Roadmap closes the drawer with the correct active link.
- Notes, Resources and Practice remain available and render at mobile width. The Practice workspace is present.
- All six Settings sections have labeled fields. A deliberately thrown browser-storage quota error produces error feedback; restoring storage permits a successful save. Explicit saved light theme survives revisiting Settings.
- Settings links to recovery. Mocked requests exercise forgot-password, verify-reset-code and reset-password at the correct URLs; no `/api/api/` request occurs. No real email or password reset was performed.
- **Zero uncaught runtime exceptions, zero unexpected console errors, zero unexpected Vite stderr errors**. One intentional quota-error console message (also mirrored by Vite) was expected and explicitly classified.
- Desktop Settings and mobile Settings/Roadmap screenshots were visually inspected. The initial nested-main spacing defect was found through screenshot inspection, corrected, and guarded by a browser assertion.

Earlier failing browser runs were investigated: initial drawer focus needed to wait for visibility/transition completion; recovery-form readiness and Settings section selectors needed harness corrections; Axios/XHR needed interception in addition to fetch; the deliberately injected quota error must be counted as expected rather than hidden as an unexplained failure. The final audit run passed.

### Real authentication, API and configured database

Reused the two existing dedicated audit accounts through the normal application login form. Current frontend/local backend used the configured MongoDB. No fixture token or API mock was used for successful persistence requests.

Passed real completion save (PUT 200), refresh hydration, navigate away/back, sign-out/sign-in restoration, three sequential repeated updates without duplicate records/keys, unauthenticated write rejection (401), cross-user read/write rejection (404), and cross-user list isolation. A deliberately invalid dedicated save received a real 400 and rolled back the optimistic UI state. Browser exception list was empty.

A separate read-only configured MongoDB check confirmed the dedicated owner, one progress record, one unique completed key, absence of the rejected completion, and no progress record for the second audit user. Dedicated test records/accounts were retained; existing users were untouched. This is real database-backed verification, not the mocked browser route sweep.

## Remaining limits and recommended next step

- Verify email delivery, verification expiry, reset-token behavior, and completed password change in staging with a dedicated mailbox. The browser audit checked endpoint construction and UI flow with mocked responses, not SMTP delivery.
- Settings preferences remain browser-local as before; cross-device synchronization and consumption of notification/language/privacy preferences are not certified here. Existing backend Profile behavior was preserved; no real Profile edit was made.
- Test deployed-host SPA refresh rules, allowed frontend origin/CORS configuration, environment/secrets configuration, and external integrations before release. The backend currently has an explicit local/LAN origin allowlist; this pass did not authorize a deployment or weaken it.
- Rich populated/error states across every feature, full accessibility/contrast conformance, screen readers, Safari/Firefox, every external resource URL and provider integration are not exhaustively verified by a Chrome empty-data sweep.
- Simultaneous multi-tab first saves and snapshot update conflicts remain untested, as recorded in the Roadmap final audit.
- Root/server npm test commands remain placeholders. The browser audit and Roadmap tests are explicit commands, not a claim that a full backend CI suite exists.

Recommended next step: staging end-to-end verification of recovery email and deployed auth/navigation with dedicated data, followed by a separately scoped route/catalog code-splitting change to address the measured bundle warning. Preserve the existing catalog and persistence tests as release checks.
