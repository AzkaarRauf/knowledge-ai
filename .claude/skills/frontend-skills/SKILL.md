---
name: frontend-skills
description: Router that loads this repo's frontend-* skills by code signal. Use before writing or editing anything under `apps/frontend/` (API calls, zod schemas, queries, mutations, delete/confirm actions, loading states, routes), even when the user never names a skill.
---

# Frontend Skills Router

Once invoked, stays in effect for the session. Whenever frontend work touches a signal below, invoke that skill via the `Skill` tool **before** writing or editing the code. Match on the work, not on the user's words.

All paths in the frontend-* skills are relative to `apps/frontend/` (Next.js App Router, no `src/` dir, alias `@/*` → `./*`). This Next.js version has breaking changes: read the relevant guide in `apps/frontend/node_modules/next/dist/docs/` before using a Next API (see `apps/frontend/AGENTS.md`).

## Mandate

1. Detect the signal (table below) in the task or the file you are about to touch.
2. Invoke the matching skill first, then follow its rules.
3. Multiple signals → invoke every matching skill before coding.
4. Unsure whether a signal applies → invoke the skill; it is cheaper than breaking a hard rule.
5. New feature → follow the build order at the bottom.
6. A file or package a skill references does not exist yet → create/install it as the skill describes, and tell the user.

## Signal → skill

| You are doing / touching                                                                                                         | Invoke                    |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| axios client, auth header, error interceptor, `NEXT_PUBLIC_*` env vars, `lib/api-client.ts`, `lib/env.ts`, `rewrites`, streaming | `frontend-api-client`     |
| any response/request shape; `schemas.ts`; `.catch`/`.nullable`/`.nullish`; paginated responses                                   | `frontend-zod-schemas`    |
| reading server data, `useQuery`, `queryOptions`, query keys, `api/queries.ts`, the query provider                                | `frontend-query-hooks`    |
| create/update/delete writes, `useMutation`, invalidation, `use*Mutation`                                                         | `frontend-mutation-hooks` |
| delete button, destructive action, success/error toasts                                                                          | `frontend-confirm-dialog` |
| `isPending`/`isLoading` branch, skeleton, `loading.tsx`, `<Suspense>` fallback, anything waiting on data                         | `frontend-loading-states` |
| new page or layout in `app/`, dynamic segment, `'use client'` boundary, links/navigation                                         | `frontend-routing`        |

## Hard rules (invoke the skill to comply)

- Backend calls go through `api` from `@/lib/api-client`; raw `fetch` only for streaming endpoints. (`frontend-api-client`)
- Base URLs come from `@/lib/env`. (`frontend-api-client`)
- Every response/request shape gets a zod schema that models every field the API sends. (`frontend-zod-schemas`)
- Reads are `useQuery(xxxQueryOptions())`; no `useXxxQuery` wrappers. (`frontend-query-hooks`)
- Every mutation invalidates the affected query keys. (`frontend-mutation-hooks`)
- Destructive actions go through `<ConfirmationDialog>`. (`frontend-confirm-dialog`)
- Query loading renders `<Skeleton>` placeholders; mutation progress text ("Sending...") is fine. (`frontend-loading-states`)
- `page.tsx`/`layout.tsx` stay thin: they wire params to feature components. (`frontend-routing`)

## Build order (full feature, bottom-up)

api-client → zod-schemas → query-hooks → mutation-hooks → confirm-dialog → loading-states → routing.

## Exclusions

- `standardize`: user-invoked audit, outside the build flow.
- Forms and tables have no skill yet; build them plainly and flag it to the user.
