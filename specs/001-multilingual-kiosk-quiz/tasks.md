# Tasks: Multilingual Touchscreen Quiz Kiosk App

**Input**: Design documents from `C:\DATA\GitHub\quiz-msss-forum-sst\specs\001-multilingual-kiosk-quiz\`  
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md  
**Tests**: Tests are required by constitution quality gates (unit, integration, and end-to-end for critical kiosk flows).  
**Organization**: Tasks are grouped by user story for independent implementation and verification.

## Format: `[ID] [P?] [Story] Description`

- `[P]`: Task can be run in parallel (different files, no blocking dependency).
- `[Story]`: Story label (`[US1]`, `[US2]`, `[US3]`, `[US4]`) for story-phase tasks.
- Every task includes an exact file path.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize project structure and toolchain.

- [ ] T001 Create repository structure per plan in `backend/`, `frontend/`, `shared/`, `infra/`, `scripts/`, `data/`, `tests/`
- [ ] T002 Initialize backend TypeScript project and scripts in `backend/package.json`, `backend/tsconfig.json`
- [ ] T003 [P] Initialize frontend Vite React TypeScript app in `frontend/package.json`, `frontend/vite.config.ts`, `frontend/tsconfig.json`
- [ ] T004 [P] Initialize shared contracts/types package in `shared/package.json`, `shared/types/index.ts`
- [ ] T005 Configure linting/formatting in `.eslintrc.cjs`, `.prettierrc`, `backend/.eslintrc.cjs`, `frontend/.eslintrc.cjs`
- [ ] T006 Configure test runners in `backend/vitest.config.ts`, `frontend/vitest.config.ts`, `frontend/playwright.config.ts`
- [ ] T007 Add root scripts/workspace config in `package.json` and `pnpm-workspace.yaml` (or equivalent workspace manifest)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core platform capabilities required before any user story work.

**Critical**: Complete this phase before story implementation.

- [ ] T008 Implement environment configuration loader in `backend/src/config/env.ts`
- [ ] T009 Implement Fastify app bootstrap and health endpoint in `backend/src/app.ts`, `backend/src/api/health.ts`
- [ ] T010 Setup SQLite connection and migration runner in `backend/src/db/client.ts`, `backend/src/db/migrate.ts`
- [ ] T011 Create baseline DB schema migration in `backend/src/db/migrations/001_initial.sql`
- [ ] T012 Define shared API/data types in `shared/types/api.ts`, `shared/types/domain.ts`
- [ ] T013 Implement structured logger and metrics scaffolding in `backend/src/observability/logger.ts`, `backend/src/observability/metrics.ts`
- [ ] T014 Implement i18n bootstrap and FR fallback helpers in `backend/src/i18n/fallback.ts`, `frontend/src/i18n/index.ts`
- [ ] T015 Implement scoring engine module in `backend/src/scoring/score.ts`
- [ ] T016 Implement export throttling middleware in `backend/src/api/middleware/rate-limit.ts`
- [ ] T017 Add Docker and Traefik baseline files in `infra/docker/Dockerfile`, `infra/compose/docker-compose.yml`, `infra/traefik/dynamic-example.yml`

**Checkpoint**: Foundation complete; story work can proceed.

---

## Phase 3: User Story 1 - Start Quiz in Preferred Language (Priority: P1) 🎯 MVP

**Goal**: Visitors can start in FR/DE/EN, optionally set nickname, and answer one question per screen with touch-friendly UX.

**Independent Test**: Complete one full start-to-question flow in each language with progress tracking and persisted in-progress session.

### Tests for User Story 1

- [ ] T018 [P] [US1] Add contract test for `POST /api/sessions` in `backend/tests/contract/sessions-start.contract.test.ts`
- [ ] T019 [P] [US1] Add integration test for `GET /api/sessions/{sessionId}/question` in `backend/tests/integration/questions-next.integration.test.ts`
- [ ] T020 [P] [US1] Add e2e test for language select + nickname skip + first answer in `frontend/tests/e2e/start-flow.spec.ts`

### Implementation for User Story 1

- [ ] T021 [P] [US1] Implement question and translation repositories in `backend/src/repositories/question-repository.ts`
- [ ] T022 [US1] Implement session start and resume-timeout logic in `backend/src/services/session-service.ts`
- [ ] T023 [US1] Implement sessions start/next-question routes in `backend/src/api/sessions.ts`
- [ ] T024 [P] [US1] Build welcome and language selector page in `frontend/src/pages/WelcomePage.tsx`
- [ ] T025 [P] [US1] Build optional nickname page in `frontend/src/pages/NicknamePage.tsx`
- [ ] T026 [US1] Build question screen with large touch targets and progress indicator in `frontend/src/pages/QuestionPage.tsx`
- [ ] T027 [US1] Add frontend API client for session start/question retrieval in `frontend/src/services/api/sessionClient.ts`
- [ ] T028 [US1] Implement in-progress session persistence and refresh resume window in `frontend/src/features/session/sessionStore.ts`

**Checkpoint**: US1 independently functional and testable.

---

## Phase 4: User Story 2 - Understand Results and Replay (Priority: P1)

**Goal**: Visitors receive explanation feedback, final score breakdown, per-event leaderboard, and restart flow.

**Independent Test**: Complete quiz with mixed answers and verify explanation, final scoring, leaderboard display, and restart behavior.

### Tests for User Story 2

- [ ] T029 [P] [US2] Add unit tests for single/multi scoring in `backend/tests/unit/scoring.unit.test.ts`
- [ ] T030 [P] [US2] Add integration test for answer -> explanation -> result in `backend/tests/integration/result-flow.integration.test.ts`
- [ ] T031 [P] [US2] Add e2e test for final screen + restart in `frontend/tests/e2e/final-screen.spec.ts`

### Implementation for User Story 2

- [ ] T032 [US2] Implement answer evaluation and duration tracking service in `backend/src/services/answer-service.ts`
- [ ] T033 [US2] Implement answer and result endpoints in `backend/src/api/answers.ts`, `backend/src/api/results.ts`
- [ ] T034 [US2] Implement leaderboard ranking service with deterministic tie-breaks in `backend/src/services/leaderboard-service.ts`
- [ ] T035 [US2] Implement per-event leaderboard reset route with long-press confirmation workflow in `backend/src/api/leaderboard-maintenance.ts`
- [ ] T036 [P] [US2] Build explanation screen with friendly feedback in `frontend/src/pages/ExplanationPage.tsx`
- [ ] T037 [P] [US2] Build final congratulations/score screen with restart in `frontend/src/pages/FinalPage.tsx`
- [ ] T038 [US2] Build leaderboard component and long-press confirm reset control in `frontend/src/components/LeaderboardPanel.tsx`

**Checkpoint**: US1 + US2 functional and independently testable.

---

## Phase 5: User Story 3 - Operate Reliably at Booth (Priority: P2)

**Goal**: System runs reliably in Docker/Traefik with persistent data and public export endpoints (CSV mandatory, XLSX optional).

**Independent Test**: Restart container and verify data persistence; validate CSV export access and throttling; validate XLSX optional behavior.

### Tests for User Story 3

- [ ] T039 [P] [US3] Add integration test for SQLite persistence across restart simulation in `backend/tests/integration/persistence-restart.integration.test.ts`
- [ ] T040 [P] [US3] Add contract test for public CSV export and 429 throttling in `backend/tests/contract/export-csv.contract.test.ts`
- [ ] T041 [P] [US3] Add contract test for XLSX optional response (200/501) in `backend/tests/contract/export-xlsx.contract.test.ts`

### Implementation for User Story 3

- [ ] T042 [US3] Implement CSV export service and route in `backend/src/services/export-csv-service.ts`, `backend/src/api/exports.ts`
- [ ] T043 [US3] Implement optional XLSX export feature flag in `backend/src/services/export-xlsx-service.ts`
- [ ] T044 [US3] Implement export audit persistence with rate-limit outcome in `backend/src/repositories/export-audit-repository.ts`
- [ ] T045 [US3] Wire export throttling middleware into export routes in `backend/src/api/exports.ts`
- [ ] T046 [US3] Finalize production container/runtime config in `infra/docker/Dockerfile`, `infra/compose/docker-compose.yml`
- [ ] T047 [US3] Add Traefik host-based routing examples in `infra/traefik/dynamic-example.yml` and `README.md`
- [ ] T048 [US3] Add operational metrics for exports and DB errors in `backend/src/observability/metrics.ts`

**Checkpoint**: US3 operational requirements are satisfied and testable.

---

## Phase 6: User Story 4 - Maintain Content from Word Source (Priority: P2)

**Goal**: Content editors can transform Word-derived data into JSON and seed questions idempotently with localization fallback.

**Independent Test**: Import sample seed data, rerun seed, and confirm no duplicates plus FR fallback for missing DE/EN fields.

### Tests for User Story 4

- [ ] T049 [P] [US4] Add unit test for seed idempotency in `backend/tests/unit/seed-idempotency.unit.test.ts`
- [ ] T050 [P] [US4] Add integration test for translation fallback behavior in `backend/tests/integration/i18n-fallback.integration.test.ts`

### Implementation for User Story 4

- [ ] T051 [US4] Implement Word-derived JSON validation schema in `scripts/seed-schema.ts`
- [ ] T052 [US4] Implement idempotent seed script in `scripts/seed-questions.ts`
- [ ] T053 [US4] Add sample seed dataset in `data/questions.seed.json`
- [ ] T054 [US4] Implement backend FR fallback for question/explanation fields in `backend/src/services/question-localization-service.ts`
- [ ] T055 [US4] Implement frontend fallback rendering for missing localized fields in `frontend/src/i18n/fallback.ts`
- [ ] T056 [US4] Add optional image rendering with graceful fallback in `frontend/src/components/QuestionImage.tsx`
- [ ] T057 [US4] Document Word-to-JSON conversion guidance in `docs/content-import.md`

**Checkpoint**: US4 content pipeline works and is repeatable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening and release readiness across all stories.

- [ ] T058 [P] Add security headers and input validation review updates in `backend/src/api/middleware/security.ts`
- [ ] T059 [P] Add kiosk visual polish (contrast, spacing, motion tuning) in `frontend/src/styles/kiosk.css`
- [ ] T060 Update runbook and deployment docs in `README.md` and `specs/001-multilingual-kiosk-quiz/quickstart.md`
- [ ] T061 Execute full automated test suite and fix regressions in `backend/tests/` and `frontend/tests/`
- [ ] T062 Run manual kiosk validation checklist and capture report in `specs/001-multilingual-kiosk-quiz/validation-report.md`
- [ ] T063 [P] Run dependency audit and document remediation decisions in `specs/001-multilingual-kiosk-quiz/dependency-audit.md`
- [ ] T064 [P] Measure question transition performance and validate p95 <300ms in `tests/performance/question-transition.perf.ts` and `specs/001-multilingual-kiosk-quiz/performance-report.md`
- [ ] T065 [P] Measure warm startup time and validate <3s target in `scripts/measure-startup.ts` and `specs/001-multilingual-kiosk-quiz/performance-report.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 (Setup): starts immediately.
- Phase 2 (Foundational): depends on Phase 1 and blocks all story phases.
- Phase 3 (US1): depends on Phase 2.
- Phase 4 (US2): depends on Phase 3 for shared session/question flow.
- Phase 5 (US3): depends on Phase 2; can run parallel with Phase 4 after foundational completion.
- Phase 6 (US4): depends on Phase 2; can run parallel with Phases 4-5.
- Phase 7 (Polish): depends on completion of selected story phases.

