Quiz SST - Ops Notes

Service
- Domain: `quiz.format.lu`
- Portainer stack: `quiz-msss-forum-sst`
- Docker image: `esst/quiz-msss-forum-sst:<current-tag>`
- Traefik router: `quiz`
- Cert resolver: `letsencrypt`

Runtime
- DB path in container: `/data/quiz.db`
- Persistent volume: `quiz_data`
- Health URL: `https://quiz.format.lu/api/health`

Release Process
1. Merge PR to `main`.
2. Create GitHub Release tag (SemVer, e.g. `1.0.3`).
3. Wait for Docker publish workflow success.
4. In Portainer, update image tag.
5. Redeploy stack.
6. Verify UI and `/api/health`.

Admin / Data
- Initialize endpoint: `POST /api/admin/initialize`
- CSV export endpoint: `GET /api/admin/export.csv`
- Dumps location inside container: `/data/dumps`

Rollback
1. Set previous known-good image tag in Portainer.
2. Redeploy stack.
3. Verify `/api/health` and quiz UI.
