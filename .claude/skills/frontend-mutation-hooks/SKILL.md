---
name: frontend-mutation-hooks
description: Create TanStack Query mutation hooks (`use<Verb><Thing>Mutation`) in `apps/frontend/features/<feature>/hooks/` that invalidate affected query keys. Use when adding a create/update/delete mutation, choosing what to invalidate, or calling a mutation from a component.
---

# Mutation Hooks

Path: `features/<feature>/hooks/use<Verb><Thing>Mutation.ts`, one hook per file. The hook wraps the feature API function (`api/<feature>Api.ts`, which parses request and response with zod) and invalidates what the write made stale.

## Shape

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteUser } from '@/features/users/api/userApi'
import { userKeys } from '@/features/users/api/queries'

export function useDeleteUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string }) => deleteUser(id),
    onSuccess: (_, { id }) => {
      queryClient.removeQueries({ queryKey: userKeys.detail(id) })
      return queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}
```

- Variables are one object: `{ id, ...request }` for updates, `{ id }` for deletes and actions.
- `onSuccess` **returns** the invalidation promise, so `isPending` stays true until the refetched list has landed and the UI never shows the pre-write data after a success toast.
- Deletes also `removeQueries` the deleted entity's `detail` key (and everything nested under it), so a stale detail is never served if the id is visited again.

## Invalidation

Every mutation invalidates every key its write made stale:

- Own feature: `<feature>Keys.all` (prefix-matches every list and detail).
- Other features that display this data: invalidate their `all` too, with a one-line comment naming the dependency. Several keys → `Promise.all([...])`.

## Calling from a component

Await `mutateAsync` through `safe` (`@/lib/safe`) and branch on the result:

```tsx
const res = await safe(createUserMutation.mutateAsync({ name, email, password }))
if (isError(res)) return toast.error(getErrorMessage(res))
router.push(`/users/${res.id}`)
```

Disable submit/action buttons on the mutation's `isPending`.

## Checklist

- [ ] File `features/<feature>/hooks/use<Verb><Thing>Mutation.ts`
- [ ] `mutationFn` calls the zod-parsing API function
- [ ] `onSuccess` returns the invalidation of every affected key (own `all` + dependent features)
- [ ] Callers use `safe(mutateAsync(...))` and toast errors with `getErrorMessage`
- [ ] `pnpm exec tsc --noEmit && pnpm lint` in `apps/frontend/`
