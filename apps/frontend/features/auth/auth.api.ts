import { api } from '@/lib/api-client'
import { type LoginRequest, type LoginResponse, RegisterRequest, RegisterResponse } from 'shared'
import { CredentialsResponseSchema, LoginResponseSchema, RegisterResponseSchema } from './auth.schema'

export async function login(body: LoginRequest): Promise<LoginResponse> {
  const res = await api.post('/auth/login', body)
  const data = LoginResponseSchema.parse(res.data)
  return data
}

export async function register(body: RegisterRequest): Promise<RegisterResponse> {
  const res = await api.post('/auth/register', body)
  const data = RegisterResponseSchema.parse(res.data)
  return data
}

export async function logout() {
  await api.delete('/auth/logout')
}

export async function getCredentials() {
  const res = await api.get('/auth/credentials')
  const data = CredentialsResponseSchema.parse(res.data)
  return data
}
