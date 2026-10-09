---
name: standardize
description: Audit a frontend file or directory against every applicable frontend-* skill and report conformance gaps. User-invoked only, via `/standardize <path>`.
disable-model-invocation: true
---

# Standardize

Reviews target file(s) against every applicable `frontend-*` skill and emits a findings report. Read-only: edits happen only after the user confirms.

## Args

`/standardize <path>`: file or directory. No path given → ask once.

## Concern → skill

| Concern in file                                                         | Skill                     |
| ----------------------------------------------------------------------- | ------------------------- |
| axios client / base URL / interceptors / env / streaming transport      | `frontend-api-client`     |
| zod schemas (response/request)                                          | `frontend-zod-schemas`    |
| `useQuery`, `queryOptions`, query keys, query provider                  | `frontend-query-hooks`    |
| `useMutation`, invalidation                                             | `frontend-mutation-hooks` |
| `<ConfirmationDialog>`, delete actions, toasts                          | `frontend-confirm-dialog` |
| `isPending`/`isLoading` branches, skeletons, `loading.tsx`, spinners    | `frontend-loading-states` |
| `page.tsx`/`layout.tsx`, params, navigation, `'use client'` boundaries  | `frontend-routing`        |

## Workflow

1. Read every target file in full.
2. Scan for the concern markers above; list the applicable skills.
3. For each applicable skill: invoke it via `Skill`, then check the file against every rule and checklist item in it.
4. Emit the report (format below), one line per finding.
5. Ask the user whether to apply fixes; wait for confirmation before editing.

## Report format

One table per file:

```
### `<file>`

| Line | Severity | Skill | Problem | Fix |
|------|----------|-------|---------|-----|
| 42   | error    | frontend-query-hooks | `useEffect` + `useState` data loading | `useQuery(usersQueryOptions())` |
```

Severity: `error` (breaks a hard rule), `warn` (smell / inconsistency), `info` (style nit).

End with: `N errors, M warns, K infos across F file(s). Skills consulted: …`.

## Hard rules → `error`

- raw `fetch` for a non-streaming backend call
- hard-coded base URL (not from `lib/env.ts`)
- response schema missing a field the API sends (check the Prisma model or a real response)
- mutation that does not invalidate the affected query keys
- `useEffect` + `useState` data loading instead of `useQuery(xxxQueryOptions())`
- destructive action without `<ConfirmationDialog>`
- spinner or loading text for content loading

Response/request shape without a zod schema → `warn`.

File with no frontend concerns → say so and stop.
