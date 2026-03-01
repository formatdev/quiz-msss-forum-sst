# Implementation Plan: Multilingual Touchscreen Quiz Kiosk App

**Branch**: `001-multilingual-kiosk-quiz` | **Date**: 2026-02-27 | **Spec**: [spec.md](C:\DATA\GitHub\quiz-msss-forum-sst\specs\001-multilingual-kiosk-quiz\spec.md)
**Input**: Feature specification from `C:\DATA\GitHub\quiz-msss-forum-sst\specs\001-multilingual-kiosk-quiz\spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build a kiosk-first multilingual quiz web app (FR/DE/EN) for trade fair touchscreen usage
with a frontend SPA and backend API, persistent SQLite results, public CSV export, and
optional XLSX export. The system prioritizes kid/teen-friendly UX, deterministic scoring for
single and multi-choice questions, and deployment compatibility with Docker, Portainer, and
Traefik. Content will be seeded from Word-derived JSON and rendered with FR fallback when DE/EN
translations are missing.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 20 LTS)  
**Primary Dependencies**: React 18, Vite, Fastify, Zod, better-sqlite3, i18next, TanStack Query  
**Storage**: SQLite database file on Docker volume (`/data/quiz.db`)  
**Testing**: Vitest, React Testing Library, Supertest, Playwright (smoke flow)  
**Target Platform**: Linux server container behind Traefik; kiosk browser on Windows touchscreen PC  
**Project Type**: web application (frontend + backend)  
**Performance Goals**: question transition <300ms p95 on kiosk LAN; startup to ready state <3s on warm container  
**Constraints**: large touch targets, high contrast, FR fallback, persistent results, public exports with throttling, Docker Hub publishable image  
**Scale/Scope**: up to 10k sessions/event, up to 200 questions/version, three UI languages, one kiosk endpoint

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 Gate Check

- [x] Kiosk UX flow preserved (language selector at start, score + congratulations + leaderboard at end).
- [x] Deployment is Docker-first and compatible with Portainer + Traefik.
- [x] Persistence strategy survives container restarts.
- [x] Data export plan includes CSV (and optional XLSX if in scope).
- [x] Data model enforces anonymous session id + optional nickname only (no personal data).
- [x] Security baseline planned (input validation, safe output encoding, non-root container, dependency audit).

### Post-Phase 1 Re-Check

- [x] Research decisions define Docker + Traefik deployment and publishable image flow.
- [x] Data model includes anonymous-only session records and deterministic leaderboard ordering.
- [x] Contracts include public export endpoints, throttling notes, and health/status endpoint.
- [x] Quickstart includes persistent-volume configuration and public-access behavior.

## Project Structure

### Documentation (this feature)

```text
specs/001-multilingual-kiosk-quiz/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
```text
backend/
├── src/
│   ├── api/
│   ├── config/
│   ├── db/
│   ├── repositories/
│   ├── services/
│   ├── scoring/
│   └── i18n/
├── scripts/
└── tests/
    ├── contract/
    ├── integration/
    └── unit/

frontend/
├── src/
│   ├── app/
│   ├── components/
│   ├── pages/
│   ├── features/
│   ├── i18n/
│   ├── styles/
│   └── services/
└── tests/
    ├── unit/
    └── e2e/

shared/
├── contracts/
└── types/

infra/
├── docker/
│   └── Dockerfile
├── compose/
│   └── docker-compose.yml
└── traefik/
    └── dynamic-example.yml

data/
└── questions.seed.json

scripts/
└── seed-questions.ts

tests/
├── contract/
├── integration/
└── e2e/
```

**Structure Decision**: Web application layout (backend + frontend + shared contracts) selected
to separate kiosk UI concerns from API/persistence concerns while keeping deployment simple
as a single publishable image.

## Phase 0 Research Output

- `C:\DATA\GitHub\quiz-msss-forum-sst\specs\001-multilingual-kiosk-quiz\research.md`
- All unknowns resolved; no remaining `NEEDS CLARIFICATION` items.

## Phase 1 Design Output

- `C:\DATA\GitHub\quiz-msss-forum-sst\specs\001-multilingual-kiosk-quiz\data-model.md`
- `C:\DATA\GitHub\quiz-msss-forum-sst\specs\001-multilingual-kiosk-quiz\contracts\openapi.yaml`
- `C:\DATA\GitHub\quiz-msss-forum-sst\specs\001-multilingual-kiosk-quiz\quickstart.md`

## Phase 2 Planning Notes

- Implementation tasks will prioritize:
  - P1 kiosk flow + scoring + explanation loop
  - P1 persistence + leaderboard + CSV export + export throttling
  - P2 content seeding + optional XLSX export + kiosk hardening

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
