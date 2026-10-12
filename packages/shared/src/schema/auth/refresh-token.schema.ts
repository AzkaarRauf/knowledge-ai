import z from 'zod'

export const refreshTokenResponseSchema = z.object({
    token: z.jwt(),
})
export type RefreshTokenResponse = z.infer<typeof refreshTokenResponseSchema>
