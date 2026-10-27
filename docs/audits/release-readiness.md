# Staging and production release-readiness audit

> Historical audit: targeted fixes and current validation are documented in [release blocker fixes](release-blocker-fixes.md). Findings below describe the pre-fix snapshot.

Date: 2026-10-24. **Production release is not signed off.** Local build/regression success does not close the configuration and recovery-control gaps below. Reviewed the existing bundle/UI audit and current source. No deployment, provider login, SMTP delivery, real reset request, real password change, or user-data write was performed. No secret values are recorded here.

## Scope and evidence

Inspected current frontend API/environment usage, AuthContext/ProtectedRoute, auth/recovery pages, backend startup/app/routes/auth service/middleware, password-reset controller/schema, email service, database configuration, hosting/container/CI files, ignore rules, and the saved bundle module graph. Inspected the active root project; similarly named extracted/work directories are not assumed to be deployed applications.

Only new audit tests and reports were added:

- `server/tests/releaseReadiness.test.cjs`: isolated controller/auth/middleware characterization tests, with in-memory models and stubbed mail delivery.
- `docs/audits/release-readiness.md`: this report and staging/release checklist.
- `docs/audits/release-readiness-evidence.json`: sanitized configuration booleans, local probes, test/build results, and Roadmap contributor inventory.

No runtime source, API contract, environment file, security control, recovery behavior, exercise content/IDs, completion keys, saved progress, or database schema was changed. The working directory is still not recognized as a Git repository, so tracked-file history and past secret exposure cannot be established here.

## Verified configuration and missing release settings

| Area | Verified locally/current source | Missing or unverified for release |
|---|---|---|
| Frontend API | `VITE_API_URL` is set, ends in `/api`, has no trailing slash, and is the sole current VITE-prefixed key. Shared fallback is localhost HTTP. **Configured non-loopback API URL is HTTP** | HTTPS API URL for an HTTPS frontend; rebuild with the target environment because Vite embeds this at build time. Runtime environment changes alone do not rewrite an existing bundle |
| Server required values | `MONGO_URI`, `JWT_SECRET`, `PORT`, and MAIL host/port/secure/user/password/from are nonempty | Presence is not proof of credential validity/strength or correct staging identity. `NODE_ENV` is absent in the checked env file; an external process environment may override it |
| MongoDB | URI uses SRV and contains no literal TLS-disable option. Fresh read-only configured database ping succeeded | Staging network policy, DB identity/least privileges, TLS/server verification, backups/restore, migrations/indexes, capacity, and failover are not certified by ping |
| Auth | Bearer JWT verified with `JWT_SECRET`, 7-day issuance, bcrypt cost 12. Browser stores tokens in localStorage or sessionStorage according to Remember Me; logout clears browser storage | No server-side session/token revocation or password-change version check. Existing JWTs remain valid after reset. Review XSS/CSP/storage exposure and access-token lifetime; do not treat browser logout as server invalidation |
| Cookies | No authentication cookie issuance/session middleware found; local health response sets no cookie | There is no current auth cookie whose Secure/HttpOnly flags can simply be toggled. HTTPS is still mandatory for bearer tokens. A future cookie migration would require a separate CSRF/SameSite/credentials design, not a deployment toggle |
| CORS | Exact allowlist contains only localhost/loopback/LAN origins on 5173/5174. Allows Authorization and Content-Type, credentials true. Missing Origin is intentionally allowed; authentication still gates private routes | No deployed HTTPS frontend origin is listed; no environment-driven origin setting is implemented. Require a reviewed exact-origin allowlist change for the actual target. Do not use wildcard credentials or weaken auth |
| SMTP | Current transport config selects Gmail SMTP, implicit TLS on port 465, and nonempty auth/sender fields | Credentials, allowed sender identity, account/provider permissions, connectivity, delivery, spam handling, sender authentication/alignment and quotas are **not tested**. Neither transporter.verify nor sendMail was contacted |
| Startup/health | Backend binds configured PORT/0.0.0.0; connection failures call process.exit(1). `/api/health` returned 200 | `connectDB()` is not awaited before listen. Health returns a fixed running message, not DB readiness; it can report success while DB connection is pending/down. Required JWT/mail env values are not validated at startup |
| Hosting | Vite config contains the React plugin only; assets have hashed filenames | No verified hosting provider, rewrite policy, asset base path, DNS/TLS termination, reverse proxy or CDN configuration |
| Container/CI | Root Dockerfile, docker-compose.yml, .dockerignore, CI/deploy workflow files, deployment doc and server .env.example are **zero-byte placeholders** | These are not usable deployment or CI definitions. No pipeline/rollback/secret-injection behavior can be inferred from filenames |
| Secret packaging | Root .gitignore excludes uploads only; client/server .gitignore are empty; .dockerignore is empty. Environment files and backup copies exist | Env/backups are not excluded by these rules. Review version history/artifacts and configure exclusions and secret injection before publishing/build-context upload. Rotate credentials if exposure is established; this audit cannot claim they were leaked or tracked |
| Proxy/rate limits | No explicit Express trust-proxy setting; global in-memory limiter is 1000 requests/15 minutes/IP, labeled development | Verify actual ingress trust topology; do not set trust proxy true blindly. Configure targeted reset/login abuse budgets and a suitable shared limiter for multiple instances |

