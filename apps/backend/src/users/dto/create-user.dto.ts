import z from 'zod'
import { createZodDto } from 'nestjs-zod'
import { passwordSchema } from 'shared'

export const createUserSchema = z.object({
    name: z.string('Name is required').trim().nonempty('Name is required'),
    email: z.string('email is required').trim().pipe(z.email('Invalid email')),
    password: passwordSchema,
    departmentId: z.uuid('Department id is required'),
})

export class CreateUserDto extends createZodDto(createUserSchema) {}
