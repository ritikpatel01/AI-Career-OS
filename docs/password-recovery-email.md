# Password recovery email delivery

## Findings and limits

The frontend uses `API_BASE_URL` from `client/src/services/api.js`: Vite's build-time `VITE_API_URL`, with a localhost fallback only when it is absent. The inspected local client environment points to a remote API. No configured hostname or secret is reproduced here. This means local server code or SMTP settings do not automatically affect password recovery initiated by that frontend. Restarting/rebuilding the frontend and deploying the API are separate operations; neither was performed.

The controller returns the same generic success body for an unknown account, provider failure and account-dependent storage failure. This is intentional account-enumeration protection, not proof of email delivery. The service previously used SMTP defaults and had no per-delivery configuration validation. Its controller discarded provider diagnostic metadata. These are confirmed diagnostic/configuration weaknesses; the actual remote delivery failure is **not confirmed** without remote logs and configuration verification.

The repository includes `server/config/runtime.js` production startup validation, blank `.env.example` templates and `docs/project/deployment.md`. Root Docker/compose placeholders do not identify an operational remote API deployment or provide access to its environment/logs. Do not assume backup/extracted project directories describe the running deployment.

## Required environment names

`MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`.

Supply all values in the backend's protected configuration, not frontend variables. `MAIL_FROM` must be a bare mailbox address (no display name, brackets or line breaks); the service supplies the display name separately. Configure a sender authorized by the current provider, including sender/domain verification when required. Use credentials authorized for SMTP, not an invented password or an unrelated frontend login password.

Follow the current provider's transport settings. Implicit TLS uses `MAIL_SECURE=true`; STARTTLS uses `false` and remains mandatory. Certificates are verified. Transport creation is lazy and cached; missing/invalid settings fail before delivery without falling back to Gmail or localhost. Production startup also retains its existing configuration guard. After changing backend configuration, restart the backend through the existing deployment procedure so cached transport settings are refreshed.

## Safe diagnostics

`password_recovery_failure` records contain stage (`delivery`, `cleanup`, or `request`), allowlisted error name/code, allowlisted SMTP command, numeric SMTP error status and configuration field **names** where present. Raw messages, provider responses, stack traces, recipients, credentials, codes and tokens are deliberately excluded. Logging errors cannot stop cleanup or alter the public response.

- `ECONFIG`: check the listed MAIL variable names and required formats.
- `EAUTH`, often SMTP 535: check the backend SMTP identity/credential and provider authentication policy.
- Connection/DNS/socket/timeout codes: inspect provider reachability, backend egress restrictions, host, port and TLS mode.
- `EENVELOPE` or SMTP 550/553: inspect sender authorization, recipient rejection and provider restrictions in the provider's protected dashboard.
- SMTP 4xx: temporary provider-side failure; consult protected provider logs before retrying.
- `UNKNOWN`: classification was not allowlisted; use provider-side diagnostics. Do not expand logs to include unrestricted provider text.

Delivery failure deletes the specific newly created reset request. Cleanup failures are diagnosed safely and the public response remains generic. If the database cannot perform cleanup, the hashed request may remain until its existing expiration; no claim of guaranteed deletion during database failure is made. Existing hashing, 10-minute expiry, attempt reservation, token handling, authentication and rate limits remain unchanged.

Public response equivalence does not mean constant execution time: existing inline SMTP work and account lookup have timing differences. This patch adds no account-dependent public errors, transport retries or queueing architecture. Durable delivery/timing mitigation remains a release review item.

## Manual remote follow-up

1. Identify the API actually used by the running frontend (Vite build environment / Network request destination); do not share credentials or tokens.
2. Apply these server changes through an explicitly authorized remote release. Nothing here deploys them automatically.
3. Check that server's MAIL settings and provider-authorized sender. Review sanitized failure records and the provider dashboard. No real environment files were modified here.
4. With explicit authorization and a dedicated test account/mailbox, request a code, confirm receipt (including spam filtering), verify it, reset the password and check old/new login and session behavior. Mock success or SMTP acceptance alone does not verify inbox delivery.

No real provider was contacted or real mail sent during this implementation. Real delivery, remote rollout, production build validation and remaining production/security checks are still required.

## Local validation results

- `passwordRecoveryDelivery.test.cjs`, `runtime.test.cjs`, `releaseReadiness.test.cjs`: **19 tests passed**, including eight release subtests using real loopback HTTP/auth/Mongoose against a disposable local MongoDB replica set with SMTP mocked. The initial sandbox run could not bind loopback (`EPERM`); the authorized escalated rerun passed. Temporary test database/process cleanup completed.
- `errorPrivacy.test.cjs`: **8 tests passed**.
- The five delivery regression tests passed again after strengthening cleanup-stage/unknown-account assertions.
- Changed JavaScript syntax checks and `git diff --check` passed.
- No real emails, provider authentication tests, remote requests, production data writes, environment edits, dependency changes, builds, pushes or deployments were performed. Local tests demonstrate code behavior, not remote SMTP delivery.
