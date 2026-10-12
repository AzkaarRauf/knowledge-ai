# Knowledge AI

pnpm monorepo:

- `apps/backend` — NestJS + Prisma (PostgreSQL)
- `apps/frontend` — Next.js (App Router)
- `packages/shared` — shared zod schemas

## Prerequisites

- Node.js 24+
- pnpm 12 (`corepack enable`)
- [Neon](https://neon.tech) PostgreSQL database (local Postgres won't work: the backend uses the Neon serverless adapter)

## Setup

```bash
# 1. Install deps
pnpm install

# 2. Env files
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
# then fill DATABASE_URL and JWT_SECRET in apps/backend/.env

# 3. Build shared package
pnpm shared build

# 4. Database: run migrations, generate client, seed
pnpm prisma migrate dev
pnpm prisma generate
pnpm prisma db seed
```

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