### User Story Dependencies

- US1: no dependency on other stories after foundation.
- US2: depends on US1 session/question mechanics.
- US3: independent from US2 business flow; depends on foundation and shared API baseline.
- US4: independent from US2/US3; depends on data model and foundational DB scaffolding.
- Phase 7 performance and dependency-audit tasks (T063-T065) depend on implementation completeness.

### Within Each User Story

- Write tests first for that story and ensure they fail before implementation.
- Implement backend/domain logic before wiring UI integration.
- Complete story checkpoint before marking story done.

### Parallel Opportunities

- Setup: T003, T004, T005, T006 can run in parallel after T001-T002.
- Foundational: T013, T014, T015, T016, T017 can run in parallel after T008-T012.
- US1: T018/T019/T020 and T024/T025 can run in parallel.
- US2: T029/T030/T031 and T036/T037 can run in parallel.
- US3: T039/T040/T041 and T046/T047 can run in parallel.
- US4: T049/T050 and T054/T055/T056 can run in parallel.
- Phase 7: T063, T064, T065 can run in parallel after end-to-end feature completion.

---

## Parallel Example: User Story 1

```bash
# Tests in parallel
Task: "T018 [US1] contract test in backend/tests/contract/sessions-start.contract.test.ts"
Task: "T019 [US1] integration test in backend/tests/integration/questions-next.integration.test.ts"
Task: "T020 [US1] e2e test in frontend/tests/e2e/start-flow.spec.ts"

# UI pieces in parallel
Task: "T024 [US1] welcome page in frontend/src/pages/WelcomePage.tsx"
Task: "T025 [US1] nickname page in frontend/src/pages/NicknamePage.tsx"
```

