import z from 'zod'
import { roleSchema } from './role.schema.js'

export const jwtPayloadSchema = z.object({
    userId: z.uuid(),
    email: z.email(),
    departmentId: z.uuid(),
    role: roleSchema,
})
export type JwtPayload = z.infer<typeof jwtPayloadSchema>
