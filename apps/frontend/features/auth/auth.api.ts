import { api } from '@/lib/api-client'
import { env } from '@/lib/env'
import { CredentialsResponseSchema } from './auth.schema'

/** Backend route that starts google oauth. Open with a full page load, not axios. */
export const GOOGLE_LOGIN_URL = `${env.NEXT_PUBLIC_API_BASE_URL}/auth/google`

export async function logout() {
  await api.delete('/auth/logout')
}

export async function getCredentials() {
  const res = await api.get('/auth/credentials')
  const data = CredentialsResponseSchema.parse(res.data)
  return data
}
