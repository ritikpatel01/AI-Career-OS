# Interview evaluation: local and production

## Traced request and confirmed defect

`Interview.jsx` submits selected role/category/topic, normalized difficulty, question, concept/mistake arrays and candidate answer to `${API_BASE_URL}/interviews/answer`, with the existing bearer token. `API_BASE_URL` comes from Vite's build-time `VITE_API_URL` (localhost fallback only if absent). Express mounts `interviewRoutes` at `/api/interviews`; `/answer` retains authentication and Joi payload validation. `submitAnswer` calls `submitInterviewAnswer`, which evaluates first, then creates an owner-scoped Interview record with the resulting dimensions, feedback and score. Questions/preparation retrieval is separate from evaluation, so displaying questions does not establish evaluator availability.

Previously `ai-engine/interview/evaluator.js` called only Ollama's generate API, defaulting to `http://127.0.0.1:11434/api/generate`, model `qwen3:4b`. The inspected local backend had no OLLAMA override. Loopback on Render points to that deployed service/container, not a developer's laptop. This local-only dependency and the controller's generic error masking are confirmed code defects. The exact deployed error (connection, credentials, model, quota, etc.) cannot be independently confirmed: Render logs/environment were not available. No assumption is made that the local environment matches Render.

The local backend has GROQ_API_KEY and GROQ_MODEL entries and already uses Groq for Document AI. Their values are not reproduced. A read-only request to Groq's model listing timed out, so credential validity, model availability and JSON support for that configured model remain unverified. No answer or generation request was sent to a live provider.

## Minimal transport change

