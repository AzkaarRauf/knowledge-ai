import { loadEnvFile } from 'node:process'
import z from 'zod'

loadEnvFile()

const envSchema = z.object({
    PORT: z.coerce.number().default(8090),
    ENV: z.enum(['dev', 'prod']),
    DATABASE_URL: z.string().nonempty(),
})

export const env = envSchema.parse(process.env)
