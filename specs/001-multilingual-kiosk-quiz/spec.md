# Feature Specification: Multilingual Touchscreen Quiz Kiosk App

**Feature Branch**: `001-multilingual-kiosk-quiz`  
**Created**: 2026-02-27  
**Status**: Draft  
**Input**: User description: "Create a complete functional + technical specification for a kiosk-friendly, multilingual touchscreen quiz app deployed in Docker with persistent results, export, leaderboard, and youth-oriented UX."

## Clarifications

### Session 2026-02-27

- Q: On kiosk/browser refresh during an in-progress quiz session, should we resume or restart? -> A: Resume only within a short timeout window; otherwise restart.
- Q: What should be the default export protection mode for production? -> A: No protection on any page; exports are public.
- Q: How should leaderboard scope be defined for kiosk display? -> A: Per-event leaderboard with manual reset.
- Q: How long should completed session data be retained in SQLite before cleanup? -> A: Keep forever (no automatic cleanup).
- Q: What observability level should be mandatory for MVP operations? -> A: Structured logs plus core metrics.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start Quiz in Preferred Language (Priority: P1)

A trade fair visitor starts the quiz on a touchscreen, selects French, German, or
English, optionally enters a nickname, and answers questions one by one using large
touch buttons with visible progress.

**Why this priority**: This is the core booth journey and minimum value path.

**Independent Test**: Fully test by launching kiosk flow from welcome screen through all
question screens in each language and verifying progress + answer capture.

**Acceptance Scenarios**:

1. **Given** the app is idle on the welcome screen, **When** the visitor taps a language,
   **Then** the UI switches to that language for all next screens.
2. **Given** nickname input is shown, **When** the visitor skips nickname, **Then** quiz
   starts without blocking and uses anonymous session id.
3. **Given** a quiz question screen, **When** the visitor selects answer(s) and submits,
   **Then** the system stores the selection and advances to explanation.

---

### User Story 2 - Understand Results and Replay (Priority: P1)

After each answer, the visitor sees friendly feedback with the correct answer and
explanation. At the end, they see a congratulations screen with score, percentage,
leaderboard, and a restart button.

**Why this priority**: Educational value and engagement depend on immediate feedback and
clear completion.

**Independent Test**: Run a full quiz with mixed correct/incorrect answers and verify
explanation screens, final breakdown, leaderboard display, and restart path.

**Acceptance Scenarios**:

1. **Given** an answer is submitted, **When** it is evaluated, **Then** explanation screen
   shows correctness status, correct answer(s), and explanation text.
2. **Given** final question is completed, **When** scoring is calculated, **Then** final
   screen shows congratulations, score, percentage, and leaderboard rank context.
3. **Given** final screen is visible, **When** visitor taps restart, **Then** a new session
   starts from language selector with prior session preserved in storage.

---

### User Story 3 - Operate Reliably at Booth (Priority: P2)

Booth staff can deploy the app on own infrastructure using Docker, Portainer, and
Traefik, and retrieve results via public CSV export (with optional XLSX).

**Why this priority**: Event operations and reporting require simple deployment and
recoverable data.

**Independent Test**: Deploy via Docker Compose with persistent volume, restart
container, verify data retention, then download CSV export from a public endpoint.

**Acceptance Scenarios**:

1. **Given** the app is deployed with persistent volume, **When** container restarts,
   **Then** all completed session records and leaderboard data remain available.
2. **Given** export endpoint is called from kiosk or local browser, **When** request is
   processed, **Then** CSV file is downloaded without authentication prompt.
3. **Given** XLSX export is not enabled, **When** XLSX endpoint is called, **Then**
   system returns an explicit "not enabled" response.

---

### User Story 4 - Maintain Content from Word Source (Priority: P2)

Content editors can convert questions from the provided Word document into structured
multilingual quiz content including single/multi-choice answers and optional images.

**Why this priority**: Content refresh must be repeatable without code-level edits.

**Independent Test**: Convert sample Word-derived content to JSON, seed database on first
run, and verify all questions/explanations/images appear correctly in app.

**Acceptance Scenarios**:

1. **Given** a Word-based question set is transformed to JSON, **When** seed runs on empty
   database, **Then** questions are inserted with language strings, answers, and metadata.
2. **Given** a question lacks DE/EN translation, **When** runtime loads localized text,
   **Then** app falls back to French text for missing fields.

