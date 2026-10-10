import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const loginResponseSchema = z.object({
    user: z.object({
        id: z.uuid(),
        name: z.string(),
        email: z.email(),
        department: z.object({
            id: z.uuid(),
            name: z.string(),
        }),
    }),
    token: z.jwt(),
})

export class LoginResponseDto extends createZodDto(loginResponseSchema) {}
