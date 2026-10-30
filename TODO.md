# TODO

Pending work vs the assignment, in suggested order.

## 1. Auth

- [ ] `RefreshToken` expiry + index

## 2. Chat history

- [ ] Stop sending full history to LLM (last N messages or summary)

## 3. API shape

- [ ] `POST /chat`
- [ ] `POST /search`
- [ ] `GET /admin/users`
- [ ] `GET /admin/analytics`
- [ ] `DELETE /admin/documents/:id`
- [ ] Search, Analytics, Admin modules
- [ ] Let normal users upload/list documents

## 4. DB tables + design

- [ ] `QueryLog` model
- [ ] `Feedback` model
- [ ] `AuditLog` model
- [ ] `onDelete` rules on relations
- [ ] Indexes on `userId`, `conversationId`, `departmentId`, `createdAt`

## 5. Feedback

- [ ] Feedback endpoint
- [ ] Thumbs up/down in chat UI

## 6. Background processing + Redis

- [ ] Redis setup
- [ ] Queue + worker for document processing (BullMQ)
- [ ] Document status field (`PENDING`/`PROCESSING`/`DONE`/`FAILED`)
- [ ] Redis cache / locking

## 7. Reliability

- [ ] Rate limiting (`@nestjs/throttler`)
- [ ] Timeouts on LLM/embedding calls
- [ ] Expired vs invalid JWT handling
- [ ] Redis failure handling
- [ ] LLM / vector DB down: retry + fallback

## 8. Docker

- [ ] Backend Dockerfile
- [ ] Frontend Dockerfile
- [ ] `docker-compose.yml` (Postgres + pgvector, Redis, backend, frontend)
- [ ] Root `.env.example`

## 9. CI/CD

- [ ] GitHub Actions: install, lint, test, build
- [ ] Docker build
- [ ] Security scan (`pnpm audit` / Trivy)
- [ ] Deploy + health check

## 10. Testing

- [ ] Backend e2e (Supertest): auth, RBAC, upload, chat, search
- [ ] Frontend test runner setup
- [ ] Frontend tests: login, protected routes, chat, document list, loading/error states

## 11. Write-ups

- [ ] Postgres design doc (Task 2)
- [ ] Failure scenarios doc (Task 20)
- [ ] Architecture doc
- [ ] Why Google-only auth
- [ ] Expand README

## 12. Minor

- [ ] Swagger outside dev env
- [ ] Real re-ranker (beyond RRF)
- [ ] Document category field (optional)
