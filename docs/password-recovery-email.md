# Password recovery email — Resend HTTPS

## Transport and preserved behavior

Recovery email now uses Node's built-in `fetch` to call `POST https://api.resend.com/emails` over HTTPS, following [Resend's Send Email API](https://resend.com/docs/api-reference/emails/send-email). No SDK/dependency installation is needed. Use the project's supported modern Node runtime (Node 22+ recommended). There is no SMTP connection, no Nodemailer transport and no SMTP fallback. Render Free's blocked SMTP ports no longer affect this request; no Render plan upgrade is needed.

The existing `sendPasswordResetCode(email, code)` contract, subject, text/HTML template and ten-minute expiry wording remain. Routes/controllers, account lookup, random code generation, hashing, expiry, attempt limits, reset tokens, password changes and rate limiting are unchanged. A failed provider request propagates to the controller; its existing cleanup deletes the new failed reset challenge. Cleanup failure handling remains intact. Unknown accounts and failures retain the same generic public response to avoid account enumeration. That public response does not prove that mail was sent.

The HTTPS request has a 20-second abort deadline covering the request and response body, with timer cleanup and redirects rejected. HTTP authentication failures, rejected sender/recipient/validation requests, rate limits and provider failures are errors. Malformed JSON, missing/empty IDs and error-shaped success bodies are also errors. No automatic retry or fabricated delivery result. A valid Resend acceptance ID indicates API acceptance, not inbox delivery; delayed delivery, suppression and bounces must be checked in Resend.

## Exact required email environment variables

| Server variable | Configure |
| --- | --- |
| `RESEND_API_KEY` | A Resend API key with sending permission for the chosen domain. Set in Render backend Environment, not Vercel/client configuration. |
| `MAIL_FROM` | A **bare mailbox address on an owned domain verified in the same Resend account**. Do not include display names, brackets, whitespace or line breaks. The service supplies the `AI Career OS` display name. |

There are no additional required email variables. `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER` and `MAIL_PASS` are no longer used or required by production startup. Old SMTP values can be removed manually from Render after the approved migration; real `.env` files were not edited here. Preserve existing unrelated backend variables such as database/auth/CORS/provider configuration.

A personal Gmail address is not a sender domain you own and cannot serve as an arbitrary verified Resend sender. Add an owned domain/subdomain in Resend, install its required DNS records and wait for verification. Use the provider's displayed DNS values rather than invented records. [Resend domain requirements](https://resend.com/docs/dashboard/domains/introduction) explain verification and sender addresses. Any Resend onboarding/test-domain restrictions still apply; use an owned verified domain for production reset recipients.

No key, sender value, credentials, addresses, verification codes or reset tokens are copied into source, frontend code or logs. `.env.example` contains names/placeholders only. Production startup validates RESEND_API_KEY and MAIL_FROM instead of requiring obsolete SMTP settings. Development also validates them on send; there is no fake-mail fallback.

## Render configuration and manual test steps

These steps are for the owner after authorizing a normal code rollout; nothing was committed, pushed or deployed automatically.

1. Create/select the Resend account and verified sending domain. Create a sending-authorized API key for that domain.
2. In **Render backend → Environment**, set RESEND_API_KEY and MAIL_FROM. Do not place the key in Vercel or a VITE variable. Keep the backend on Free.
3. Apply an authorized deployment of these code changes. Configure both required values before production startup validation runs. Merely changing environment values does not turn an older SMTP implementation into Resend.
4. Optional local configuration check from the backend's working directory: `node scripts/verifyMailConnection.js` (or `node server/scripts/verifyMailConnection.js` from the repository root). The legacy filename remains, but this is now **configuration-only**: it sends no network request or email and returns `networkChecked:false,emailSent:false`. Exit 0 means the local variable formats pass; it does not prove API-key validity/domain authorization. Render Free has no shell access, so do not depend on running it there.
5. Use a dedicated, registered test account in the actual frontend. Request a reset once. Check Resend's protected dashboard for acceptance/delivery/failure and check the mailbox/spam folder. Do not share or log the code. Unknown accounts intentionally do not generate mail.
6. Enter the code, reset the password and confirm expected old/new password and session behavior. Confirm wrong/expired/reused codes fail. Do not change real user passwords for testing.

## Safe diagnostics

If new production requests still log `ESOCKET` with `command: CONN`, check the Render deployment's commit and branch. The Resend implementation below cannot emit that SMTP command; updating environment variables alone does not replace the committed SMTP code. Commit and push the migration files listed at the end of this document, then confirm Render deployed that commit. Check timestamps to exclude historical logs. No deployment is performed by the local diagnostic.

The existing `password_recovery_failure` record retains safe stage/error metadata. Resend errors include allowlisted codes and numeric `httpStatus` only; provider bodies/messages are never logged or returned to clients.

- `ECONFIG`: missing/invalid RESEND_API_KEY or MAIL_FROM; only variable names are logged.
- `EMAIL_AUTH` / 401: invalid or unauthorized API credential.
- `EMAIL_REJECTED` / 4xx other than 401/429: sender/domain/key permission, recipient/testing or validation restrictions; inspect Resend's protected dashboard. HTTP status alone does not identify a unique cause.
- `EMAIL_RATE_LIMIT` / 429: provider throttling/quota; resolve in Resend before retrying.
- `EMAIL_PROVIDER` / 5xx: upstream provider error.
- `EMAIL_RESPONSE`: invalid/incomplete acceptance response.
- `ETIMEDOUT`: request exceeded the 20-second deadline. Delivery may be ambiguous if the upstream accepted it before the timeout; the controller still invalidates that failed challenge.
- `ECONNECTION`: network/TLS/request failure; no raw exception/URL/header dump.

Old allowlisted SMTP metadata remains recognizable for historical diagnostics but is not emitted by the Resend transport. Logging cannot interrupt controller cleanup. The operator script is not exposed as an HTTP endpoint. No unauthenticated provider-debug route exists.

Inline provider work is not constant-time across account states. Public response equivalence and current rate limits are preserved; a durable queue/timing mitigation remains a separate security/release design decision.

## Verification

Tests mock HTTPS responses; they do not send real email or contact Resend. Coverage includes request URL/auth/sender/template, missing configuration and SMTP-only configuration, non-2xx rejection, malformed acceptance, connection/timeout (including slow body), safe logs, generic public responses, unknown accounts, failed-request cleanup and cleanup failures. Existing release-readiness tests exercise code expiry/attempt caps/one-use, reset/session behavior with a disposable local MongoDB replica set and mocked delivery.

Real Resend credentials, domain verification, acceptance/inbox delivery and production rollout remain unverified until the owner performs the manual steps. No Render plan/environment changes, live emails, commits, pushes or deployments were performed by this migration.

Final local checks: `node --test --test-isolation=none --test-concurrency=1 --test-reporter=spec server/tests/passwordRecoveryDelivery.test.cjs server/tests/runtime.test.cjs server/tests/releaseReadiness.test.cjs server/tests/errorPrivacy.test.cjs` completed with **33 passed, 0 failed, 0 skipped**. Changed JavaScript syntax checks and `git diff --check` passed. A source comparison confirmed the existing HTML template is unchanged. All API/mail responses were mocked; no live emails were sent.

Files changed by this migration: `server/services/emailService.js`, `server/config/runtime.js`, `server/utils/mailDiagnostics.js`, `server/scripts/verifyMailConnection.js`, `server/tests/passwordRecoveryDelivery.test.cjs`, `server/tests/runtime.test.cjs`, `server/.env.example`, `docs/password-recovery-email.md`, `docs/project/deployment.md`. The pre-existing SMTP diagnostics work was adapted rather than discarded. Existing real `.env` files, routes/controllers/models, frontend and dependencies remain unchanged.
