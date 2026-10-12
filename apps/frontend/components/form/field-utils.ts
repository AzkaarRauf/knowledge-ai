/** Read-only fields stay legible: disabled inputs keep full contrast on a muted background. */
export const readOnlyClassName =
  'disabled:bg-muted/60 disabled:opacity-100 disabled:text-foreground'

/** Turns TanStack Form errors (zod issues or plain strings) into display text. */
export function formatFieldErrors(errors: readonly unknown[]) {
  const messages = errors
    .map((error) =>
      typeof error === 'string'
        ? error
        : error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : '',
    )
    .filter(Boolean)
  return [...new Set(messages)].join(' ')
}
