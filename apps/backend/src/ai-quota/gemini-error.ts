import { GEMINI_DEFAULT_COOLDOWN_MS } from './ai-quota.constants.js'

type GeminiError = Error & {
    status?: number
    errorDetails?: { retryDelay?: string }[]
}

/**
 * If the error is a gemini 429 (rate limited), returns how long to wait in ms. Else null.
 * Gemini sends the wait as a RetryInfo detail ("17s"), or in the message ("Please retry in 17.5s").
 */
export function geminiRetryAfterMs(error: unknown): number | null {
    if (!(error instanceof Error)) return null
    const { status, errorDetails, message } = error as GeminiError
    const isRateLimited = status === 429 || /\b429\b|RESOURCE_EXHAUSTED|Too Many Requests/i.test(message)
    if (!isRateLimited) return null

    const delay = errorDetails?.find((detail) => detail.retryDelay)?.retryDelay ?? message.match(/retry in ([\d.]+)s/i)?.[1]
    const seconds = Number.parseFloat(delay ?? '')
    return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds * 1000) : GEMINI_DEFAULT_COOLDOWN_MS
}
