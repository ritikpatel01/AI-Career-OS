# Roadmap Practice final audit

Audit date: 2026-10-24. Audited the current local frontend/backend and configured MongoDB. This report records verified coverage and behavior; it is not an exhaustive correctness proof or a production-readiness certification.

## Coverage

The actual roadmap contains **4 careers, 34 phases, 285 topics, and 2,571 published exercises**. All 285 topics meet at least 3 Easy, 3 Medium, and 3 Hard exercises. There are **no incomplete topics**. Existing extra exercises were preserved.

| Career | Phases | Topics | Easy | Medium | Hard | Total |
|---|---:|---:|---:|---:|---:|---:|
| Full Stack Developer | 15 | 161 | 484 | 485 | 486 | 1455 |
| Frontend Developer | 6 | 43 | 129 | 129 | 129 | 387 |
| Backend Developer | 6 | 39 | 117 | 117 | 117 | 351 |
| AI Engineer | 7 | 42 | 126 | 126 | 126 | 378 |

[All 285 topic counts](roadmap-practice-topics.csv) · [Machine-readable catalog summary](roadmap-practice-catalog.json)

| Career | Phase | Topics | Easy | Medium | Hard | Total |
|---|---|---:|---:|---:|---:|---:|
| Full Stack Developer | Web Fundamentals | 8 | 24 | 25 | 26 | 75 |
| Full Stack Developer | HTML & CSS | 10 | 30 | 30 | 30 | 90 |
| Full Stack Developer | JavaScript | 15 | 46 | 46 | 45 | 137 |
| Full Stack Developer | React.js | 12 | 36 | 36 | 36 | 108 |
| Full Stack Developer | Backend Development | 14 | 42 | 42 | 42 | 126 |
| Full Stack Developer | Databases | 12 | 36 | 36 | 36 | 108 |
| Full Stack Developer | Authentication & Security | 10 | 30 | 30 | 30 | 90 |
| Full Stack Developer | Testing | 8 | 24 | 24 | 24 | 72 |
| Full Stack Developer | DevOps & Deployment | 11 | 33 | 33 | 33 | 99 |
| Full Stack Developer | Web Security | 9 | 27 | 27 | 27 | 81 |
| Full Stack Developer | System Design | 10 | 30 | 30 | 30 | 90 |
| Full Stack Developer | Real-World Projects | 9 | 27 | 27 | 28 | 82 |
| Full Stack Developer | DSA | 13 | 39 | 39 | 39 | 117 |
| Full Stack Developer | Interview Preparation | 10 | 30 | 30 | 30 | 90 |
| Full Stack Developer | Job Preparation | 10 | 30 | 30 | 30 | 90 |
| Frontend Developer | Web Fundamentals | 5 | 15 | 15 | 15 | 45 |
| Frontend Developer | HTML & CSS | 8 | 24 | 24 | 24 | 72 |
| Frontend Developer | JavaScript | 9 | 27 | 27 | 27 | 81 |
| Frontend Developer | React | 8 | 24 | 24 | 24 | 72 |
| Frontend Developer | Advanced Frontend | 7 | 21 | 21 | 21 | 63 |
| Frontend Developer | Projects & Interview | 6 | 18 | 18 | 18 | 54 |
| Backend Developer | Programming | 5 | 15 | 15 | 15 | 45 |
| Backend Developer | Node.js | 6 | 18 | 18 | 18 | 54 |
| Backend Developer | Express.js | 7 | 21 | 21 | 21 | 63 |
| Backend Developer | Databases | 7 | 21 | 21 | 21 | 63 |
| Backend Developer | Authentication & Security | 7 | 21 | 21 | 21 | 63 |
| Backend Developer | Deployment & System Design | 7 | 21 | 21 | 21 | 63 |
| AI Engineer | Python | 6 | 18 | 18 | 18 | 54 |
| AI Engineer | Machine Learning | 6 | 18 | 18 | 18 | 54 |
| AI Engineer | Deep Learning | 6 | 18 | 18 | 18 | 54 |
| AI Engineer | LLM Engineering | 6 | 18 | 18 | 18 | 54 |
| AI Engineer | RAG | 6 | 18 | 18 | 18 | 54 |
| AI Engineer | AI Agents | 6 | 18 | 18 | 18 | 54 |
| AI Engineer | AI Applications | 6 | 18 | 18 | 18 | 54 |

## Findings and narrow corrections

- Corrected the `rag-retrieval-evaluation-v1` top-1 hit-rate example to 0: neither query retrieves its expected source in the first result. The worked function already returned 0. Clarified the other example’s absent third label and added a regression case executing the existing solution. Exercise ID and completion key remain unchanged.
- Removed duplicate Full Stack HTML & CSS / JavaScript manifest entries that overrode valid Full Stack metadata with Frontend topic lists. The resulting metadata matches the actual 10 HTML & CSS and 15 JavaScript topics, with the existing Full Stack batch IDs. No exercise arrays, associations, or completion-key generation changed.
- Regenerated the existing coverage manifest. Counts remain unchanged. Added independent raw-registration and manifest-agreement regression tests.

## Catalog and compatibility checks

- Independently enumerated original exercises, registered practice batches, and the frozen original lesson-guided practice source used by the UI. Compared actual IDs per topic against both generated and checked-in coverage.
- No orphan career/phase/topic registrations, conflicting supplied associations, duplicate exercise IDs, missing required rubric fields, or invalid difficulty coverage were found by the structural checks.
- All 2,571 scoped completion keys are unique; there are also zero raw key collisions across careers. Six legacy outline aliases remain available. Key generation and roadmap topic order were not edited.
- Completion keys remain within the API’s 180-character limit. The largest career has 1,455 keys, below the current 2,000-key payload limit. Existing unknown legacy keys remain hydrated and retained; only registered exercise keys contribute to displayed practice counts.
- Automated filters exercise each topic/difficulty, completed and not-started states, every exercise title, and empty search. Existing tests cover selection reconciliation, optional-field normalization, malformed optional content, rendering assumptions, legacy aliases, and user-specific progress hydration. Learning-content tests also verify that all 285 topics resolve to lessons.
- Structural required-field checks cannot establish that every explanation and solution is substantively correct. Runtime checks and the corrected RAG example provide additional evidence; 316 records carry reference checks, rather than every catalog entry having an executable solution.