---

### Edge Cases

- Missing or partial translation for a field: system falls back to FR for that field only.
- Multi-choice question submitted with too few/too many selected answers: system applies
  multi-choice scoring rules and always shows explanation.
- Optional image missing or broken link: question remains playable without layout break.
- Session interrupted (browser refresh/kiosk relaunch): resume from last unanswered question
  only if last activity is within timeout window (default 120 seconds); otherwise mark prior
  session abandoned and start a new session.
- Event reset action triggered accidentally: system requires explicit on-kiosk confirmation
  (long-press + confirm) before applying leaderboard reset.
- Export endpoint called repeatedly by public users: system may throttle requests to protect
  service responsiveness.
- Internet drops but server remains reachable on local network: app continues functioning.
- Database file locked/corrupted at startup: app returns health failure and logs a clear
  operational error for staff.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a welcome screen with language selector offering exactly
  French (FR), German (DE), and English (EN).
- **FR-002**: System MUST provide optional nickname entry after language selection and MUST
  allow skipping nickname without blocking quiz start.
- **FR-003**: System MUST present one question per screen with large touch-friendly answer
  controls and a visible progress indicator.
- **FR-004**: System MUST support both single-choice and multi-choice questions.
- **FR-005**: System MUST display explanation screen after each answer showing correctness,
  correct answer(s), and friendly explanation text.
- **FR-006**: System MUST end every completed session on a congratulations screen showing:
  total score, percentage score, leaderboard/highscore view, and restart action.
- **FR-007**: System MUST store question content model with:
  `id`, `topic_tag`, `image_key_or_prompt` (optional), localized `question`,
  localized `choices`, localized `explanation`, and `correct_answers`.
- **FR-008**: System MUST support content ingestion from Word-derived source data transformed
  into structured JSON used by seed/import flow.
- **FR-009**: System MUST store per session:
  session start/end timestamps, selected language, optional nickname, per-question answers,
  correctness result, per-question duration, total duration, total score, percentage.
- **FR-010**: System MUST persist session and leaderboard data across container restarts.
- **FR-011**: System MUST provide downloadable CSV export endpoint for results data.
- **FR-012**: System SHOULD provide XLSX export endpoint with equivalent dataset.
- **FR-013**: System MUST keep all pages and endpoints publicly accessible with no
  authentication or authorization gates.
- **FR-014**: System MUST provide scoring rules:
  - Single-choice: full points if exactly correct, otherwise zero.
  - Multi-choice: score based on correctly selected minus incorrectly selected options,
    never below zero, capped at full points.
- **FR-015**: System MUST show anti-frustration feedback for wrong answers using positive
  language and educational explanation.
- **FR-016**: System MUST expose leaderboard sorted by score descending with deterministic
  tie-breaker based on completion timestamp and total duration.
- **FR-026**: Leaderboard displayed on kiosk MUST be scoped to the current event and support
  manual reset through a kiosk maintenance control using explicit confirmation gesture
  (long-press + confirm), without authentication.
- **FR-027**: Session and answer records MUST be retained indefinitely by default, with no
  automatic purge job.
- **FR-028**: System MUST provide structured operational logs and core metrics including
  request latency, quiz session start/completion counts, export download count, and database
  error count.
- **FR-017**: System MUST run as frontend SPA + backend API with SQLite persistence.
- **FR-018**: System MUST be deployable in Docker and compatible with Portainer and Traefik
  host-based routing.
- **FR-019**: System MUST provide language resource strategy for FR/DE/EN and fallback to FR
  when translations are missing.
- **FR-020**: Translation guidance MUST preserve meaning and use simple youth-friendly wording
  for explanations.
- **FR-021**: System MUST provide kiosk accessibility baseline:
  large fonts, high contrast, touch-safe spacing, and no hover-only interactions.
- **FR-022**: System MUST continue normal operation if internet connectivity is lost while
  server remains reachable from kiosk.
- **FR-023**: System MUST define repo deliverables including repo structure, build/run
  instructions, Dockerfile template, docker-compose template, and first-run seed script.
- **FR-024**: Seed process MUST load questions JSON into SQLite on first run and MUST be
  idempotent on subsequent runs.
