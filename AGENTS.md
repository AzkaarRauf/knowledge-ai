# AGENTS.md

pnpm monorepo: `apps/backend/` (NestJS + Prisma) and `apps/frontend/` (Next.js App Router).

## Frontend skills

Frontend conventions live as skills in `.claude/skills/`. When working on the frontend (anything under `apps/frontend/`), invoke the `frontend-skills` router skill first, then every `frontend-*` skill its table matches, before writing code. Agents without a `Skill` tool read `.claude/skills/frontend-skills/SKILL.md`.

Backend-only work skips these skills.
