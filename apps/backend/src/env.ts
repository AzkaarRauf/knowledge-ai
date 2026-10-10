import { loadEnvFile } from 'node:process'
import z from 'zod'
import { passwordSchema } from './common/schemas/password.schema.js'

loadEnvFile()

const envSchema = z.object({
    PORT: z.coerce.number().default(8090),
    ENV: z.enum(['dev', 'prod']),
    DATABASE_URL: z.string().nonempty(),
    SEED_ADMIN_EMAIL: z.string().trim().pipe(z.email()).optional(),
    SEED_ADMIN_PASSWORD: passwordSchema.optional(),
})

export const env = envSchema.parse(process.env)