CORS does not authenticate callers. Local probes returned: allowed localhost preflight **204**, unlisted HTTPS fixture origin **500 with no reflected allow-origin**, anonymous Roadmap read **401**. The origin is denied, but denial currently follows the generic 500 error path, not a deliberate 403. Local health has no Cache-Control header. These observations describe the current local API, not a deployed edge or staging host.

## Password recovery: implementation and findings

### Actual flow

1. `POST /api/auth/forgot-password` normalizes email, looks up a user, removes unused earlier reset requests for that user, generates a six-digit random code, stores its SHA-256 hash, and sets expiresAt to 10 minutes. Existing users trigger SMTP sendMail; unknown users return generic success without SMTP.
2. **Email contains a code, not a reset link.** There is no emailed link/token-URL handler to open. User enters the code on the existing forgot-password screen. If a link-based experience is required, it is not implemented and should not be claimed as tested.
3. `POST /api/auth/verify-reset-code` requires an unused, unexpired record, applies a sequential five-wrong-attempt counter, compares hashes, and returns a random 32-byte temporary reset token. Only its SHA-256 hash is stored; resetTokenExpiresAt is 10 minutes after verification.
4. Frontend passes email/token through router history state to `/reset-password`; it is not put in the URL query string or explicit localStorage. Router history state is still browser/JavaScript-accessible. Direct opening without that state shows the existing invalid/missing-session view.
5. `POST /api/auth/reset-password` validates minimum password length 8, looks up the verified unused token hash with a future resetTokenExpiresAt, updates the user's bcrypt password, then saves usedAt. The frontend then navigates to login.

### Confirmed gaps

**High — non-atomic token consumption.** Lookup, password update, and usedAt save are separate operations. Two concurrent calls can both read an unused token and both update the password. This was reproduced against actual controller code with independent in-memory document snapshots: both calls returned 200 and two updates occurred. It is not a real-Mongo concurrency test. A reviewed atomic single-use/transactional lifecycle is needed; sequential reuse rejection alone is insufficient. A failure after password update but before usedAt save also leaves inconsistent completion semantics.

**High — reset does not revoke existing access JWTs.** Source and isolated middleware testing confirm that an existing signed access token remains accepted after reset, because verification checks the JWT signature/expiry but not password-change state or token version. Decide and implement the account-recovery revocation policy before signoff. No real account tokens were tested or changed here.

**High — provider failure exposes different request status.** Unknown email returns generic 200; an existing email with SMTP failure returns 500. Tests confirmed both branches. Normal known/unknown success wording matches, but this does not make the endpoint enumeration-safe during outages. The existing-user branch also waits on SMTP, creating a timing-difference risk; no timing attack measurement was performed. A failed delivery leaves an active reset record.

**Medium — inconsistent lifetime/TTL.** PasswordReset schema defines a TTL index on the original expiresAt. Verification grants a separate 10-minute reset-token expiry without extending that document deadline. Near-expiry verification can therefore create a session whose backing record is deleted earlier by TTL cleanup. Conversely, while cleanup is delayed, reset accepts a record after original expiresAt because its query does not check that field. Tested the query/lifecycle behavior with fixtures; actual deployed TTL index presence and monitor timing were not checked. Specify one lifetime policy and align queries, storage/cleanup and UI messages.

**Medium — code replay and abuse limits.** A correctly verified code can be verified again before original expiry, issuing a replacement token and invalidating the previously issued token hash. Reproduced locally. Wrong-attempt read/increment/save is non-atomic, so the sequential attempt test does not prove a concurrent cap. New forgot requests reset the challenge and attempts; there is no dedicated per-account request cooldown/mail-send budget in this implementation. The global development limiter is not a complete recovery-abuse policy.

**Logging/cache review required.** No direct console logging of successful code/token values was found. The request logger records method/path, not request bodies; code and reset token are not URL parameters. However controllers log raw exception objects and the generic error handler prints unredacted details. SMTP/Mongo errors and external proxy/APM request-body capture require redaction verification. Auth/reset responses do not explicitly set private/no-store cache headers in these handlers. Do not log or cache resetToken, codes, Authorization, passwords, DB URLs or SMTP credentials. A local no-secret-logger search is not proof that provider/APM logs are safe.

