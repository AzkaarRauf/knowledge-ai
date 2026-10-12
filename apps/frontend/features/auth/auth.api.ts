import { api } from '@/lib/api-client'
import { type LoginResponse, type LoginRequest, RegisterRequest, RegisterResponse } from 'shared'
import { LoginResponseSchema, RegisterResponseSchema } from './auth.schema'

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
