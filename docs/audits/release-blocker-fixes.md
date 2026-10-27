# Release blocker fixes — implementation and local validation

Date: 2026-10-24. Implements the targeted security/configuration/readiness changes from [the historical audit](release-readiness.md). **Not a production deployment or staging signoff.** Existing environment files, configured database and real user records were not accessed or modified during validation. SMTP was never contacted. No migration or repository-history operation was executed.

## Recovery lifecycle before and after

The existing flow remains code-based: request a six-digit code, enter it, receive a temporary opaque token through the existing API/router-state flow, submit a new password, and sign in. No email-link flow or API path replacement was introduced.

Before: a ten-minute code document could mint replacement reset tokens repeatedly; a second token deadline disagreed with the TTL deadline; password update and token usedAt were separate writes; existing JWTs stayed valid; provider failures changed account-dependent status codes.

Now:

1. Request creates a hashed-code record with a ten-minute expiresAt. Unknown accounts, successful delivery, SMTP failures and internal request-processing failures all return the same generic 200/body. Invalid missing email still returns 400. Failed delivery attempts remove that specific challenge where cleanup succeeds. Logs use fixed sanitized messages and auth/recovery responses are no-store. This prevents status/body disclosure; **SMTP remains inline and timing equivalence is not guaranteed**. Durable queued delivery and targeted send budgets remain follow-up hardening; no random delay or non-durable fire-and-forget workaround was introduced.
2. Each verification submission reserves an attempt with an atomic conditional increment, capped at five. The code hash is compared using timingSafeEqual. Only one successful conditional verifiedAt transition may issue a token. Verified codes cannot issue replacements.
3. Verification sets expiresAt and resetTokenExpiresAt to the same new ten-minute deadline. Both are checked during reset, independent of eventual MongoDB TTL cleanup. The existing expiresAt TTL index is unchanged.
4. The password is hashed with bcrypt cost 12 outside the transaction. Inside a primary/majority MongoDB transaction, one conditional findOneAndUpdate claims the unused, verified, unexpired token, then the account password is replaced and authVersion incremented. Commit publishes all three changes together. Concurrent requests cannot both consume it. If the password write fails, the transaction rolls back token consumption and version changes; a valid retry can proceed.
5. New login/registration JWTs carry ver. Authentication verifies HS256/expiry/claims and performs an indexed primary lookup of the user's authVersion. Old JWTs, including legacy JWTs without ver, are rejected after reset. Valid newly signed-in tokens work. A missing/deleted account returns 401; DB unavailability fails closed with 503.

No plaintext code or temporary token is stored in the database. Successful verification still returns the temporary token to the existing frontend over the auth API; the owner must supply HTTPS. No signing secret, password, reset token, SMTP credential, recipient or DB URI is included in the new diagnostic messages.

## Compatibility and migration risks

- `User.authVersion` is additive and defaults to zero. Existing records lacking it read as zero and existing JWTs without ver remain usable before reset. No backfill, data reset, new user index or secret rotation was performed.
- Reset now requires MongoDB transactions: a replica set or sharded cluster. Startup checks topology and refuses unsupported standalone deployments; there is no unsafe fallback. Local standalone MongoDB users must initialize a local replica set. Tests did this only in fresh disposable directories.
- Upgrade/drain all backend instances together before resuming reset traffic. Old instances do not enforce versions and would accept old JWTs. Plan cutover/rollback accordingly; rolling back the middleware weakens revocation.
- Every authenticated request now needs a primary user-version lookup. Test capacity/latency in staging. This intentionally fails closed during DB outages.
- Previously verified in-flight reset sessions may retain the earlier original expiry and require a fresh code. New sessions have matching application and TTL deadlines. No old reset documents were changed or deleted by a migration.
- Verification allows five total atomic submissions; a successful code submission also consumes an attempt. The existing global API rate limiter and password-hashing cost remain intact.

## Configuration and secret protection

