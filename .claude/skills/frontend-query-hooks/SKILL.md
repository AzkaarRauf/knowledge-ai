---
name: frontend-query-hooks
description: Define TanStack Query reads as `queryOptions` factories in `apps/frontend/features/<feature>/api/queries.ts` and consume them with `useQuery(xxxQueryOptions())`. Use when adding or changing a query key, a list/detail query, `select`, `enabled`, `gcTime`, the query provider, or reading server data in a component.
---

# Queries

A feature's reads live in `features/<feature>/api/queries.ts`: one key factory plus one `queryOptions` factory per query. Components call `useQuery(xxxQueryOptions(params))` directly. The factory is the abstraction: it works in components, `prefetchQuery`, `setQueryData`, and invalidation alike ([TkDodo, _Creating Query Abstractions_](https://tkdodo.eu/blog/creating-query-abstractions)). So a feature has no `useXxxQuery` wrapper hooks.

## Provider

`app/providers.tsx` is a `'use client'` component that creates the `QueryClient` once (`useState(() => new QueryClient(...))`) and renders `<QueryClientProvider>`; `app/layout.tsx` wraps `children` in it. `useQuery` only runs in client components, so a component that reads data starts with `'use client'`.

## Shape

```ts
import { queryOptions } from '@tanstack/react-query'
import { getUser, getUsers } from '@/features/users/api/userApi'

export const userKeys = {
  all: ['users'] as const,
  list: () => [...userKeys.all, 'list'] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
}

export const usersQueryOptions = () =>
  queryOptions({
    queryKey: userKeys.list(),
    queryFn: getUsers,
  })

export const userQueryOptions = (id: string) =>
  queryOptions({
    queryKey: userKeys.detail(id),
    queryFn: () => getUser(id),
  })
```

- **Keys**: every key starts with `<feature>Keys.all`, so `invalidateQueries({ queryKey: xKeys.all })` prefix-matches every list and detail of the feature. Nested resources hang off the parent's `detail` key, so removing the parent's `detail` key drops them too. Params go in the key as one object, with defaults applied.
- **queryFn** calls the feature API function (`api/<feature>Api.ts`), which already parses the response with zod (`frontend-api-client`, `frontend-zod-schemas`).
- Options shared by every caller (`staleTime`, `retry`) go in the factory; the factory carries only those.

## Consuming

```tsx
const { data: users = [], isPending } = useQuery(usersQueryOptions())
```

Per-call options spread on top of the factory, keeping full type inference:

```tsx
const newestFirst = (users: User[]) =>
  [...users].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
const usersQuery = useQuery({ ...usersQueryOptions(), select: newestFirst })
```

- `select` functions live at module scope (or `useCallback`) so they keep a stable identity.
- Conditional fetch: gate with `enabled` at the call site.
- Data another owner keeps live (e.g. chat messages owned by `useChat` once mounted) sets `gcTime: 0` in its factory, so the cache never serves a stale copy on remount.
- Load failures toast once, globally, from the `QueryCache` `onError` in `app/providers.tsx`. A component renders `error` inline only when the page needs it (a retry banner); it never toasts load errors itself.

## Checklist

- [ ] Key factory `<feature>Keys` rooted at `all` in `api/queries.ts`
- [ ] One exported `xxxQueryOptions` per query; no `useXxxQuery` wrapper
- [ ] `queryFn` calls the zod-parsing API function
- [ ] Call sites use `useQuery(xxxQueryOptions(...))`, spreading per-call options
- [ ] `pnpm exec tsc --noEmit && pnpm lint` in `apps/frontend/`
