# Local quality and release-readiness audit — 27 October 2026

## Overall status

Partially verified; not production-ready. Work remained local. Existing frontend/API services were used read-only, not started or reconfigured. No deployment, remote repository operation, environment/configuration/dependency change, real account login, or real record mutation was performed.

The active project is the workspace root, not the extracted copies. Git metadata is absent. The existing responsive checklist was read; file hashes and explicit patch review preserved prior work.

## Changes and evidence

### Security: exception privacy

Synthetic failure tests reproduced raw service exception text in public response fields or logs in eight controller families before changes. The affected controllers now retain their response envelopes/statuses but repeat fixed operation messages instead of exposing exception messages; diagnostic logs use fixed labels rather than exception objects, messages or stacks. Other controllers/document routes with the same raw logging pattern received the same focused correction. Existing reviewed parser/provider error classifications were preserved.

### Security: administrator role-change race

A local model-double probe reproduced two successful cross-demotions with zero administrators remaining. Role changes now run in a transaction and recheck/touch the acting administrator inside it, before reading/changing the target and counting admins. Touching the existing actor updatedAt field makes concurrent cross-demotions contend on documents both transactions write, allowing MongoDB transaction conflict/retry handling to recheck the demoted actor. Self-role restrictions also normalize hexadecimal ID case, preventing an uppercase spelling from bypassing the self-change guard. Last-admin checks, role enums and API envelopes remain. Responses are sent only after commit. No schema changed.

Serialized transaction doubles verify the recheck and rollback semantics, but do not prove MongoDB write-conflict/retry behavior. The existing disposable replica-set release test was extended with real concurrent demotions and Activity delete ownership checks; it was syntax-checked, NOT executed. This remains a release blocker until that integration test passes.

### Functionality: Activity deletion

The frontend already called DELETE /api/activities/:id; the backend had only GET/POST. Added an authenticated DELETE route, strict identifier validation, and an owner-scoped findOneAndDelete. Invalid identifiers return 400, inaccessible/missing records 404, success 200, and storage errors a fixed 500 message. No real activities were deleted.

### UI: confirmed remaining tablet control issues

The initial all-route fixture sweep found no horizontal page overflow but reproduced short or small-text controls at 768px content widths. Added scoped rules only: Documents banner/sidebar buttons, GitHub form text, Knowledge search text, Activities search/filter/submit controls, Notifications search/time/tab/empty controls, and Admin Data Center filter/header controls. Existing phone and desktop designs, switch tracks, and previous fixes were preserved.

## Exact changed source/test files

- `server/controllers/adminUserController.js`
- `server/controllers/resumeController.js`
- `server/controllers/interviewController.js`
- `server/controllers/githubController.js`
- `server/controllers/knowledgeController.js`
- `server/controllers/notificationController.js`
- `server/controllers/adminDataController.js`
- `server/controllers/progressController.js`
- `server/controllers/activityController.js`
- `server/controllers/skillEvidenceReviewController.js`
- `server/controllers/skillController.js`
- `server/controllers/skillEvidenceController.js`
- `server/controllers/authController.js`
- `server/controllers/jobController.js`
- `server/services/activityService.js`
- `server/tests/releaseReadiness.test.cjs`
- `server/tests/adminUsers.test.cjs`
- `server/tests/adminRoleConcurrency.test.cjs`
- `server/tests/errorPrivacy.test.cjs`
- `server/tests/activityDelete.test.cjs`
- `server/routes/documentRoutes.js`
- `server/routes/activityRoutes.js`
- `client/src/pages/GitHub/GitHub.css`
- `client/src/pages/Admin/AdminDataCenter.css`
- `client/src/pages/KnowledgeBase/KnowledgeBase.css`
- `client/src/pages/Documents/Documents.css`
- `client/src/pages/Notifications/Notifications.css`
- `client/src/pages/Activities/Activities.css`

Documentation: this report and `docs/responsive-ui-checklist.md`.

## Route/workflow inventory

Implemented below means present in the inspected source, not a claim of live persistence. All 24 concrete routes plus fallback resolution were reviewed. All concrete route components were rendered in the regression fixture set.

