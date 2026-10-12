import axios, { isAxiosError, type InternalAxiosRequestConfig } from 'axios'
import { REFRESH_TOKEN_PATH, authHeaders, redirectToLogin, refreshAccessToken } from '@/lib/auth'
import { env } from '@/lib/env'
import { handleErrorResponse } from '@/lib/errors'

export const api = axios.create({ baseURL: env.NEXT_PUBLIC_API_BASE_URL })

api.interceptors.request.use((config) => {
  for (const [key, value] of Object.entries(authHeaders())) config.headers.set(key, value)
  return config
})

type RetryableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

// Login/register 401s are bad credentials, not an expired token.
const NO_REFRESH_PATHS = ['/auth/login', '/auth/register', '/auth/logout', REFRESH_TOKEN_PATH]

/** On a 401, rotate the token once and replay the request; otherwise map to a typed error. */
async function retryAfterRefresh(error: unknown) {
  const config = isAxiosError(error) ? (error.config as RetryableConfig | undefined) : undefined
  const shouldRefresh =
    isAxiosError(error) &&
    error.response?.status === 401 &&
    config &&
    !config._retried &&
    !NO_REFRESH_PATHS.some((path) => config.url?.startsWith(path))

  if (!shouldRefresh) return handleErrorResponse(error)

  config._retried = true
  try {
    await refreshAccessToken()
  } catch {
    redirectToLogin()
    return handleErrorResponse(error)
  }
  // The request interceptor re-applies the new token.
  return api(config)
}

api.interceptors.response.use((res) => res, retryAfterRefresh)