- Root `.gitignore` excludes environment files and their backups recursively, key material, dependency/build outputs and the existing uploads directory; safe `.env.example` templates remain includable. `.dockerignore` excludes environment/key material from future build contexts. Files were not deleted or untracked automatically.
- Actual tracked-secret status is **unknown**: both Git repository discovery and tracked-file queries failed because this workspace has no usable Git metadata. Ignore behavior was tested in a separate temporary Git fixture. The owner must inspect the actual repository/history and published artifacts, and assess rotation where exposure is established. Ignore rules do not fix already-tracked secrets.
- `server/.env.example` and `client/.env.example` are blank owner-supplied templates; no real URLs, origins or credentials were invented.
- Production startup requires MONGO_URI/JWT_SECRET plus explicit exact HTTPS CORS_ORIGINS and complete SMTP configuration; signing secrets must be at least 32 bytes. Local development retains its existing origin list and optional explicit additional origins. Production gets only its configured origins, with no implicit localhost/LAN exceptions. CORS denial is a 403; missing-Origin service requests still require authentication on private routes.
- Frontend builds require an explicit API base ending in /api, without credential/query/fragment/trailing-slash components. HTTPS is enforced except explicit HTTP loopback URLs for local production previews. Dev serving retains existing HTTP development support. Actual `.env` files were not edited.
- SMTP still uses the configured transport. STARTTLS is now required if implicit TLS is disabled; no certificate-validation bypass or provider credential change was added.

Exact required/optional variables, rollout requirements, hosting/cache rules and owner actions are documented in [deployment configuration](../project/deployment.md).

## Liveness/readiness

`GET /api/health` retains the existing liveness body/status. New `GET /api/ready` checks connected state and pings the required MongoDB dependency with a bounded timeout. Success returns 200; disconnected/failed-ping states return generic 503 without topology, credentials or database diagnostics. Both are no-store and excluded from the public API rate budget.

Startup validates environment, waits for DB connection and checks transaction topology before listening. Connection failures expose only fixed safe messages. Other API routes retain their existing limiter. No broad proxy, cookie or session redesign was introduced.

## Changed files and reasons

| File | Purpose |
|---|---|
| server/controllers/passwordResetController.js | Atomic lifecycle, matching deadlines, one-use codes, atomic attempt budget, response/log safety, no-store |
| server/models/User.js | Additive authVersion field |
| server/services/authService.js | Issue version-bearing JWTs while preserving response shape/hash behavior |
| server/middleware/authMiddleware.js | Version revocation, primary lookup, claim validation and DB-unavailable handling |
| server/routes/authRoutes.js | No-store headers for auth responses |
| server/services/emailService.js | Require encrypted SMTP transport |
| server/config/runtime.js | Required-value validation and strict production CORS configuration |
| server/controllers/healthController.js | Liveness/readiness handlers |
| server/app.js | Wire configured CORS and health/readiness without changing other route paths |
| server/config/db.js, server/server.js | Safe awaited startup and transaction-capability requirement |
| client/vite.config.js | Reject insecure/malformed release API configuration, retain explicit loopback preview |
| .gitignore, .dockerignore | Secret/artifact exclusions |
| server/.env.example, client/.env.example | Blank configuration templates |
| server/tests/releaseReadiness.test.cjs | Replace unsafe-behavior characterizations with real HTTP/disposable MongoDB regression coverage |
| server/tests/runtime.test.cjs | Production origins/config, ignore patterns, encrypted-mail configuration, startup capability/redaction tests |
| server/package.json | Replace placeholder backend test command with the real local suite |
| docs/project/deployment.md | Exact owner-supplied settings and compatibility/release procedure |
| docs/audits/release-readiness.md | Mark old audit as historical and link here; preserve original evidence |
| docs/audits/release-blocker-fixes.md, release-blocker-fixes-evidence.json | Current implementation/validation report |

No Roadmap content, registration, coverage manifest, IDs, completion keys, progress ownership or frontend UI pages changed. No dependencies were added. The existing Dockerfile/compose/CI placeholders were not converted into fictional provider-specific deployment files.

## Validation results

### Real local HTTP + disposable database; mail stubbed

`npm --prefix server test`: **13 tests passed, 0 failed, 0 skipped**, including the parent integration test. The test starts a fresh loopback mongod replica set in a generated temporary directory, connects explicitly without loading .env, uses real Express routes/Mongoose transactions/bcrypt/JWT, and stubs only mail delivery. It removes only its own temporary data at teardown. Local test runtime was Node 24.20.0; mongod must be installed for DB coverage (the test explicitly skips if absent).

