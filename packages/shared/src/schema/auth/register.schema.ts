import z from 'zod'
import { passwordSchema } from '../common/password.schema.js'
import { loginResponseSchema } from './login.schema.js'

export const registerRequestSchema = z.object({
    name: z.string('Name is required').trim().nonempty('Name is required'),
    email: z.string('email is required').trim().pipe(z.email('Invalid email')),
    password: passwordSchema,
    departmentId: z.uuid('Department id is required'),
})
export type RegisterRequest = z.infer<typeof registerRequestSchema>

export const registerResponseSchema = loginResponseSchema
export type RegisterResponse = z.infer<typeof registerResponseSchema>
