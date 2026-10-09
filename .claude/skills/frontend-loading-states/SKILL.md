---
name: frontend-loading-states
description: Represent query loading with `<Skeleton>` placeholders shaped like the content they stand in for. Use when rendering a query's `isPending`/`isLoading`, writing a `loading.tsx` or `<Suspense>` fallback, or building a component that waits on data.
---

# Loading States

## Scope

The rule covers **content loading**: query data (`useQuery` `isPending`), `loading.tsx` route segments and `<Suspense>` fallbacks a page waits on. Mutations and AI streaming are out of scope (see Pending actions).

Content loading is a **skeleton**: grey blocks (`<Skeleton>` from `@/components/ui/skeleton`) laid out in the shape of the content that will replace them, so the page does not jump when data lands. Spinners and loading text ("Loading…") are banned for content loading.

## Building a skeleton

- Mirror the real layout: same wrapper classes, block heights matching the text they replace (`h-5` line of text, `h-9` list item, `h-16` card).
- Render the parts already known for real (headings, toolbars, "New" buttons) and skeleton only the data-dependent parts.
- Mark the container `role="status"` with an `aria-label` so screen readers announce loading without visible text.
- A skeleton used by one component lives beside it in the feature's `components/`; shared shapes go in `components/`.

```tsx
export function UserListSkeleton() {
  return (
    <div role="status" aria-label="Loading users" className="flex flex-col gap-1">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-9" />
      ))}
    </div>
  )
}
```

A route segment that waits on server data gets a `loading.tsx` (or a `<Suspense fallback>`) rendering its skeleton. With `cacheComponents` on, uncached data in a layout must sit inside an explicit `<Suspense>`.

## Pending actions

Awaiting a mutation or a streamed reply is not content loading, and progress text is fine there: a disabled submit with "Sending...", a "Thinking…" line while `useChat` `status === 'submitted'`, a Stop button while `'streaming'`.

## Checklist

- [ ] Every query `isPending` branch that hides content renders skeletons
- [ ] No spinner or "Loading…" text for content loading
- [ ] Skeleton matches the real layout; known parts render for real
- [ ] Skeleton container has `role="status"` + `aria-label`
