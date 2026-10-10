import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const loginSchema = z.object({
    email: z.email('Invalid email').trim(),
    password: z.string().nonempty('Password is required'),
})

export class LoginDto extends createZodDto(loginSchema) {}
