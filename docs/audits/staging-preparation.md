# Staging deployment preparation and acceptance

Date: 2026-10-24. **Preparation complete locally; staging acceptance NOT RUN and release NOT signed off.** Read the existing [release-blocker implementation report](release-blocker-fixes.md) and [deployment configuration](../project/deployment.md) first. No implementation was repeated. This pass adds only this runbook and sanitized [evidence](staging-preparation-evidence.json); no runtime code, .env, secrets, exercises, IDs, progress, production configuration, or real accounts changed.

No identified/confirmed staging frontend/API/database was supplied for this pass. The existing database URI was not assumed to be staging and was not contacted. A request for non-secret target identification was made; no response was available when this report was prepared. There is no deployment or mail-send authorization. Presence of local credentials is not authorization to use them against an unidentified environment.

## Owner input checklist — do not put secret values into this report

| Owner item | Required supply/confirmation | Current verification |
|---|---|---|
| HTTPS frontend URL | Actual staging origin, hosting project/owner, root-path deployment, TLS/certificate/redirect settings | Not identified |
| HTTPS backend API URL | Actual staging API base ending in `/api`, backend hosting target, routing/TLS settings | Not identified; current client env has a non-loopback HTTP API URL and is correctly blocked for builds |
| `VITE_API_URL` | Actual HTTPS API base at build time; no trailing slash, credentials, query or fragment | A local value exists, but it is not a validated staging/release value |
| `CORS_ORIGINS` | Exact comma-separated HTTPS frontend origins; no paths/wildcards; identify any separately authorized origin | Absent in checked server env file; deployed process settings unknown |
| `NODE_ENV` | `production` on deployed staging/release backend | Absent in checked server env file; deployed process settings unknown |
| `PORT` | Backend host's assigned listening port and ingress mapping | Local value present; hosting mapping unknown |
| `MONGO_URI` | Protected target-specific URI; explicit confirmation it is staging; replica set or sharded cluster, TLS/network controls, transaction permissions, backup/restore owner | Local value present; staging identity, permissions and transactions unverified |
| `JWT_SECRET` | Protected high-entropy secret, >=32 bytes for production; same intended key across the backend pool unless separately rotating | Local value present; do not infer staging identity, strength or rollout consistency from presence |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE` | Actual provider transport; valid integer port; literal true for implicit TLS or false for required STARTTLS | Local keys present; actual provider connectivity/TLS acceptance unverified |
| `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM` | Authorized SMTP identity/credential and sender, supplied through the target's protected settings | Local keys present; credential validity, sender rights and inbox delivery unverified |
| Dedicated test mailbox/account | Owner-approved non-production mailbox, test-account/data boundary, permission to request/send reset mail and change only that account's password | Not supplied/authorized |
| Optional application secrets | Identify enabled features and supply their own scoped values: OpenAI/Groq/GitHub, evaluator Ollama, and any actually enabled Cloudinary/Redis config | These are feature-dependent, not inferred mandatory dependencies from config-file names; see deployment doc for exact variable names |
| Frontend hosting | Owner/provider/project, Node/build commands, publish client/dist, root-path routing, SPA rewrites, headers/compression, asset retention and rollback owner | Not identified/configured in usable repository hosting files |
| Backend hosting | Owner/provider/project, runtime/build/start settings, instance inventory, secret injection, startup/health/readiness probes, ingress trust and process supervisor | Not identified; container/CI files remain empty placeholders, not proof of an operational setup |
| Evidence and approval | Release artifact identifier, staging-only access scope, maintenance/failure-drill approvals, evidence owner and signoff criteria | Not supplied |

Use the protected environment manager or existing approved secret files for values; do not paste credentials, URIs with credentials, JWTs, codes or passwords into chat, screenshots, command history or audit artifacts. This runbook does not replace valid settings with examples. Fixture `.test` HTTPS URLs below refer to local compilation only and are not proposed deployment values.

## Verified locally in this pass

- `server/config/runtime.js` requires explicit exact HTTPS production CORS origins and production secret/mail configuration; development retains the existing local/LAN list. Disallowed origin requests are denied rather than granted a wildcard exception.
- `client/vite.config.js` rejects insecure non-loopback HTTP build URLs. Explicit HTTP loopback previews remain allowed. Existing HTTP development serving remains functional.
- Current client env has an API URL ending in `/api`, but it is non-loopback HTTP. Current server env contains DB/JWT/SMTP/PORT keys, but lacks NODE_ENV and CORS_ORIGINS. These are sanitized file-presence facts, not claims about deployed runtime values or credential validity.
- Git and Docker exclusions cover .env files/backups and key material; example templates are includable in Git. The backend test verified Git ignore behavior in a disposable Git fixture. Actual tracked secret files and historical exposure are **unverified**, because Git repository discovery failed. No files were removed, untracked, or history-rewritten.
- Root Dockerfile, docker-compose.yml and CI/deploy workflows are still zero-byte placeholders. A provider/hosting deployment cannot be inferred from these filenames.
- Source uses Bearer tokens stored by the browser auth context; no auth-cookie/session issuance exists. CORS credentials true does not create an auth cookie. Secure-cookie acceptance is therefore N/A for current app auth, rather than a claimed cookie-security pass. Verify any hosting/third-party cookies separately. A future cookie migration would need a separate CSRF/SameSite design.

## Authentication and rollout verification

Inspected actual Express router registrations without executing handlers or connecting to a database: **19 route modules, 63 protected route registrations, zero unexpected missing shared-auth checks**. Each protected registration uses `authMiddleware` directly or inherits it through router.use. Admin routers also run database-backed role authorization. Source search found no separate JWT-verification implementation authenticating users outside that shared middleware.

Registration and sign-in issue `ver` from account authVersion. Recovery endpoints intentionally use their own one-time recovery-token flow without requiring an access JWT. Public health/readiness intentionally need no access token. The shared middleware verifies HS256/expiry/claims and compares the JWT version against a primary user lookup, failing closed on DB unavailability. No refresh-token endpoint, alternate session auth or app WebSocket authentication path was found in the mounted server routes.

**This verifies current source registration, not every deployed instance.** Actual staging binaries, middleware, routing, secrets and backend pool are unverified. Local tests prove both current-version and legacy/versionless tokens are accepted before reset and invalidated after reset, with successful new sign-in.

### Safe rollout sequence — owner-operated, NOT executed here

1. Identify staging-only frontend/API/DB/mailbox and operator authorization. Inventory every API instance and current/new artifact identifier. Verify configuration and transactional MongoDB support before selecting traffic targets. Retain an approved rollback artifact that also enforces JWT versions.
2. Prepare the new backend pool privately with production-mode settings, the intended signing key, exact origins and correct DB identity. Startup must pass topology checks; every instance must pass readiness. Do not rotate the signing key or backfill user fields as an incidental part of this rollout.
3. Drain or atomically replace the old backend pool. Pause authentication/reset traffic during transition as needed, and ensure **all protected traffic** also leaves old instances. Pausing only reset endpoints does not stop old instances from accepting revoked JWTs. Do not certify a mixed old/new pool.
4. Verify the actual release artifact and middleware on **each** new instance, including worker pools/revisions/regions and load-balancer affinity. Only then resume/reset acceptance traffic. Confirm before-reset legacy JWT compatibility and after-reset rejection on each instance, not just a random sample through the balancer.
5. Build frontend with the actual staging HTTPS API URL. Publish hashed assets before switching revalidated HTML, retain the prior asset generation, then run acceptance below. Local fixture builds are not release artifacts.
6. If acceptance fails, stop promotion. Roll back only to an approved version-aware backend or keep traffic gated while correcting it. Do not decrement authVersion, clear usedAt, restore old passwords, disable transactions/auth middleware, or roll traffic onto old JWT-only nodes to make tests pass. Separate frontend rollback may preserve compatible API behavior; validate its retained chunks.
7. Obtain explicit owner signoff and production authorization separately. This checklist is not authorization to deploy.

## Actual staging MongoDB transaction gate — UNVERIFIED

No staging DB target has been confirmed, so no connection/probe was attempted against the existing URI. A successful local replica-set test or earlier configured-DB ping cannot establish staging transaction support.

When authorized, the owner/operator must:

- Confirm the resolved database identity and test-data boundary privately. Record only a non-secret target label and approval, not the URI.
- Inspect topology using the target's safe metadata/operations tooling: a replica-set name or mongos topology, session support and supported server/driver capabilities. Current startup performs hello and rejects a standalone server. Metadata alone is only a preliminary gate.
- Verify the staging principal can read/write the required users/password-reset collections and execute primary/majority transactions. Inspect the PasswordReset expiresAt TTL index without deleting/recreating it during acceptance.
- Complete a real API password reset on the approved dedicated staging account, verify committed password/version/usedAt consistency, and run the concurrent reset case. This exercises the actual transaction permissions and application path; a ping or hello result alone does not.
- Review rollback-on-failure using the local failure regression plus an operator-approved isolated staging fault drill if required. Do not introduce a public fault-injection endpoint or change real-user DB privileges. Leave this gate unverified if the fault drill is not authorized.

## Staging acceptance procedure — all rows pending real execution

Record test ID, timestamp, target/release label, executor, sanitized status/header/assertion, PASS/FAIL/BLOCKED and evidence location. Store credentials/tokens only in the approved test runner's protected memory/storage. Do not retain recovery request/response bodies, reset tokens, codes, Authorization headers or passwords in shared logs/HAR files. Never use production accounts. Test data cleanup must be separately approved and confined to run-owned records; no bulk delete/drop is implied.

| ID | Exact action on authorized staging | Required result/evidence |
|---|---|---|
| S01 Target and transport | Verify approved frontend/API DNS, valid HTTPS chain, HTTP redirects and build-time API requests in browser. Confirm root-path hosting, production env and exact CORS values | No mixed content, invented target, development URL or secret-bearing client variable; actual target/release recorded |
| S02 Startup/DB | Start the owner-approved new backend with target config; complete the MongoDB gate above | Unsupported standalone or missing required config fails safely; valid target starts only after dependency/capability validation; no sensitive diagnostics |
| S03 Liveness/readiness | On each instance GET /api/health and /api/ready. In an approved isolated staging failure drill, disconnect only that staging instance's DB access, then restore it | Both 200 when healthy; liveness remains 200, readiness 503 during failure, readiness returns 200 after restore; no-store, generic body. Do not disrupt a shared production DB |
| S04 Registration | Register a new run-owned staging account through the normal UI with approved mailbox, then sign in; do not reuse a production identity | Expected 201 registration/200 sign-in, normal dashboard, no password hash/authVersion leak in safe user object; no-store auth responses |
| S05 Login/session | Test wrong password, absent/malformed/expired JWT and deleted fixture account if separately approved; test protected data and refresh for the legitimate account | Failed auth 401, legitimate auth succeeds; no access to another fixture user's data; no stale success UI on API failure |
| S06 Mail request/privacy | Request reset for the dedicated mailbox and an approved unknown test address; inspect status/body without recording secrets | Same generic 200/body; actual inbox receipt and provider acceptance separately verified for the dedicated account. Do not infer receipt from response success |
| S07 Mail failure | In an authorized isolated staging mail-failure scenario, repeat request and inspect sanitized logs and specific challenge cleanup | Same public response, no provider/recipient/code/token/credential leak. SMTP timing is not constant; document timing/abuse risk rather than treating matching status as complete enumeration resistance |
| S08 Code input | Enter a wrong code, exhaust five attempts, then request a fresh challenge; use a separate challenge after its ten-minute expiry | Wrong code rejected; five-submission cap enforced; exhausted verification 429; expired code 400. Never alter existing user records or global clocks to accelerate expiry |
| S09 Code replay | Enter a fresh correct code, reach reset form through normal router-state navigation, then attempt to verify that code again | First verification 200, repeated verified-code submission rejected (400); no replacement token issued. Email contains a code, not a reset link |
| S10 Token validation | With separate fresh challenges, test a malformed token, the expired temporary token, and a successful token reused afterward | Invalid/expired/reused token 400; no password/version changes on rejected requests. Application rejects expiry even when TTL removal is delayed |
| S11 Normal reset/login | Submit a valid new fixture password through the form, then sign in using it and attempt old-password login | Reset 200; new-password login 200; old-password login 401; correct dedicated account updated, usedAt set and authVersion incremented once; no plaintext password/code/token in DB |
| S12 Concurrent reset | From a protected runner, issue two simultaneous reset POSTs with the same fresh token within its validity window. Use only the dedicated account and keep payloads secret | Exactly one 200 and one 400, one password/version transition; subsequent replay 400. Verify login using the winning password and transaction evidence, not response counting alone |
| S13 JWT invalidation/pool | Capture fixture pre-reset JWT securely; after S11/S12 call representative private routes on every backend instance with old and new tokens. If a versionless pre-upgrade fixture token exists legitimately, include it | Old JWT 401 everywhere after reset, new login JWT works; no old-version instance hidden by affinity. Do not forge a token using production signing keys to create this test |
| S14 CORS | Browser/preflight from approved HTTPS origin with Authorization, then disallowed and suffix-lookalike origins. Check anonymous private request independently | Exact allowed origin reflected, legitimate app works, unlisted origin denied (403/no allow-origin); anonymous private API 401. No wildcard/temporary exception |
| S15 Cookies/storage | Inspect actual auth requests/storage and any platform cookies; verify HTTPS and no sensitive request logging | Current auth is Bearer/local or session storage, so application auth Secure-cookie test is N/A. Independently validate Secure/HttpOnly/SameSite for any cookies actually issued; do not claim those settings exist when no cookie is used |
| S16 Deep links | Open and refresh /login, /register, /forgot-password, /dashboard, /roadmap, /settings and remaining router paths on the deployed host; navigate between lazy pages and test back/forward | Correct SPA shell/auth redirect; no reverse-proxy 404, blank page or failed lazy module. Opening /reset-password without router state keeps its expected invalid/missing-session view |
| S17 Asset/cache | Inspect actual deployed index.html, hashed JS/CSS, private/auth/recovery API headers and a deliberately nonexistent asset URL | HTML revalidates/no-cache or suitable no-store; existing hashed assets immutable/long-lived with correct JS/CSS MIME; nonexistent chunk true 404, not HTML; sensitive APIs no-store/bypass shared caching; gzip/Brotli verified at target |
| S18 Old tab/release | Keep a staging tab open on release A, perform an explicitly authorized staging release B, then open a previously unvisited lazy page in old tab; perform approved rollback drill | Retained A chunks load, B works, rollback assets remain. If a chunk truly fails, a visible recovery panel/navigation/reload works; no reload loop. Deployment is a separately authorized operator action |
| S19 Recovery persistence | Reload and sign out/sign in after a completion save using dedicated staging progress; navigate Notes/Resources/Practice and filters | Saved completion survives; ownership isolated; no exercise ID/key/count changes or unrelated UI regression |
| S20 Operations/signoff | Review sanitized application/proxy/APM logs, readiness alerts, transaction outcomes, primary lookup latency and evidence for every backend instance; review secret-history findings and rollback plan | No credentials, reset bodies/tokens/passwords in logs/caches; all mandatory rows PASS or explicitly blocked; no blocked row silently marked PASS; named owner release decision |

Expired-code/token rows may require separate challenges and at least their actual validity windows. Do not reuse an exhausted/verified challenge to claim expiry behavior. Verify application timestamps and TTL settings on dedicated fixtures; delayed TTL cleanup is normal and is not a substitute for application expiry checks.

## Local validation rerun now

Roadmap command: `node --test --test-isolation=none --test-reporter=spec client/src/data/careerRoadmaps/*.test.js`. Backend command: `npm --prefix server test`. All temporary database writes belong to the disposable local tests; actual staging and configured databases were not connected.

| Local check | Result | Scope |
|---|---|---|
| `npm --prefix server test` | 13 passed, 0 failed, 0 skipped | Real HTTP/Mongoose/bcrypt/JWT against fresh loopback replica set; SMTP stubbed. Includes exactly one concurrent reset success, rollback/retry, JWT versions, connected-but-failed-ping and disconnected readiness, production origins/config and ignore fixtures |
| Roadmap Node suite | 95 total: 93 passed, 0 failed, 2 skipped | PyTorch/TensorFlow absent; 10/9 reference runtime checks not executed. Catalog/IDs/keys remain compatible |
| Default production build, unchanged env | Rejected as intended | Existing non-loopback HTTP API; no automatic env replacement or stale artifact deployment |
| Production build with reserved HTTPS fixture | Passed | `/tmp/career-staging-acceptance-https`; fixture domain not contacted, not an owner staging URL |
| Explicit loopback production build | Passed | `/tmp/career-staging-acceptance-loopback`; local preview only |
| Dev server current config | HTML 200, App module 200 | Local Vite started/closed, no API requests; existing HTTP development config accepted |
| Loopback preview | /roadmap 200, hashed asset 200 with JS MIME | Local preview only; not proof of actual deployed rewrite/cache headers |
| Route middleware inspection | 63 protected registrations in 19 modules, zero unexpected missing shared checks | No handlers executed, database connected or SMTP sent |
| Secret history/target DB | Unverified | Git metadata unavailable; no staging DB identity supplied |

Production output remains about 287.72 kB entry JS, 2,465.97 kB Roadmap and 533.26 kB CSS. The Roadmap >500 kB warning remains; no code splitting or catalog refactor was performed. The Roadmap test command's first automatic permission review timed out; the permitted single retry ran successfully. This was a tool-approval timeout, not a test failure or security rejection.

## Remaining release gates

1. Owner must identify and authorize actual staging targets and protected settings; verify staging MongoDB transaction permissions through real dedicated-account acceptance. No staging connection or write was made here.
2. Resolve actual HTTPS API build value, production NODE_ENV/CORS and hosting/probe/header/asset-retention setup; empty deployment placeholders are not usable definitions. Avoid shipping stale artifacts after the intentional failed build.
3. Inspect tracked secrets/history in the actual repository; local ignore rules cannot certify absence of historical exposure.
4. Complete real provider delivery, reset/JWT/pool, readiness failure and cache/deep-link/old-tab/rollback acceptance with explicit staging authorization. No email or deployment has been performed.
5. Retain previous hardening findings: inline SMTP timing exposure, dedicated account/IP send budgets/durable scheduling, concurrent new-challenge policy, primary lookup capacity, and prior multi-tab progress limitations. These are not cured by a successful local build.
6. Roadmap payload warning and external-integration/browser/accessibility coverage remain as documented. Production promotion requires a separate explicit owner decision after real acceptance evidence.
