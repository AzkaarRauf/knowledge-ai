import type { AnyFormApi } from '@tanstack/react-form'
import { isAxiosError } from 'axios'
import { z } from 'zod'

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export type RateLimitCode = 'RATE_LIMIT_USER' | 'AI_DAILY_LIMIT' | 'AI_BUSY' | 'RATE_LIMIT_UNAVAILABLE'

/** 429 and 503 errors from the rate limiter. `code` tells which one. */
export class ApiRateLimitError extends ApiError {
  constructor(
    message: string,
    status: number,
    public readonly code: RateLimitCode,
    public readonly retryAfterSec?: number,
    public readonly resetAt?: string,
  ) {
    super(message, status)
    this.name = 'ApiRateLimitError'
  }

  static check(value: unknown): value is ApiRateLimitError {
    return value instanceof ApiRateLimitError
  }
}

export class ApiValidationError extends ApiError {
  constructor(
    message: string,
    public readonly fieldErrors: Record<string, string>,
  ) {
    super(message, 400)
    this.name = 'ApiValidationError'
  }

  static check(value: unknown): value is ApiValidationError {
    return value instanceof ApiValidationError
  }

  /**
   * Shows each backend field message on the matching form field. Set as a form-level
   * `onServer` error, so the form's next validation (any change) clears it.
   */
  applyToForm(formApi: AnyFormApi) {
    formApi.setErrorMap({ onServer: { fields: this.fieldErrors } })
  }
}

const RateLimitCodeSchema = z.enum(['RATE_LIMIT_USER', 'AI_DAILY_LIMIT', 'AI_BUSY', 'RATE_LIMIT_UNAVAILABLE'])

export const ErrorBodySchema = z.object({
  code: RateLimitCodeSchema.optional().catch(undefined),
  retryAfterSec: z.number().optional().catch(undefined),
  resetAt: z.string().optional().catch(undefined),
  message: z.union([z.string(), z.array(z.string())]).catch(''),
  errors: z
    .array(
      z.object({
        path: z.array(z.union([z.string(), z.number()])).catch([]),
        message: z.string().catch(''),
      }),
    )
    .nullish(),
})

/** Biggest value (in seconds) of all Retry-After* headers. Undefined if none is valid. */
export function maxRetryAfterSec(headers: { forEach: (cb: (value: string, key: string) => void) => void }) {
  let max: number | undefined
  headers.forEach((value, key) => {
    if (!key.toLowerCase().startsWith('retry-after')) return
    const sec = Number(value)
    if (Number.isFinite(sec) && sec >= 0 && (max === undefined || sec > max)) max = sec
  })
  return max
}

type ErrorBody = z.infer<typeof ErrorBodySchema>

/** Returns a rate limit error if the status and body say so, else undefined. */
export function toRateLimitError(
  status: number,
  message: string,
  body: ErrorBody | undefined,
  headerRetryAfterSec: () => number | undefined,
) {
  if (status !== 429 && status !== 503) return undefined
  const code = body?.code
  if (!code) return undefined
  const retryAfterSec = body.retryAfterSec ?? headerRetryAfterSec()
  return new ApiRateLimitError(message, status, code, retryAfterSec, body.resetAt)
}

export function handleErrorResponse(error: unknown): never {
  if (!isAxiosError(error)) throw error

  const status = error.response?.status ?? 0
  const body = ErrorBodySchema.safeParse(error.response?.data)
  const rawMessage = body.success ? body.data.message : ''
  const message =
    (Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage) || (status ? `Request failed (${status})` : 'Network error')

  const rateLimit = toRateLimitError(status, message, body.success ? body.data : undefined, () => {
    const headers = error.response?.headers
    if (!headers) return undefined
    return maxRetryAfterSec({
      forEach: (cb) => {
        for (const [key, value] of Object.entries(headers)) cb(String(value), key)
      },
    })
  })
  if (rateLimit) throw rateLimit

  // Nest StandardSchemaValidationPipe: { statusCode: 400, message, errors: [{ path, message }] }
  if (status === 400 && body.success && body.data.errors) {
    const fieldErrors = Object.fromEntries(body.data.errors.map((issue) => [issue.path.join('.'), issue.message]))
    throw new ApiValidationError(message, fieldErrors)
  }

  throw new ApiError(message, status)
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  return 'Something went wrong'
}
