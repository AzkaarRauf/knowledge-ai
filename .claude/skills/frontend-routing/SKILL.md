---
name: frontend-routing
description: Routing conventions for the Next.js App Router in `apps/frontend/app/`. Use when adding a page or layout, a dynamic segment, a `'use client'` boundary, reading params, or navigating.
---

# Routing

## Where routes live

File-system routes in `app/` (Next.js App Router). Read `node_modules/next/dist/docs/01-app/` before using a routing API: this Next version differs from older ones.

- `app/users/layout.tsx` is the layout for `/users/*`: renders `children`.
- `app/users/page.tsx` → `/users`; `app/users/[userId]/page.tsx` → `/users/:userId`.
- Route groups `(group)/` share a layout without adding a URL segment.

## Route files stay thin

`page.tsx` and `layout.tsx` are Server Components that declare the route and wire params to a feature component; the UI lives in `features/<feature>/components/`. `params` is a Promise; type it with the global `PageProps<'/route'>` helper:

```tsx
export default async function UserPage(props: PageProps<'/users/[userId]'>) {
  const { userId } = await props.params
  return <UserDetail key={userId} userId={userId} />
}
```

- `key` on the feature component when the param identifies the entity, so switching entities remounts with fresh state.
- Interactive / data-reading components (`useQuery`, state, handlers) start with `'use client'`; keep the boundary at the feature component, not the page.

## Navigation

- Links: `<Link href={`/users/${id}`}>` from `next/link`; programmatic: `useRouter().push(...)` from `next/navigation`.
- Enable `typedRoutes: true` in `next.config.ts` so `href` and `PageProps` routes are type-checked; never build paths that bypass it with casts.
- Active styling: compare `usePathname()` in a client component.
- A parent layout reads a child's param with `useParams()` (client) from `next/navigation`.

## Auth-gated pages

Token in `localStorage` → the server has nothing to render; gate in a client component (layout-level `'use client'` guard) rather than in server code.

## Checklist

- [ ] Route file in `app/`, UI in the feature's `components/`
- [ ] `params` awaited, typed via `PageProps<'/route'>`
- [ ] `'use client'` at the feature component boundary, not on the page
- [ ] Navigation via `<Link>` / `useRouter` with typed routes