Passed normal registration/sign-in; existing missing-field/versionless-JWT compatibility; forged/expired/missing-token rejection; identical recovery public responses under normal/unknown/SMTP-failure/storage-failure paths; cleanup and sanitized errors; five-attempt cap under 12 concurrent bad submissions; expired code/token deadlines; one successful concurrent code verification; TTL index/deadline agreement; exactly one successful concurrent reset; sequential reuse rejection; old-password rejection/new-password sign-in; pre-reset and legacy JWT rejection after reset; failed-password-write rollback and retry; DB-disconnected and connected-but-failed-ping readiness; healthy liveness during DB failure; auth fail-closed 503; local allowed origin/unlisted-origin denial; production CORS validation; environment validation; isolated Git ignore patterns; TLS configuration; startup topology checks.

This is **real local database-backed validation**, not mocked model snapshots. SMTP/provider delivery, real user records and configured database connectivity were not used. Startup/mail configuration tests use isolated dependency stubs; they do not contact any provider.

Initial failures were investigated: the existing registration validator rejected the fixture `.test` TLD, so a reserved example.com fixture address was used without changing validation; a rollback assertion initially selected an older retained used-reset record and was corrected to query the current token hash. Neither was bypassed by weakening application security.

### Existing regression suite and browser

- All career-roadmap test files: **95 tests: 93 passed, 0 failed, 2 skipped**. Skips remain missing PyTorch/TensorFlow dependencies, covering 10 and 9 runtime reference checks. The catalog still has 2,571 exercises across all 285 topics with compatible IDs/keys.
- Existing Chrome UI audit against the compiled loopback preview: **passed** all 16 standard sidebar routes, 1440/768/390px checks, Settings behavior, Notes/Resources/Practice and mobile keyboard navigation. Zero unexpected runtime/console/Vite errors. APIs/auth state in this UI audit are fixtures; it is separate from real HTTP/DB security tests and does not claim real SMTP or browser-driven backend reset.
- Root test scripts/general empty test placeholders are not counted as meaningful extra passing suites. Backend now has a real npm test command; no provider CI was deployed.

### Production build and intentional gate failure

- `npm --prefix client run build` using the unchanged current local environment: **blocked as intended** because its configured API uses non-loopback HTTP. This remains an owner configuration task, not a silently replaced URL.
- Production build with a reserved test HTTPS API origin: **passed** to `/tmp/career-security-https-build`. This verifies compilation only, not that the example domain is a real service or a supplied deployment target.
- Production build with explicit loopback HTTP API for local preview: **passed**. Entry about 287.72 kB, Roadmap about 2,465.97 kB; existing >500 kB Roadmap warning remains. No bundle/catalog refactor or warning suppression was performed.

## Remaining release blockers and next actions

1. Owner must supply actual HTTPS API/target frontend origins, production runtime secrets, SMTP sender/provider configuration and transaction-capable DB/network policy; set NODE_ENV=production on deployed staging. Existing environment files were preserved and are not assumed production-ready.
2. Review actual Git history/artifacts for secret exposure and perform any necessary rotation under owner control. Local source export cannot establish tracked/exposed status.
3. Perform authorized staging reset-email delivery to a dedicated mailbox, new-password login, old-session rejection, TTL/transaction/index behavior and rollout verification. No real email is authorized or sent in this change.
4. Confirm all backend instances enforce authVersion, measure primary lookup load and test real ingress/CORS/HTTPS/readiness behavior. Deploying to a standalone database or mixing old auth instances is unsupported.
5. SMTP remains inline: status/body leaks are fixed, but timing is not constant. Dedicated per-account/IP send budgets, durable background delivery/operational alerts, and concurrent new-challenge request policy need further hardening before a high-assurance public release. The original global limiter was preserved.
6. Actual hosting/CI/container configuration, TLS/security headers, trusted proxy policy, SPA rewrites, HTML/hashed-asset caching, old-chunk retention/rollback and external integrations remain unverified and provider-specific.
7. The large Roadmap payload and prior multi-tab progress/concurrency limitations remain outside this security pass. No production deployment, history rewrite, real-account reset or data migration was performed.
