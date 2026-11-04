import { toast } from 'sonner'
import { ApiRateLimitError, getErrorMessage } from '@/lib/errors'

// One id, so many rate limit errors at once show as a single toast.
const RATE_LIMIT_TOAST_ID = 'rate-limit'

/** Text for a time like "3:45 PM", in the user's local time zone. */
export function formatLocalTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

/** User facing text for a rate limit error. Falls back to the backend message. */
export function getRateLimitMessage(error: ApiRateLimitError) {
  switch (error.code) {
    case 'RATE_LIMIT_USER':
      return error.retryAfterSec === undefined
        ? error.message
        : `Too many requests. Try again in ${Math.ceil(error.retryAfterSec)}s.`
    case 'AI_DAILY_LIMIT': {
      const time = error.resetAt ? formatLocalTime(error.resetAt) : undefined
      return time ? `Daily AI limit reached. Resets at ${time}.` : error.message
    }
    case 'AI_BUSY':
      return 'AI busy, try again in a few seconds.'
    default:
      return error.message
  }
}

/** Shows any error as a toast. Rate limit errors share one toast id. */
export function showErrorToast(error: unknown) {
  if (ApiRateLimitError.check(error)) return toast.error(getRateLimitMessage(error), { id: RATE_LIMIT_TOAST_ID })
  return toast.error(getErrorMessage(error))
}
