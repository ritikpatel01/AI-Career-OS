# Owner-supplied release configuration

No deployment provider, domain, credential, or actual environment-file value is supplied by this document. The implementation and local validation are recorded in [release blocker fixes](../audits/release-blocker-fixes.md). Production deployment remains a separate authorized action.

## Environment values

Use the actual environment's protected secret/configuration store. `.env.example` files are blank templates, not operational configuration. Existing local `.env` files were not changed.

| Variable | Owner must supply | Enforcement |
|---|---|---|
| `NODE_ENV` | `production` for deployed staging/release backends; development locally | Activates strict production checks; do not deploy using development defaults |
| `PORT` | Platform-assigned backend listening port, or selected local port | Defaults to 5000 when absent |
| `MONGO_URI` | Actual authenticated MongoDB replica-set or sharded-cluster URI, with target-specific TLS/network policy and least-privilege credentials | Startup connects and checks transaction-capable topology; no standalone non-atomic fallback |
| `JWT_SECRET` | Protected high-entropy signing secret; at least 32 bytes in production | Required at startup; retain current value for compatible rollout unless a separately planned rotation is needed |
| `CORS_ORIGINS` | Comma-separated exact HTTPS frontend origins (scheme + host + optional port), without paths, wildcards or credentials | Required in production; production has no implicit localhost/LAN allowances. Development retains its existing origins and may add explicit ones |
| `MAIL_HOST` | Configured SMTP provider hostname | Required at production startup |
| `MAIL_PORT` | Provider-prescribed integer port | Required/validated in production |
| `MAIL_SECURE` | Literal `true` for implicit TLS, or `false` for provider-supported STARTTLS | STARTTLS is required when implicit TLS is off; certificate verification is not disabled |
| `MAIL_USER`, `MAIL_PASS` | Actual SMTP identity and credential authorized for the target environment | Required in production; never put these in frontend variables |
| `MAIL_FROM` | Provider-authorized sender address | Required in production; owner must verify sender permissions and delivery |
| `VITE_API_URL` | Actual HTTPS API base ending in `/api`, without trailing slash, credentials, query or fragment | Frontend build-time setting. Rebuild when changing it. Explicit HTTP loopback URLs are permitted for local preview only; non-loopback HTTP builds are rejected |

Optional feature configuration, only where actually enabled: `OPENAI_API_KEY`, `GROQ_API_KEY`, `GROQ_MODEL`, `GITHUB_TOKEN`; interview evaluator `OLLAMA_URL`, `OLLAMA_MODEL`, `OLLAMA_TIMEOUT_MS`; standalone integration configurations `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `REDIS_URL`. The presence of integration config files does not certify those features or make Redis a required dependency of the current HTTP application. Validate enabled integrations separately; do not create provider accounts or invent credentials to fill blanks.

No variable prefixed `VITE_` is a safe place for a secret. Its value can appear in public client assets. Root ignore rules exclude environment files/backups and dependency/build outputs; `.dockerignore` excludes environment/key material from a future container build context. Ignore rules cannot erase already-tracked files/history or published artifacts. This workspace has no usable Git metadata; the owner must inspect the actual repository/history before signoff and assess rotation if exposure is confirmed.

## Compatibility and rollout

- The additive `User.authVersion` field defaults to zero. Existing documents lacking it remain compatible; no backfill or migration was executed. Old JWTs without `ver` remain valid only while the account's version is zero. Successful reset increments the version in the same transaction as the password write and reset consumption. New login/registration JWTs carry `ver`.
- Every authenticated request now performs a primary user-version lookup. Missing/deleted users or mismatched versions get 401; database unavailability fails closed with 503. Budget and measure the added lookup in staging.
- Upgrade all backend instances together, or drain reset/auth traffic during cutover. Old backend instances would continue accepting old JWTs. Do not enable password-reset traffic on a mixed old/new pool and claim revocation works everywhere. Removing this enforcement in a rollback weakens post-reset revocation; plan that separately.
- MongoDB transactions are mandatory. Standalone local MongoDB must be initialized as a replica set; production needs a replica set or sharded deployment with permitted transactions. Startup rejects unsupported topology instead of partially changing a password. Never disable transaction checks to make a rollout pass.
- The existing TTL index remains on `PasswordReset.expiresAt`; no index was dropped, replaced or migrated. A newly verified code gets a single fresh ten-minute deadline used by `expiresAt` and `resetTokenExpiresAt`. Old in-flight sessions may retain an earlier original deadline and need a fresh code. Expiry is checked by the application even if TTL cleanup is delayed.
- Code submission uses at most five atomic attempts (including a successful submission). A verified code cannot mint another token. The global API limiter and bcrypt cost 12 remain; dedicated mailbox/IP budgets and durable delivery scheduling are follow-up hardening.

## Run and verify

- Backend: install locked dependencies, provide the values above, then `npm --prefix server start`. Startup validates configuration and waits for database connection/capability before listening. It does not automatically modify existing users or reset records.
- Frontend: `npm --prefix client run build` requires a secure API configuration. The existing local non-loopback HTTP environment is intentionally blocked. Set an explicit loopback URL only for a local test preview, not a deployed frontend. Do not ship stale dist assets after a failed build.
- `GET /api/health` is liveness and retains its existing 200 response. `GET /api/ready` pings MongoDB, returns 200 only on success and 503 on failure/disconnection; responses expose no database details. Probes bypass the API abuse budget and return no-store headers. Configure the target's startup/readiness/liveness probes accordingly.
- Local tests: `npm --prefix server test` requires `mongod` on PATH for real disposable replica-set coverage. It never loads `.env`; SMTP is stubbed. Roadmap suite: `node --test --test-isolation=none --test-reporter=spec client/src/data/careerRoadmaps/*.test.js`.

## Owner must configure/test outside this code change

- Actual HTTPS frontend/API domains, TLS termination, redirects, trusted ingress/IP handling, and exact production CORS settings. No blanket trust-proxy or wildcard CORS exception was introduced.
- SPA fallback for app routes, real 404 for missing hashed assets, no-cache/revalidated HTML, long immutable caching for existing hashed assets, no shared caching of authenticated/auth/recovery responses, atomic asset/HTML releases and old-chunk retention/rollback.
- Target-specific CI/deployment/container definitions. Current placeholder Dockerfile/compose/workflows were not converted into an invented deployment configuration.
- Authorized staging email delivery to a dedicated mailbox, code verification, password update and new sign-in, old-password/JWT rejection, concurrency, DB index/TTL and backup/restore, failure alerts and sanitized edge/APM logs. Recovery remains code-based; no email-link feature was introduced.
- Request response/status normalization does not make SMTP timing constant. SMTP still runs inline; evaluate durable queueing/timing exposure and targeted send budgets before a high-assurance public release. No actual provider was contacted during implementation.