## Real authenticated persistence and database verification

Used only two dedicated audit accounts. Registration used the existing auth API; browser login used the normal application login form. Tested the current local API at port 5000 and current frontend with a temporary API-origin override against the configured MongoDB. No auth bypass, production-user edits, credential output, or existing-data deletion was used. Dedicated audit accounts and their test progress are retained.

| Scenario | Actual result |
|---|---|
| Normal browser login and completion save | Passed; real authenticated PUT responses 200 |
| Refresh | Saved completion restored |
| Navigate to Skills and return | Completion retained |
| Sign out through Dashboard and sign in again | Completion restored |
| Three sequential repeated updates | 200 responses; one progress record and unique saved keys |
| Unauthenticated write | Real API rejected with 401 |
| Other dedicated user reads/updates owner record | Real API rejected both with 404 |
| Other dedicated user lists records | Owner record absent |
| Failed save and UI rollback | Real validation response 400; optimistic completion reverted |
| Direct configured MongoDB read | Correct dedicated owner; one progress record, one unique completed key; rejected completion absent; other audit user has no progress record |

The failure-path test altered one dedicated save request to contain an invalid title, causing the actual backend validator to return 400. Its response was not mocked. Browser runtime exception collection was empty. These results cover sequential updates, not simultaneous multi-tab edits.

## Automated tests and production build

- Focused new integrity suite: **3 passed**. The focused RAG regression also passed.
- All career-roadmap test files: `node --test --test-isolation=none --test-reporter=spec client/src/data/careerRoadmaps/*.test.js`: **95 tests, 93 passed, 0 failed, 2 skipped**.
- Skips: PyTorch and TensorFlow are unavailable; 10 PyTorch and 9 TensorFlow reference solutions were not runtime-executed. NumPy and the available Python/ML/JavaScript/SQL/local HTTP checks ran successfully. No live LLM provider or cloud/vector-store integration was exercised.
- Existing root/server npm test commands are placeholders, and 11 files under the general unit/integration/AI test directories are empty. They provide no additional verification and were not counted as passing meaningful backend suites.
- Existing coverage generator passed and produced no coverage gaps.
- `npm run build` in `client`: **passed**, 443 modules. Existing Vite large-chunk warning remains: main JS approximately 3,303 kB (1,041 kB gzip); CSS approximately 533 kB (81 kB gzip). Static loading of the large practice catalog contributes to the bundle. No unrelated lazy-loading refactor or warning suppression was introduced.

## Browser catalog sweep with mocked API

Headless Chrome tested all 4 careers and all 34 phases against the actual frontend catalog: 2,571 rendered catalog entries counted across phases and 102 representative exercise selections (first, middle, last per phase). Difficulty, topic, completion, and search filters, empty states, reset, navigation away/back, sidebar/page visibility, and a deliberately malformed optional-field record all passed. There were zero browser runtime exceptions. Optional-field mutation existed only in the isolated browser’s in-memory test fixture and was restored.

This broad sweep used an explicit fixture user/token and mocked API responses; it does **not** prove authentication or persistence. Those were verified separately against the real API/database as described above. The initial sweep navigation assertion incorrectly required a Practice-only header after returning to Topics; correcting the test assertion resolved the failure without an application change.

## Remaining limits

- Source inspection shows no uniqueness constraint for per-user/career progress creation, and updates replace a full snapshot. Simultaneous first saves or concurrent tabs were not tested; duplicate creation or last-writer-wins changes remain possible. No migration, index change, or existing-data cleanup was attempted.
- Tested the local current application with the configured database, not the deployed remote frontend/backend release. Controlled validation failure was tested; network outages, token expiry during saves, load, multi-browser concurrency, and every external provider were not exhaustively tested.
- Git diff/status could not be used because the workspace is not recognized as a Git repository. Current file contents and tests were inspected directly. No claim of a verified Git baseline is made.
- No runtime UI/backend code, exercise IDs, completion-key logic, unrelated phases, or existing user progress was changed by this resumed audit.

## Follow-up checks

To close the dependency skips, install compatible PyTorch and TensorFlow packages in the test Python environment and rerun `node --test --test-isolation=none --test-reporter=spec client/src/data/careerRoadmaps/roadmapPracticeAIDeepLearning.test.js`. To assess concurrent-update behavior, use dedicated accounts in two tabs, perform simultaneous first saves and conflicting updates, then inspect record counts and retained keys. Do not add a unique index or remove duplicate records without a separate migration review. These checks are follow-up work, not passed results.

## Files changed or added

- `client/src/data/careerRoadmaps/roadmapLearningContent.js` — narrow RAG example/test-data correction.
- `client/src/data/careerRoadmaps/roadmapPracticeBatches.js` — remove duplicate stale Full Stack manifest overrides.
- `client/src/data/careerRoadmaps/roadmapPracticeIntegrity.test.js` — new catalog, coverage, and RAG regression checks.
- `client/src/data/careerRoadmaps/roadmapPracticeCoverage.json` — regenerated coverage timestamp; exercise counts unchanged.
- `docs/audits/roadmap-practice-audit.md`, `roadmap-practice-catalog.json`, `roadmap-practice-topics.csv` — audit results.
