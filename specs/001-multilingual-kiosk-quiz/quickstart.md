# Quickstart: Multilingual Touchscreen Quiz Kiosk App

## 1. Prerequisites
- Docker Desktop or Docker Engine 24+
- Node.js 20 LTS (for local non-container development)
- Git
- Available host/domain routed through Traefik in target environment

## 2. Repository Bootstrap (planned structure)
```powershell
git checkout 001-multilingual-kiosk-quiz
mkdir backend frontend shared data scripts infra tests
```

## 3. Environment Configuration
Create `.env` (example values):

```env
NODE_ENV=production
PORT=3000
DB_PATH=/data/quiz.db
APP_BASE_URL=https://quiz.example.org
EXPORT_RATE_LIMIT_PER_MIN=30
```

## 4. Local Run (without Docker, planned)
```powershell
# backend
cd backend
npm install
npm run dev

# frontend (new shell)
cd frontend
npm install
npm run dev
```

## 5. Seed Questions on First Run
```powershell
cd c:\DATA\GitHub\quiz-msss-forum-sst
node scripts/seed-questions.ts --db ./local-data/quiz.db --input ./data/questions.seed.json
```

Expected behavior:
- Creates tables if missing.
- Upserts questions/options/translations by stable IDs.
- Safe to run multiple times (idempotent).

## 6. Docker Build and Run (planned)
```powershell
docker build -t <dockerhub-user>/quiz-msss-forum-sst:0.1.0 -f infra/docker/Dockerfile .
docker compose -f infra/compose/docker-compose.yml up -d
```

## 7. Traefik Notes (host-based routing)
- Route by host rule, for example `Host(`quiz.example.org`)`.
- Forward to app service internal port (e.g., 3000).
- Terminate TLS at Traefik.
- Ensure app trusts proxy headers if needed for absolute URL generation.

Example labels (illustrative):
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.quiz.rule=Host(`quiz.example.org`)"
  - "traefik.http.routers.quiz.entrypoints=websecure"
  - "traefik.http.services.quiz.loadbalancer.server.port=3000"
```

## 8. Manual Validation Checklist
- [ ] Welcome screen shows FR/DE/EN.
- [ ] Nickname can be skipped.
- [ ] One-question-per-screen flow works with progress indicator.
- [ ] Explanation screen appears after each answer.
- [ ] Final screen shows congratulations, score, percentage, leaderboard, restart.
- [ ] Session persists after container restart.
- [ ] CSV export is publicly downloadable.
- [ ] Export endpoint is rate-limited under rapid repeated requests.
- [ ] DE/EN missing text falls back to FR.

## 9. Test Commands (planned)
```powershell
cd backend
npm run test

cd ..\frontend
npm run test
```
