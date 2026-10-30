import { JwtPayload, roleSchema } from 'shared'
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
