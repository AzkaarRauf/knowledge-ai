import { JwtPayload, loginRequestSchema, registerRequestSchema, roleSchema, type LoginResponse } from 'shared'
import z from 'zod'

const defaultCredentialResponse = {
  departmentId: '',
  email: '',
  role: 'USER',
  userId: '',
} satisfies JwtPayload

export const CredentialsResponseSchema = z
  .object({
    departmentId: z.string().catch(''),
    email: z.string().catch(''),
    role: roleSchema.catch('USER'),
    userId: z.string().catch(''),
  })
  .catch(defaultCredentialResponse) satisfies z.ZodType<JwtPayload>

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
    credentials: CredentialsResponseSchema,
  })
  .catch({
    token: '',
    user: { department: { id: '', name: '' }, email: '', id: '', name: '' },
    credentials: defaultCredentialResponse,
  }) satisfies z.ZodType<LoginResponse>

export const RegisterRequestSchema = registerRequestSchema
export const RegisterResponseSchema = LoginResponseSchema
