import { cookies } from 'next/headers'
import { cache } from 'react'
import 'server-only'
import { ACCESS_TOKEN_COOKIE_NAME, jwtPayloadSchema } from 'shared'

/**
 * Reads the user from the access token cookie. Only decodes, does not verify: use it to pick
 * what UI to show, the backend still checks the token on every call.
 * `cache` makes many calls in one request decode only once.
 */
export const getCredentials = cache(async () => {
  const c = await cookies()
  const accessToken = c.get(ACCESS_TOKEN_COOKIE_NAME)?.value
  if (!accessToken) return null
  const payloadBase64 = accessToken.split('.').at(1)
  if (!payloadBase64) return null
  try {
    // JWT parts are base64url, not plain base64
    const payloadString = Buffer.from(payloadBase64, 'base64url').toString('utf-8')
    const result = jwtPayloadSchema.safeParse(JSON.parse(payloadString))
    return result.success ? result.data : null
  } catch {
    return null
  }
})