## Parallel Example: User Story 3

```bash
# Export and ops tests in parallel
Task: "T039 [US3] persistence integration test in backend/tests/integration/persistence-restart.integration.test.ts"
Task: "T040 [US3] CSV export contract test in backend/tests/contract/export-csv.contract.test.ts"
Task: "T041 [US3] XLSX contract test in backend/tests/contract/export-xlsx.contract.test.ts"

# Infra updates in parallel
Task: "T046 [US3] Docker updates in infra/docker/Dockerfile and infra/compose/docker-compose.yml"
Task: "T047 [US3] Traefik routing in infra/traefik/dynamic-example.yml"
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1 and Phase 2.
2. Deliver Phase 3 (US1).
3. Validate language selector, nickname skip, question progression, and resume timeout behavior.
4. Demo as first kiosk MVP.

### Incremental Delivery

1. Add US2 for educational feedback and leaderboard UX.
2. Add US3 for deployment reliability and public export operations.
3. Add US4 for content operations and repeatable seeding.
4. Finish with Phase 7 hardening and release checks.

### Parallel Team Strategy

1. Team completes Setup + Foundational together.
2. Then split:
   - Developer A: US2 flow/UI
   - Developer B: US3 export/ops
   - Developer C: US4 seed/i18n pipeline
3. Integrate and run Phase 7 validation.

---

## Notes

- All tasks follow required checklist format with IDs, optional parallel marker, and story labels where required.
- Paths align with planned repository structure in `plan.md`.
- Public-access decision is reflected (no auth tasks; throttling tasks included).