### Test status

| Check | Current evidence |
|---|---|
| Request construction and code generation | Actual controller logic, mocked user/store/mail, passed |
| Code/temporary token stored hashed | Passed in fixture records |
| Invalid and expired code/token rejection | Passed locally with controlled fixture timestamps |
| Five failed attempts, sequential | Passed locally; concurrent enforcement not established |
| Valid reset and new-password login | Actual controller/auth-service logic and real bcrypt/JWT with fixture models/secrets, passed; not a real database or HTTP sign-in |
| Sequential reused reset token | Rejected locally |
| Concurrent reused reset token | Unsafe acceptance reproduced locally; release finding |
| Existing access token after reset | Remains accepted locally; release-policy gap |
| Code replay | Replacement token can be minted locally |
| Actual provider email receipt | **Not attempted; explicit authorization required** |
| Open emailed reset link | **Not applicable: email is code-based, no reset link implemented** |
| Actual staging reset/new-password sign-in | **Not performed** |
| Staging invalid/expired/reused-token and log-redaction checks | **Not performed** |

## Deep links, hashed chunks and caching

No target provider or edge configuration was established. Prior bundle-audit browser results cover local Vite preview's fallback only; they are not reclassified here as staging evidence. Required hosting behavior:

- Serve existing assets normally. Rewrite application deep links such as `/roadmap`, `/settings` and auth routes to index.html. Do not rewrite `/api/*` or missing `/assets/*` chunks to HTML; missing chunks should return a real 404, not 200 HTML with a JavaScript URL.
- index.html should revalidate (`Cache-Control: no-cache`) or use an appropriate no-store policy. Serve content-hashed JS/CSS with `Cache-Control: public, max-age=31536000, immutable` when supported. Do not apply immutable caching to HTML.
- Keep authenticated/auth/recovery API responses out of shared CDN caches, with explicit private/no-store policy for sensitive responses. Verify CORS Vary behavior when caching responses by origin.
- Upload/version assets before switching HTML atomically; retain older hashed assets for existing sessions through the supported rollout/rollback window. Test an old open tab navigating to a previously unopened lazy page after a release.
- Keep the current user-visible chunk error/reload fallback. It is recovery behavior, not a substitute for correct HTML caching and asset retention. Test CDN/base-path/TLS/content-type behavior on the actual target.
- Verify HTTPS redirects, certificate chain, frontend-to-API mixed-content behavior and security headers at the real TLS terminator. Set a topology-specific proxy trust policy only after confirming ingress behavior; no proxy/provider was invented in this pass.

## Large Roadmap chunk: evidence and recommendations only

Fresh build is unchanged: entry **287.72 kB / 89.47 kB gzip**, Roadmap **2,465.97 kB / 809.05 kB gzip**, CSS **533.26 kB / 81.53 kB gzip**. The >500 kB Roadmap warning remains.

Existing emitted graph attributes 42 modules to the careerRoadmaps catalog. Largest recorded rendered-module sizes are below. These are module-rendering metrics before final chunk minification/compression, not independently downloadable final asset sizes and should not be equated with exclusive percentages of the final chunk.

| Module | Rendered bytes |
|---|---:|
| roadmapPracticeBatches.js | 128,380 |
| roadmapPracticeAIApplications.js | 122,005 |
| roadmapPracticeAIAgents.js | 113,944 |
| roadmapPracticeAILLMEngineering.js | 106,242 |
| roadmapPracticeBackendAuthSecurity.js | 104,914 |
| roadmapPracticeAIMachineLearning.js | 101,228 |
| roadmapPracticeBackendDeployment.js | 101,142 |
| roadmapPracticeAIDeepLearning.js | 98,110 |
| roadmapPracticeBackendDatabases.js | 97,127 |
| roadmapLearningContent.js | 95,993 |

The cost is primarily authored data and eager global catalog/lesson assembly, not a large vendor library inside Roadmap. Recommend a separately scoped asynchronous per-career/per-phase catalog loader, keeping lightweight roadmap/topic/progress metadata stable and preserving all IDs/aliases/keys and loading safeguards. Defer lesson/practice payloads until the selected phase/tab needs them; measure transferred bytes, initialization cost, filters, completion hydration and rapid phase-switch races. Merely assigning manual chunk names while importing every catalog eagerly does not reduce the Roadmap visit cost. Consider later detail/solution payload loading only after phase-level loading is validated. Verify gzip/Brotli at the actual host. No catalog refactor was performed here.

