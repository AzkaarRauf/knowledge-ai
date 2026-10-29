import { env } from '@/lib/env'
import axios from 'axios'
import { RefreshTokenResponse } from 'shared'
import { z } from 'zod'

// lets React re-render when the token changes (see useRole)
const tokenListeners = new Set<() => void>()

export function subscribeAccessToken(listener: () => void) {
  tokenListeners.add(listener)
  return () => {
    tokenListeners.delete(listener)
  }
}

export const ROLES = ['ADMIN', 'USER'] as const
export type Role = (typeof ROLES)[number]

export const REFRESH_TOKEN_PATH = '/auth/refresh-token'
export const LOGIN_ROUTE = '/auth/login'
export const HOME_ROUTE = '/'

/**
 * Full page load to the login page, called from outside React (the axios interceptor) when
 * the session can't be refreshed. The reload also drops the query cache. No-op on auth pages
 * so a failed refresh there doesn't loop.
 */
export function redirectToLogin() {
  if (typeof window === 'undefined' || window.location.pathname.startsWith('/auth/')) return
  window.location.assign(LOGIN_ROUTE)
}

const RefreshTokenResponseSchema = z.object({
  token: z.string().catch(''),
}) satisfies z.ZodType<RefreshTokenResponse>

// Bare instance: the refresh call must not go through `api`'s 401 interceptor.
const refreshClient = axios.create({ baseURL: env.NEXT_PUBLIC_API_BASE_URL, withCredentials: true })

let refreshPromise: Promise<string> | null = null

/**
 * Rotates the refresh cookie and stores the new access token. Concurrent callers share one
 * request: the backend deletes the old refresh token, so a second parallel call would fail.
 */
export function refreshAccessToken() {
  refreshPromise ??= refreshClient
    .get(REFRESH_TOKEN_PATH)
    .then((res) => {
      const { token } = RefreshTokenResponseSchema.parse(res.data)
      if (!token) throw new Error('Refresh returned no token')
      return token
    })
    .catch((error: unknown) => {
      throw error
    })
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}
