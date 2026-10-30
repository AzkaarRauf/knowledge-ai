import { createUserRequestSchema, roleSchema, updateUserRequestSchema, type userSchema } from 'shared'
import { z } from 'zod'

export const UserSchema = z.object({
  id: z.string().catch(''),
  name: z.string().catch(''),
  email: z.string().catch(''),
  role: roleSchema.catch('USER'),
  departmentId: z.string().catch(''),
  department: z.object({ id: z.string().catch(''), name: z.string().catch('') }).catch({ id: '', name: '' }),
  createdAt: z.string().catch(''),
  updatedAt: z.string().catch(''),
}) satisfies z.ZodType<z.input<typeof userSchema>>
export type User = z.infer<typeof UserSchema>

export const UserListSchema = z.array(UserSchema).catch([])

export const CreateUserRequestSchema = createUserRequestSchema
export type CreateUserRequest = z.input<typeof CreateUserRequestSchema>

export const UpdateUserRequestSchema = updateUserRequestSchema
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>

export const ROLE_OPTIONS = [
  { value: 'USER', label: 'User' },
  { value: 'ADMIN', label: 'Admin' },
] as const

export const roleLabel = (role: User['role']) => ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role

export const CreateUserFormSchema = createUserRequestSchema
export type CreateUserFormInput = z.input<typeof CreateUserFormSchema>

/** Edit form: name, email and department only; role cannot change. */
export const EditUserFormSchema = updateUserRequestSchema.required()
export type EditUserFormInput = z.input<typeof EditUserFormSchema>
