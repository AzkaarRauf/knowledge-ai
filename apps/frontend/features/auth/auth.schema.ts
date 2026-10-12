import { loginRequestSchema, registerRequestSchema, type LoginResponse } from 'shared'
import z from 'zod'

export const LoginRequestSchema = loginRequestSchema

export const LoginResponseSchema = z
  .object({
    token: z.string().catch(''),
    user: z.object({
      department: z.object({
        id: z.string().catch(''),
        name: z.string().catch(''),
      }) satisfies z.ZodType<LoginResponse['user']['department']>,
      email: z.string().catch(''),
      id: z.string().catch(''),
      name: z.string().catch(''),
    }) satisfies z.ZodType<LoginResponse['user']>,
  })
  .catch({
    token: '',
    user: { department: { id: '', name: '' }, email: '', id: '', name: '' },
  }) satisfies z.ZodType<LoginResponse>

export const RegisterRequestSchema = registerRequestSchema
export const RegisterResponseSchema = LoginResponseSchema
