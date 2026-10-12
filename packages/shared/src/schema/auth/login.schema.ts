import z from 'zod'

export const loginRequestSchema = z.object({
    email: z.string().trim().pipe(z.email('Invalid email')),
    password: z.string().nonempty('Password is required'),
})
export type LoginRequest = z.infer<typeof loginRequestSchema>

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

export type LoginResponse = z.infer<typeof loginResponseSchema>