- **FR-025**: On browser refresh/reload, system MUST resume an in-progress session only if
  last activity is within a configurable timeout window (default 120 seconds); otherwise it
  MUST mark prior session abandoned and start a new session.

### Technical Specification Addendum

- **TS-001 API Capability Surface (minimum)**:
  - Service health/status endpoint.
  - Quiz session start endpoint with language parameter.
  - Answer submission endpoint per session and question.
  - Explanation retrieval endpoint after answer evaluation.
  - Final result endpoint (score, percentage, summary).
  - Leaderboard retrieval endpoint.
  - Public results export endpoints for CSV (mandatory) and XLSX (optional).
- **TS-002 Data Storage**:
  - SQLite database file stored on mounted Docker volume.
  - Tables: `questions`, `question_translations`, `sessions`, `session_answers`.
- **TS-003 Traefik Routing (host-based)**:
  - Example host rule: `Host(quiz.sst.local)` for application service.
  - Reverse proxy TLS termination handled by Traefik.
- **TS-004 Docker Runtime**:
  - Single container image publishable to Docker Hub.
  - Runtime env vars include DB path, app base URL, and log level.
- **TS-005 Deliverables (minimum files)**:
  - `README.md` with setup/build/run and troubleshooting.
  - `Dockerfile`
  - `docker-compose.yml` including named volume for SQLite.
  - `scripts/seed-questions.(js|ts|py)` first-run seed utility.
  - `data/questions.seed.json` generated from Word document content workflow.
- **TS-006 Observability Baseline**:
  - Structured JSON logs for backend request/response and error events.
  - Metrics endpoint or internal metrics collector for core counters and latency.
- **TS-007 Kiosk Maintenance Controls**:
  - Expose a leaderboard reset action intended for on-kiosk maintenance UI flow.
  - Reset action MUST require explicit confirmation gesture and MUST be logged.

### Assumptions

- Public quiz is anonymous; no account system is needed.
- Optional nickname is display-only and can be empty.
- No page-level authentication is required.
- Data retention is indefinite unless operator performs explicit manual archival/deletion.
- Hostname and TLS certificate management are provided by existing Traefik setup.
- Word content is converted externally into agreed JSON schema before import/seed.

### Constitution Alignment *(mandatory)*

- **CA-001**: Start flow mandates language selector with FR/DE/EN before quiz begins.
- **CA-002**: End-state mandates congratulations screen, score breakdown, and leaderboard.
- **CA-003**: Persistence and export are mandatory; CSV is required and XLSX is optional.
- **CA-004**: Data minimization enforced: anonymous session id + optional nickname only.
- **CA-005**: Operational constraints enforced: Docker container, own server, Portainer +
  Traefik compatibility, Docker Hub image publication.

### Key Entities *(include if feature involves data)*

- **Question**: Canonical quiz item with `question_id`, `topic_tag`, answer mode
  (`single` or `multiple`), optional `image_key_or_prompt`, and set of valid answer options.
- **QuestionTranslation**: Localized text bundle per question and language, including prompt,
  choices, and explanation. Missing field fallback target is FR.
- **QuizSession**: Anonymous play session with `session_id`, selected language, optional
  nickname, started/completed timestamps, total score, percentage, and total duration.
- **QuizAnswer**: Per-question response record linked to session with selected options,
  correctness outcome, awarded points, and answer duration.
- **LeaderboardEntry**: Derived ranking view from completed sessions using score and tie-break
  rules for deterministic ordering.
- **ExportAudit**: Log of export actions (timestamp, endpoint, success/failure),
  without personal data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 95% of visitors can start a quiz in their chosen language and submit
  first answer within 30 seconds.
- **SC-002**: At least 90% of completed sessions reach final congratulations screen without
  staff assistance.
- **SC-003**: 100% of completed sessions remain available after container restart during
  operational verification.
- **SC-004**: CSV export endpoint returns complete and parseable dataset for 100% of sessions
  in validation runs.
- **SC-005**: Multi-choice scoring results match expected rule outcomes in 100% of defined
  scoring test cases.
- **SC-006**: Accessibility verification confirms all interactive controls meet touch-target
  and contrast requirements on kiosk hardware.
- **SC-007**: Event reset action updates displayed leaderboard scope within 5 seconds and
  does not delete historical session data used for exports.
- **SC-008**: Operations dashboard/log review can verify core metrics and structured logs for
  100% of validation test sessions.
