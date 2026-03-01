# quiz-msss-forum-sst

Multilingual kiosk quiz application for Forum SST.

This repository contains:
- a backend API (Fastify + SQLite),
- a frontend kiosk UI (React + Vite),
- Docker and deployment assets (Portainer/Traefik style),
- seed data for questions.

## 1. Architecture (simple view)

- Frontend: quiz interface used by participants.
- Backend: session lifecycle, answer scoring, leaderboard, admin endpoints, exports, DB initialization.
- Database: SQLite file stored on persistent volume (`/data/quiz.db` in container).

Production deployment uses one container that serves:
- UI at `/`
- API at `/api/*`

## 2. Repository structure

- `frontend/`: React app
- `backend/`: Fastify API + DB logic
- `data/questions.seed.json`: tracked question source data
- `infra/docker/Dockerfile`: production image build
- `infra/compose/docker-compose.yml`: compose example
- `.github/workflows/ci-cd.yml`: CI + Docker publish workflow

## 3. Runtime requirements

- Node 22+ (needed for `node:sqlite`)
- Docker (for production image)

## 4. Local development

From repository root:

```bash
npm ci
```

Run backend:

```bash
npm run dev -w backend
```

Run frontend:

```bash
npm run dev -w frontend
```

Backend tests:

```bash
npm run test -w backend
```

Build:

```bash
npm run build -w backend
npm run build -w frontend
```

## 5. Important data tracking rules

- Tracked in git:
  - `data/questions.seed.json`
- Not tracked in git:
  - `backend/data/` (runtime DB + dumps)

This is enforced by `.gitignore`.

## 6. CI/CD behavior

Workflow file: `.github/workflows/ci-cd.yml`

- On PR/push to `main`: runs backend tests + builds.
- On GitHub Release published: builds/pushes Docker image to Docker Hub.

Docker tags generated from release tag (SemVer):
- `1.0.2`
- `1.0`
- `1`

Image name:
- `esst/quiz-msss-forum-sst`

## 7. GitHub setup checklist

Repository secrets required:
- `DOCKERHUB_USERNAME` (example: `esst`)
- `DOCKERHUB_TOKEN` (Docker Hub access token with write scope)

Docker Hub repository must exist:
- `esst/quiz-msss-forum-sst`

## 8. Release process (recommended)

1. Merge feature/hotfix PR into `main`.
2. Ensure CI on `main` is green.
3. Create GitHub Release with SemVer tag (example: `1.0.2`).
4. Wait for publish workflow to push Docker image.
5. In Portainer, deploy/update image tag to that exact version.

Use pinned tags in Portainer (`1.0.2`) instead of `latest` for safer rollback.

## 9. Portainer stack example

Use this in the Web Editor (adapt image tag):

```yaml
version: "3.9"

services:
  quiz-app:
    image: esst/quiz-msss-forum-sst:1.0.2
    container_name: quiz-msss-forum-sst
    user: "0:0"
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_PATH: /data/quiz.db
      EXPORT_RATE_LIMIT_PER_MIN: 30
    volumes:
      - quiz_data:/data
    restart: unless-stopped

volumes:
  quiz_data:
```

Notes:
- `user: "0:0"` avoids volume permission issues on some hosts.
- If you need direct IP testing before Traefik, temporarily add:
  - `ports: ["3000:3000"]`

## 10. First boot checks

Health endpoint:

```bash
curl http://<server-ip>:3000/api/health
```

Expected:
- `status: "ok"`

If `activeQuestions` is `0`, initialize:

```bash
curl -X POST http://<server-ip>:3000/api/admin/initialize
```

Then re-check `/api/health` (active questions should be > 0).

## 11. API quick references

- Health: `GET /api/health`
- Start session: `POST /api/sessions`
- Next question: `GET /api/sessions/:sessionId/question`
- Submit answer: `POST /api/sessions/:sessionId/answers`
- Result: `GET /api/sessions/:sessionId/result`
- Leaderboard summary: `GET /api/leaderboard`
- CSV export: `GET /api/admin/export.csv`
- Reinitialize + seed: `POST /api/admin/initialize`

## 12. Troubleshooting

### `No such built-in module: node:sqlite`

Cause: runtime/CI Node version too old.
Fix: use Node 22+ (already configured).

### `unable to open database file`

Cause: volume permission mismatch.
Fix: run container with `user: "0:0"` or pre-chown volume path.

### `ENOENT ... /backend/dist/db/migrations`

Cause: migrations not copied into runtime image.
Fix: Dockerfile must copy migrations (already configured).

### `/` returns route not found

Cause: frontend static assets not served.
Fix: backend static serving + frontend dist in image (already configured).

### Docker push `insufficient_scope`

Cause: Docker Hub repo/permissions mismatch.
Fix:
- repo exists (`esst/quiz-msss-forum-sst`)
- token has write scope
- workflow `images:` uses correct namespace

## 13. Backup and restore notes

Admin initialize endpoint creates:
- SQLite dump in `/data/dumps`
- CSV export dump in `/data/dumps`
- then clears and reseeds DB

For external backup policy, copy `/data/quiz.db` and `/data/dumps/*` regularly.

## 14. Rollback procedure

1. In Portainer, set image to previous known-good tag (example `1.0.1`).
2. Redeploy stack.
3. Verify `/api/health` and UI.

If DB schema changed and rollback is incompatible, restore from backup dump.
