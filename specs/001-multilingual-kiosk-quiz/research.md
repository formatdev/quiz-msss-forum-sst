# Research: Multilingual Touchscreen Quiz Kiosk App

## Decision 1: Frontend/Backend Architecture
- Decision: Use a frontend SPA and backend API with clear contract boundary.
- Rationale: Matches kiosk UX needs, supports independent UI iteration, and keeps export/persistence secure on server side.
- Alternatives considered:
  - Server-rendered pages only: simpler initial setup but weaker kiosk interaction and state handling.
  - Desktop app wrapper: unnecessary operational complexity for booth deployment.

## Decision 2: Technology Baseline
- Decision: TypeScript on Node.js 20 LTS across backend and frontend.
- Rationale: Single language across stack improves maintainability and onboarding.
- Alternatives considered:
  - Mixed stack (e.g., Python backend + JS frontend): increases cognitive and tooling overhead.
  - Heavier full-stack framework: unnecessary for current scope.

## Decision 3: Persistent Storage
- Decision: SQLite file on Docker volume as default persistence.
- Rationale: Satisfies restart durability without external DB operational burden.
- Alternatives considered:
  - In-memory store: fails persistence requirement.
  - Managed PostgreSQL from day one: more infrastructure than needed for booth scope.

## Decision 4: i18n Strategy
- Decision: Store question and UI resources per language (FR/DE/EN) with FR field-level fallback.
- Rationale: Guarantees content display even with partial translations.
- Alternatives considered:
  - Hard fail on missing translations: harms booth continuity.
  - Separate per-language datasets with no fallback: higher maintenance risk.

## Decision 5: Scoring Model
- Decision: Single-choice uses exact match; multi-choice uses positive-minus-negative scoring bounded [0, max].
- Rationale: Rewards partial understanding while discouraging random over-selection.
- Alternatives considered:
  - All-or-nothing for multi-choice: can feel punitive for younger users.
  - Pure partial credit without penalty: encourages guessing all options.

## Decision 6: Export Access Policy
- Decision: Keep export endpoints public (no authentication), with throttling and operational logging.
- Rationale: Matches kiosk/local-browser operating mode and avoids credential handling at booth.
- Alternatives considered:
  - Token/basic protected endpoint: conflicts with public-access requirement.
  - Full user auth/roles system: outside non-goals and unnecessary complexity.

## Decision 7: API Contract Format
- Decision: Define REST-style HTTP JSON contract and OpenAPI specification for planning.
- Rationale: Clear integration point for frontend, testing, and future maintenance.
- Alternatives considered:
  - Undocumented ad hoc routes: higher regression and handoff risk.
  - GraphQL: unnecessary complexity for fixed quiz domain.

## Decision 8: Deployment Pattern
- Decision: Docker image deployable to own server, orchestrated via Portainer, routed with Traefik host rule.
- Rationale: Aligns with hard operational constraints and existing infrastructure.
- Alternatives considered:
  - VM manual install: drifts from containerized operations.
  - Managed PaaS assumptions: not aligned with own-server requirement.

## Decision 9: Seed and Content Lifecycle
- Decision: Convert Word content to JSON and run idempotent first-run seed into SQLite.
- Rationale: Keeps non-developer content workflow practical and repeatable.
- Alternatives considered:
  - Manual DB edits: error-prone and hard to audit.
  - Runtime parsing of Word file: brittle and difficult to validate.

## Decision 10: Kiosk Reliability and UX
- Decision: Use touch-first controls, high contrast, large typography, and resilient local-network behavior.
- Rationale: Ensures usability for children/youngsters and reduces booth support overhead.
- Alternatives considered:
  - Desktop-first UI patterns with hover: poor touchscreen usability.
  - Internet-dependent runtime features: fragile during event network fluctuations.

## Clarifications Status
- All `NEEDS CLARIFICATION` items are resolved for planning.