| Routes / feature | Implementation status | Verification and limits |
| --- | --- | --- |
| `/` | Public landing/navigation implemented | Live unauthenticated page checks and synthetic layout checks; external destinations not visited. |
| `/login`, `/register` | Registration/login/session storage/logout helpers implemented | Live login reveal and blank validation; protected redirects; existing handler tests. No real credentials/submissions or successful session restoration tested. |
| `/forgot-password`, `/reset-password` | SMTP code flow and transactional reset/auth-version invalidation implemented | Public page checks, runtime/mail transport doubles, reset handler fixtures. Actual delivery and database reset integration unverified. |
| `/dashboard` | Owner-derived progress summary implemented | Summary/unit fixtures and responsive checks; no authenticated refresh. |
| `/roadmap` | Curriculum, progression, notes and practice persistence requests implemented | Content/reference tests and selected tab fixtures; actual saving and every lesson/code state unverified. |
| `/skills` | Skill CRUD and evidence requests implemented | Source ownership/validation review, selected form/evidence fixtures; live CRUD unverified. |
| `/dsa` | Owner-scoped canonical topics/progress implemented | Existing read-only, validation, calculation and handler tests; live writes unverified. |
| `/interview` | Local question/setup flow and Ollama/Qwen evaluation request implemented; preparation service also exists | Preparation mocks and layout checks. No actual model evaluation/session persistence tested. |
| `/resume` | Upload/parser, local evidence-based analysis and stored-resume operations implemented | Extensive parser/analyzer/controller fixtures passed; real upload, storage, download/print and integrations unverified. Resume analysis tests are not proof of external AI evaluation. |
| `/settings` | Browser-local preferences/theme/zoom/comfort implemented; Profile manages account biography | Utility tests and tab fixtures. Security/AI preference fields are not proof of server-side policy or model configuration. |
| `/projects` | CRUD and persistence requests implemented | Mocked duplicate-save/edit/error/delete-cancel checks; live persistence unverified. |
| `/documents` | Private file upload/list/download/delete and document AI requests implemented | File restriction/ownership source review, dialogs/handler fixtures. Real file persistence/download/AI responses unverified. |
| `/jobs` | API listings/filter/sort implemented; saved IDs are browser-local; apply links external | Layout/handler/source checks. Application-progress tracking is explicitly NOT implemented. |
| `/github` | Authenticated GitHub API analysis implemented | Input/layout/source checks; external GitHub calls/rate-limit/provider states untested. |
| `/knowledge` | Curated resources with browser-local saved/completed/recent state implemented | Layout/source checks; backend Knowledge endpoints are not proof of UI server persistence. |
| `/progress` | API manual progress plus derived summaries implemented | Summary and selected form fixtures; live updates unverified. |
| `/activities` | Listing/create and frontend deletion implemented; missing DELETE backend repaired | Search/filter/cancel doubles and new owner-scoped endpoint tests; no real delete/persistence. |
| `/notifications` | API list/read actions implemented; preferences and Quiet Hours are browser-local only | Layout/source checks; no claim of server delivery scheduling or push functionality. |
| `/profile` | Account-owned profile create/update implemented | Failed-save/nested-entry preservation fixtures; no live save. |
| `/admin/users` | DB-verified role checks, list/search/pagination and role updates implemented | Existing guard tests plus new transaction doubles. Real concurrent transaction test still required. |
| `/admin/evidence` | Admin-only review/filter/confirmation implemented | Handler cancellation/validation/failure fixtures and source review; no real decision written. |
| `/admin/data` | Read-only inspection UI, nested-field/raw JSON views implemented; backend admin mutations separately permissioned | Rendering/handler/source tests; authenticated reads and write endpoints not exercised. |

## Verification results

### Automated/source checks

