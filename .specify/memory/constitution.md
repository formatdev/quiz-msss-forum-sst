<!--
Sync Impact Report
- Version change: 1.1.0 -> 2.0.0
- Modified principles:
  - III. Durable Results and Portable Data: updated export access policy to public access by default
  - V. Simplicity, Security, and Maintainability: redefined security baseline to no authentication by design, with throttling and hardening controls
- Added sections:
  - Technical Standards > Public Access Policy
- Removed sections:
  - Delivery Workflow and Quality Gates > Phase 2 item requiring admin-protected export trigger
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md (no change required)
  - ✅ .specify/templates/spec-template.md (no change required)
  - ✅ .specify/templates/tasks-template.md (no change required)
  - ⚠ pending: .specify/templates/commands/*.md (directory missing)
- Follow-up TODOs:
  - TODO(COMMAND_TEMPLATES_DIR): create .specify/templates/commands/ if command templates are adopted later
-->

# Quiz MSSS Forum SST Constitution

**Role Charter**: Act as a senior full-stack engineer and solution architect, favoring concrete, step-by-step delivery decisions over abstract design.

## Core Principles

### I. Kiosk-First Audience Experience (Non-Negotiable)
- Rationale: public booth usage requires fast, intuitive, low-friction interaction for children and youngsters.
- The product MUST optimize for a public touchscreen kiosk flow used by children and youngsters at a trade fair booth.
- The first screen MUST be a language selector with exactly French, German, and English.
- Every question screen MUST prioritize large touch targets, clear progress, and low reading friction.
- The final flow MUST always end with a congratulations page that shows score and leaderboard/highscore.
- Visual design MUST be playful and gamified while staying readable and fast on commodity kiosk hardware.

### II. Deployment Reality Over Theory
- Rationale: deployment must fit existing operations with minimal custom infrastructure.
- The application MUST run on our own server in a Docker container.
- The deployment model MUST be compatible with Portainer and Traefik reverse proxy.
- Builds MUST produce a Docker image suitable for publication to Docker Hub.
- Configuration MUST be environment-driven (`.env` or container environment variables), with no hardcoded secrets.

### III. Durable Results and Portable Data
- Rationale: trade fair outcomes must remain available for reporting and repeatable scoring verification.
- Quiz results MUST persist across container restarts via mounted storage or external database.
- The system MUST support CSV export of results; XLSX export SHOULD be provided behind a feature flag.
- Export endpoints MUST be publicly accessible by default (no authentication or authorization gate).
- Results schema MUST support anonymous session id and optional nickname only; no personal data collection is allowed.
- Leaderboard logic MUST be deterministic and reproducible from persisted results.

### IV. Content-Driven Quiz Engine
- Rationale: non-developer stakeholders must be able to maintain content from the source document.
- Quiz content source of truth is the provided Word document (questions, choices, correct answers, explanations).
- The implementation MUST support single-answer and multiple-answer questions.
- Each question MAY include an optional image and explanation shown after answer submission or at review step.
- Content import/update workflow MUST be documented and repeatable by non-developers.

### V. Simplicity, Security, and Maintainability
- Rationale: booth software must stay stable, supportable, and safe with a small operational footprint.
- Prefer a lightweight, maintainable web stack; avoid heavy enterprise architecture.
- All user input MUST be validated server-side; output MUST be safely encoded in UI.
- Use secure defaults consistent with public-access policy: HTTPS behind Traefik, non-root container user, pinned dependencies, and basic rate limiting on result submission and export endpoints.
- Authentication/authorization layers are out of scope unless explicitly reintroduced by a future constitution amendment.
- Logging MUST avoid personal data and include only operational and anonymous gameplay events needed for support.

## Technical Standards

### Required Baseline
- Project type: single deployable web app (frontend + API), kiosk-optimized.
- Default storage: SQLite file on persistent Docker volume unless a managed DB is explicitly requested.
- API contracts: versioned HTTP JSON API for quiz flow, leaderboard, and export.
- Export formats: `text/csv` required; `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` optional.

### Public Access Policy
- All pages and endpoints are publicly accessible by default.
- Public access MUST be paired with operational safeguards: throttling, robust input validation, and abuse-aware logging.
- If access control is required later, constitution amendment is mandatory before spec/plan updates.

### User Flow Contract
1. Language selection (FR/DE/EN).
2. Nickname optional prompt.
3. Quiz playthrough with per-question validation.
4. Score calculation and congratulations page.
5. Leaderboard display.
6. Optional retry/new session action.

### Data Contract (Minimum)
- `quiz_sessions`: session id, language, started_at, completed_at, score, max_score, nickname (nullable).
- `quiz_answers`: session id, question id, selected choices, correctness, answered_at.
- `leaderboard_view`: derived ranking by score and completion timestamp tie-breaker.

## Delivery Workflow and Quality Gates

### Phase 0: Setup
1. Define architecture and folder layout.
2. Add Dockerfile + docker-compose for local parity with production constraints.
3. Add health endpoint and Traefik-compatible routing labels/examples.

### Phase 1: Core Product
1. Implement language selector and localized UI strings.
2. Implement question engine with single and multiple answer handling.
3. Implement persistence and leaderboard.
4. Implement congratulations page with score + ranking.

### Phase 2: Operations and Content
1. Implement CSV export endpoint with public access and throttling safeguards.
2. Add optional XLSX export.
3. Add Word-to-content ingestion workflow and verification checklist.
4. Add kiosk hardening options (fullscreen mode guidance, inactivity reset timer).

### Mandatory Quality Gates (Before Release)
- Unit tests for scoring, multi-answer correctness, and ranking tie-breaks.
- Integration tests for full flow: language selection to leaderboard.
- Persistence verification across container restart.
- Export validation for CSV format and encoding.
- Security checks: dependency audit, basic header hardening, input validation review.

## Governance
- This constitution overrides ad-hoc implementation choices for this repository.
- Any pull request MUST include a short constitution compliance check:
  - kiosk UX compliance
  - deployment compatibility (Docker/Portainer/Traefik)
  - persistence and export compliance
  - privacy and security compliance
- Semantic Versioning Policy for this constitution:
  - MAJOR: backward-incompatible principle removals or redefinitions.
  - MINOR: new principle or materially expanded mandatory guidance.
  - PATCH: wording clarifications, typo fixes, or non-semantic refinements.
- Compliance Review Expectations:
  - Planning artifacts MUST map requirements to constitution constraints before implementation starts.
  - Release readiness MUST confirm all mandatory quality gates (tests, persistence, export, security checks).
- Amendments require:
  1. A documented reason.
  2. Impact statement on existing specs/tasks.
  3. Version increment and amendment date update.
- If a requirement conflicts with this constitution, this constitution takes precedence unless formally amended.

**Version**: 2.0.0 | **Ratified**: 2026-02-27 | **Last Amended**: 2026-02-27
