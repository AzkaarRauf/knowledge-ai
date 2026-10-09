---
name: frontend-confirm-dialog
description: Confirm destructive actions with `<ConfirmationDialog>` and report results with sonner toasts. Use when wiring delete buttons, other destructive actions, or success/error feedback for an action.
---

# Confirmation Dialogs & Toasts

Every delete and every destructive action is confirmed first.

## Pieces

| Piece          | Import                                                                                          |
| -------------- | ----------------------------------------------------------------------------------------------- |
| Dialog         | `ConfirmationDialog` from `@/components/ConfirmationDialog` (native `<dialog>`, `'use client'`) |
| Toast          | `toast` from `sonner`; `<Toaster richColors />` is mounted once in `app/providers.tsx`          |
| Result helpers | `safe`, `isError` from `@/lib/safe`; `getErrorMessage` from `@/lib/errors`                      |

`safe(promise)` resolves to the value or the thrown error, so handlers branch with `isError(res)` instead of try/catch.

## Delete pattern

Hold the pending item in state; the dialog is open while it is set.

```tsx
const [userToDelete, setUserToDelete] = useState<User | null>(null)
const deleteMutation = useDeleteUserMutation()

async function handleDeleteConfirm() {
  if (!userToDelete) return
  const { id } = userToDelete
  setUserToDelete(null)
  const res = await safe(deleteMutation.mutateAsync({ id }))
  if (isError(res)) return toast.error(getErrorMessage(res))
  toast.success('User deleted')
}

<ConfirmationDialog
  open={userToDelete !== null}
  onOpenChange={(open) => {
    if (!open) setUserToDelete(null)
  }}
  onAccept={handleDeleteConfirm}
  title="Delete user?"
  description={`This will permanently delete "${userToDelete?.name}".`}
  confirmText="Delete"
  destructive
/>
```

`destructive` styles the confirm button red; set it for deletes.

## Toasts

- `toast.success` for a completed action the user can't otherwise see; skip it when the UI change is itself the feedback (a sent message appearing).
- `toast.error(getErrorMessage(res))` for failed mutations; query load failures are toasted globally (`frontend-query-hooks`).
