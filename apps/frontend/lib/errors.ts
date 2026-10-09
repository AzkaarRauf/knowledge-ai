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

export class ApiValidationError extends ApiError {
  constructor(
    message: string,
    public readonly fieldErrors: Record<string, string>,
  ) {
    super(message, 400)
    this.name = 'ApiValidationError'
  }
}

const ErrorBodySchema = z.object({
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

export function handleErrorResponse(error: unknown): never {
  if (!isAxiosError(error)) throw error

  const status = error.response?.status ?? 0
  const body = ErrorBodySchema.safeParse(error.response?.data)
  const rawMessage = body.success ? body.data.message : ''
  const message =
    (Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage) ||
    (status ? `Request failed (${status})` : 'Network error')

  // Nest StandardSchemaValidationPipe: { statusCode: 400, message, errors: [{ path, message }] }
  if (status === 400 && body.success && body.data.errors) {
    const fieldErrors = Object.fromEntries(
      body.data.errors.map((issue) => [issue.path.join('.'), issue.message]),
    )
    throw new ApiValidationError(message, fieldErrors)
  }

  throw new ApiError(message, status)
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  return 'Something went wrong'
}