The new `ai-engine/interview/provider.js` supports `groq` and `ollama` without adding dependencies. It uses the existing axios dependency. Its hosted request follows [Groq's Chat Completions API](https://console.groq.com/docs/api-reference) and [JSON object mode](https://console.groq.com/docs/structured-outputs). An actual model ID is required from configuration; no hosted model name or credential is invented.

- With no explicit provider, production selects Groq; development selects local Ollama. Set the provider explicitly on Render.
- Groq uses GROQ_API_KEY and INTERVIEW_AI_MODEL, falling back to the existing GROQ_MODEL only for the model ID. Missing settings fail with a safe 503; there is no production loopback fallback.
- Ollama retains the development loopback/model defaults. Production Ollama requires INTERVIEW_AI_PROVIDER=ollama and an explicitly configured remote HTTPS generate endpoint. Optional OLLAMA_API_KEY is sent as a bearer credential. URL-embedded credentials, queries/fragments and redirects are rejected; certificate checks are not disabled. Use a provider-authorized/protected endpoint, not a public unauthenticated model server.
- Each request has a bounded timeout (Groq default 45000ms; Ollama default 90000ms). Overrides must be integers from 1000 through 120000. The browser aborts at 130000ms, after the maximum evaluator deadline. No automatic retries or silent cross-provider fallbacks.
- Both transports request up to 512 output tokens; Ollama context is 8192 tokens rather than the previous 1024, reducing rubric/answer truncation. Explicit truncation, missing content, malformed JSON or invalid dimensions fail; they do not produce fabricated fallback evaluations.
- Existing normalization, evidence reconciliation, five scoring dimensions/weights, deterministic nonsense handling and persistence order remain intact. Typed provider errors pass through evaluation to the controller. Raw provider exceptions, request payloads, answers, keys, response bodies and model output are not logged. Structured failure logs contain only an allowlisted code.
- The UI now describes rubric-based AI evaluation rather than claiming all deployments run local Qwen3. No questions, routes, auth, API URL, schema, saved scores or configuration files with real values were modified.

## Backend variables (names only)

Hosted configuration: NODE_ENV, INTERVIEW_AI_PROVIDER, GROQ_API_KEY, INTERVIEW_AI_MODEL (or GROQ_MODEL).

Optional deadline: INTERVIEW_AI_TIMEOUT_MS.

Local/remote Ollama: INTERVIEW_AI_PROVIDER, OLLAMA_URL, OLLAMA_MODEL, OLLAMA_TIMEOUT_MS; optional OLLAMA_API_KEY. The shared deadline takes precedence over OLLAMA_TIMEOUT_MS. Blank optional deadlines use defaults.

Frontend: VITE_API_URL. On Vercel it must be the intended HTTPS Render API base ending in `/api`, without a trailing slash. It is baked into the build; local edits do not change an existing Vercel build. Never put provider secrets in VITE variables.

## Safe failure responses

- `INTERVIEW_AI_CONFIG`: 503, missing/invalid evaluator settings.
- `INTERVIEW_AI_AUTH`: 503, provider authentication/authorization failure.
- `INTERVIEW_AI_MODEL`: 503, provider rejected the configured model or request (400/404/422 are deliberately grouped; status alone does not prove the model is missing).
- `INTERVIEW_AI_LIMIT`: 503, provider rate limit or quota response.
- `INTERVIEW_AI_TIMEOUT`: 504, deadline/provider timeout; no completed evaluation is saved by this failed provider call.
- `INTERVIEW_AI_UNAVAILABLE`: 503, network or upstream availability error.
- `INTERVIEW_AI_RESPONSE`: 502, incomplete/invalid model result.

Unexpected server/database errors retain the generic 500 message. No internal provider text or credential is returned. The client surfaces the safe API message.

## Manual deployment requirements

No deployment, push, environment edit or external service modification was performed. To enable the hosted fix on Render, the owner must set NODE_ENV to production, INTERVIEW_AI_PROVIDER to groq, supply GROQ_API_KEY and an available JSON-capable model through INTERVIEW_AI_MODEL/GROQ_MODEL, then authorize a normal backend deployment. Alternatively configure the protected remote HTTPS Ollama endpoint explicitly. Ensure the normal build installs the existing dependencies and includes both server and ai-engine files; those are separate sibling directories in this repository.

Confirm Vercel's HTTPS VITE_API_URL points to the intended Render backend and rebuild through the normal validated process if changing it. The local client environment currently references a remote HTTP API; `npm --prefix client run build` was attempted and correctly failed its existing HTTPS/API URL guard. The guard was not bypassed and the environment was not changed.

After rollout, test with a dedicated account and synthetic interview answer, inspect the safe failure code if needed, verify the returned dimensions/score and saved history, and check provider model access/quota. Neither mock success nor a question list certifies production evaluation. Native device/browser verification and outstanding functional/security/build/deployment checks remain release blockers.

## Validation performed

- `node --test --test-isolation=none --test-concurrency=1 --test-reporter=spec server/tests/interviewEvaluation.test.cjs server/tests/interviewPreparation.test.cjs server/tests/errorPrivacy.test.cjs`: 27 passed.
- `node --test --test-isolation=none --test-reporter=spec client/src/pages/Interview/InterviewPreparation.test.js`: 3 passed.
- New coverage includes transport selection/configuration, hosted JSON requests, local/remote Ollama, timeout/auth/model/quota/network failures, malformed/incomplete responses, score calculation, no persistence on failure, unchanged success envelope and authenticated frontend payload/error handling. AI and database dependencies are mocked; scores in tests come from the unchanged evaluator applied to fixture provider output.
- Interview JSX compilation, changed backend JavaScript syntax and `git diff --check` passed. Source comparison against the original evaluator confirmed SCORE_WEIGHTS, DIMENSIONS, calculateScore, normalizeAIResult, reconcileEvaluation and buildPrompt unchanged. An initial subprocess-based Git comparison hit a sandbox restriction; a direct read-only Git export/file comparison succeeded.
- Production build attempted and failed at the existing API URL validation, as described above. No bypass or environment override used.
- The read-only live model-list check timed out. No live generation, deployed answer submission, Render-log access, database write or browser workflow verification was performed. The underlying local-only dependency is fixed in source, but production operation requires configured model access and authorized deployment/testing.
