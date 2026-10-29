import z from 'zod'
import { roleSchema } from '../auth/role.schema.js'
import { passwordSchema } from '../common/password.schema.js'
import { isoDateSchema } from '../common/date.schema.js'
import { publicDepartmentSchema } from '../departments/department.schema.js'

/** A user as admins see it. Never carries the password hash. */
export const userSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
    role: roleSchema,
    departmentId: z.uuid(),
    department: publicDepartmentSchema,
    createdAt: isoDateSchema,
    updatedAt: isoDateSchema,
})
export type User = z.infer<typeof userSchema>

const userFieldsSchema = z.object({
    name: z.string('Name is required').trim().nonempty('Name is required'),
    email: z.string('email is required').trim().pipe(z.email('Invalid email')),
    password: passwordSchema,
    departmentId: z.uuid('Department id is required'),
    role: roleSchema,
})

export const createUserRequestSchema = userFieldsSchema.extend({ role: roleSchema.default('USER') })
export type CreateUserRequest = z.infer<typeof createUserRequestSchema>

/** Every field optional */
export const updateUserRequestSchema = userFieldsSchema.omit({ password: true, role: true }).partial()
export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>
