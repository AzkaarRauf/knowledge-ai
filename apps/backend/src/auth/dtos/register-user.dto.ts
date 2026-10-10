import { createZodDto } from 'nestjs-zod'
import { passwordSchema } from 'src/common/schemas/password.schema.js'
import z from 'zod'

export const registerUserSchema = z.object({
    name: z.string('Name is required').trim().nonempty('Name is required'),
    email: z.string('email is required').trim().pipe(z.email('Invalid email')),
    password: passwordSchema,
    departmentId: z.uuid('Department id is required'),
})

export class RegisterUserDto extends createZodDto(registerUserSchema) {}
