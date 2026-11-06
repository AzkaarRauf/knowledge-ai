# Knowledge AI

pnpm monorepo:

- `apps/backend` — NestJS + Prisma (PostgreSQL)
- `apps/frontend` — Next.js (App Router)
- `packages/shared` — shared zod schemas

## Prerequisites

- Node.js 24+
- pnpm 12 (`corepack enable`)
- Docker (runs Postgres + pgvector and Redis locally). Or use [Neon](https://neon.tech) with `PRISMA_PROVIDER=neon`

## Setup

```bash
# 1. Install deps
pnpm install

# 2. Env files
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
# then fill apps/backend/.env. For the docker services use:
#   PRISMA_PROVIDER=local
#   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/knowledge_ai
#   REDIS_CONNECTION_STRING=redis://localhost:6379

# 3. Start Postgres and Redis
docker compose up -d

# 4. Build shared package
pnpm shared build

# 5. Database: generate client, run migrations, seed (seed needs SEED_ADMIN_EMAIL)
pnpm prisma generate
pnpm prisma migrate deploy
pnpm prisma db seed
```

`PRISMA_PROVIDER` picks the db driver: `local` for plain Postgres (docker), `neon` for Neon (prod).

### Copy data from Neon (optional)

Instead of step 5's migrate and seed, restore a Neon dump into the local db. Use Neon's direct url (no `-pooler` in the host). Neon's Postgres major version must not be newer than the docker image's (pg18).

```bash
docker compose exec db psql -U postgres -d postgres -c "DROP DATABASE knowledge_ai WITH (FORCE);" -c "CREATE DATABASE knowledge_ai;"
docker compose exec db pg_dump "<neon-direct-url>?sslmode=require" -Fc --no-owner --no-acl -f /tmp/neon.dump
docker compose exec db pg_restore -U postgres -d knowledge_ai --no-owner --no-acl /tmp/neon.dump
```

Errors about Neon-only extensions or roles are fine. Files stay in S3 storage; only the db is copied.

## Run

```bash
pnpm dev
```

| Service  | URL                          |
| -------- | ---------------------------- |
| Frontend | http://localhost:3000        |
| Backend  | http://localhost:8090/api/v1 |
| API docs | http://localhost:8090/docs   |

Frontend proxies `/api/*` to the backend, so no CORS setup needed.

## Useful commands

```bash
pnpm be <script>     # run a backend script, e.g. pnpm be test
pnpm fe <script>     # run a frontend script, e.g. pnpm fe build
pnpm format          # format all packages
```