- Backend/resume: 138 tests passed (controller privacy, admin guards/transaction doubles, Activity deletion, progress aggregation, DSA read-only ownership, Interview preparation, startup/CORS/mail doubles, resume parsing/analysis). No services or real database writes in this selection.
- Frontend safe sweep: 120/121 passed initially; one Linux subprocess fixture raised sandbox EPERM. The entire seven-case file passed outside the restricted sandbox, resolving that environmental failure. Do not count the rerun as seven additional distinct tests.
- Three Python reference-test files: 10 passed, 2 skipped. NumPy and ML/Python acceptance checks ran; PyTorch (10 runtime checks) and TensorFlow (9 runtime checks) were unavailable. No packages installed.
- An earlier broad frontend invocation was interrupted after restricted Python subprocess timeouts and discovery of a nested database-starting test. It is not counted as a successful sweep. The subsequent narrowed runs/reruns above are the reported results.
- `server/tests/releaseReadiness.test.cjs`, the MongoDB reference-query case and local HTTP-listener exercise tests were not executed under this audit’s service-start restrictions. Empty root auth/job/profile/RAG placeholder test files provide no coverage.
- Compiled all 189 non-test frontend JS/JSX files; parsed all 31 frontend CSS files; active AST import graph resolves 125 files with no missing relative imports.
- Syntax checks passed for all 190 backend/AI/worker JS/CJS files, including the prepared but unexecuted release-integration test.
- A naive text import scan flags lesson examples and unused common/Sidebar.jsx, which references a missing CSS file. The active AST graph is clean; the unused legacy file was not speculatively changed.

### Synthetic browser layouts

770 final headless Chrome cases: 35 route/state variants, both root themes, and 320, 360, 375, 390, 430, 768, 1024, 1280, 1440px widths plus 768×390 and 844×390 landscape. Actual component markup and shared/page CSS were used with test-only state; network/storage writes were forbidden. No measured page overflow or checked mobile field/button sizing failures. All 140 compared desktop measurements at 1280/1440 matched the initial audit fixtures. This is not complete visual/a11y or physical-device certification.

### Actual browser against the running application

Fresh isolated Chrome profile against the already-running local frontend: 20 public-page cases (five routes × 320/390/768/1440px) passed content/error/overflow checks. All 19 protected routes redirected to Login without a token. Login password reveal/pressed state and invalid empty-form checks passed. API mutation interception recorded zero attempted writes. No real credentials or authenticated account data were used. Existing API liveness and readiness each returned HTTP 200; that does not validate workflows, migrations, transactions or AI/mail providers.

An initial sandbox-only reachability check was misleading; the existing frontend/API were confirmed reachable outside sandbox restrictions. No service was started or stopped. Real-device, mobile Safari/Chrome, assistive-technology, hydrated authenticated CRUD, native zoom and full persistence testing remain outstanding.

## Production build and deployment prerequisites

- Production build NOT run: existing VITE_API_URL fails the unchanged guard because it uses non-loopback HTTP. Its value was not printed. Supply an approved HTTPS backend URL ending in /api with no embedded credentials/query/fragment. Do not guess a host or weaken validation.
- Local production-environment preflight reports CORS_ORIGINS missing. An explicit HTTPS frontend-origin allowlist is required before production; this does not assert that a future hosting environment has the same missing value.
- Verify MongoDB replica-set/sharded transaction capability, concurrent admin demotions and reset rollback/replay using the prepared disposable release suite after approval. The live readiness ping alone is insufficient.
- Verify SMTP delivery/TLS, Ollama/Qwen reachability/response/error handling, Groq document AI credentials/provider responses and GitHub integration availability without exposing credentials.
- Private uploaded files require persistent private storage and backups; local filesystem storage needs an explicit multi-instance/volume strategy. Do not serve uploads publicly.
- Validate current tokens/session cleanup, ownership boundaries, upload rejection/recovery, production CORS and rate limits, browser security policy, backup/restore, logs, and dependency/security review in an isolated environment. This audit is not a penetration test or dependency-advisory certification.

## Exact next manual actions

1. Approve the existing disposable replica-set suite (starts local mongod/HTTP and writes only its temporary database); run `cd server && node --test tests/releaseReadiness.test.cjs`. It now includes the real concurrent-admin and Activity ownership cases. No real database should be substituted.
2. Provide/approve the correct production API URL and explicit CORS origins through the appropriate environment process. Then build to a new temporary output path, preserving existing dist artifacts and the guard.
3. Use authorized disposable accounts in an isolated test environment for all CRUD/reload/ownership/admin decisions, real uploads/downloads, password delivery/reset and AI/GitHub success/failure flows.
4. Test physical mobile browsers, soft keyboards, safe areas, keyboard/screen-reader navigation, 100/125/150/200% native zoom and website zoom separately.
5. Review the resulting security, persistence, backup and production configuration evidence before any separate deployment authorization. Do not deploy from this audit.