## Validation actually run

- `node --test --test-isolation=none --test-reporter=spec server/tests/releaseReadiness.test.cjs`: **7 passed, 0 failed**. These are controller/auth/middleware tests with in-memory model snapshots and a stubbed mail function. Several passing tests intentionally assert the insecure behavior described above: passing characterization tests do **not** mean the security gates passed.
- `node --test --test-isolation=none --test-reporter=spec client/src/data/careerRoadmaps/*.test.js`: **95 tests, 93 passed, 0 failed, 2 skipped**. PyTorch/TensorFlow are unavailable (10/9 runtime checks skipped). IDs, keys, coverage, aliases, filtering and rendering checks remain intact.
- `npm --prefix client run build`: **passed**, 447 modules, same measured chunks and existing Roadmap warning. Root/server npm test commands remain placeholders; they are not counted as meaningful suites.
- Configured MongoDB: **actual fresh ping passed**, no user records accessed/written. This is a connectivity check on the configured database, not a staging identity/capability test.
- Current local API: health 200, allowed preflight 204, unlisted origin not reflected (500 denial), anonymous protected read 401. No token/reset/password request sent.
- No browser or staging-host test was newly run in this pass. Previous route/UI/auth browser reports remain available as historical local evidence only. No SMTP connection verification, mail delivery, real account reset, deployment, CDN probe or destructive operation occurred.

## Prioritized staging and release checklist

### P0 — resolve before release signoff

- Identify the actual staging/frontend/API/edge owners and target domains. No provider or credentials have been assumed.
- Review secret exclusions for Git/build artifacts/container context and existing env backups. Check actual history/artifacts; rotate only where required by exposure assessment. Store runtime secrets in the target's protected configuration; never VITE-prefix private keys. Do not publish the current empty deployment/CI files as if they were operational.
- Set the build-time HTTPS frontend API base to the actual HTTPS API ending in `/api`; rebuild and inspect the browser requests. Add only explicitly approved HTTPS frontend origins through a reviewed backend CORS configuration change. Do not widen controls to pass a browser check.
- Fix and regression-test atomic reset consumption/password-update consistency, provider-failure enumeration behavior and the reset/TTL lifetime policy. Establish access-token revocation and OTP reuse/attempt policies, with concurrent real-database tests against dedicated staging data.
- Approve and document the supported **code-based** recovery flow or separately authorize a link-based feature; no claim of an emailed reset link is currently valid.

### P1 — authorized staging acceptance, no production accounts

- Obtain explicit authorization to send to a dedicated staging mailbox and reset that dedicated account. Ensure credentials correspond to the intended environment and a provider-approved sender. Inspect secret-safe logs/APM capture settings before running the flow.
- Request reset for that account and an unknown test address. Verify safe response/status behavior, rate budgets, provider message acceptance, actual inbox receipt and sender/domain authentication. Do not paste the code/token/password into shared logs/screenshots.
- Enter received code in the existing UI, verify navigation to the reset form, set a dedicated replacement password, and sign in using it. Verify the previous password fails. Record outcome/status/timing without secret values.
- Test wrong/expired codes, attempt exhaustion, a new request replacing the prior challenge, invalid/expired/reset-token replay, concurrent consumption and the agreed existing-session revocation policy. Cover near-expiry verification plus actual TTL cleanup. Do not bypass email verification or weaken middleware to complete the test.
- Verify actual staging DB permissions, indexes/TTL, backups/restore and connectivity; configure startup validation and a truthful dependency-readiness check distinct from fixed liveness. Ensure health checking does not exhaust the global limiter or mislead rollout decisions.
- Validate HTTPS/TLS/security headers and actual proxy/IP identity; configure appropriate per-account/IP recovery limits and shared storage where multiple instances require it.
- Test direct URLs, refresh, public/auth/private routes, missing asset 404/MIME behavior, no-cache HTML, immutable hashed assets, API cache bypass, gzip/Brotli, and old-tab lazy navigation across two atomic releases/rollback. Record actual edge headers and failed-chunk behavior.

### P2 — follow-up optimization and release operations

- Implement measured per-career/phase catalog loading in a separate task, retaining all 2,571 exercises and completion compatibility. Keep the remaining warning visible until its payload cost is actually reduced.
- Replace placeholder CI/deploy definitions with an explicitly chosen target's build/test/promotion/rollback process, dependency versions and required checks. Preserve existing audit results; do not infer readiness from placeholder npm test scripts.
- Complete external integration, browser compatibility, accessibility and concurrency checks recorded in prior audits. Capture staging evidence and obtain an explicit release decision before any production deployment.
