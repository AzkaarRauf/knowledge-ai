export const COLD_START_ROUTE = '/cold-start'

/** Only allow same-site paths as the return target, and never the cold-start page itself. */
export function safeReturnPath(next: string | null | undefined) {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith(COLD_START_ROUTE)) return '/'
  return next
}
