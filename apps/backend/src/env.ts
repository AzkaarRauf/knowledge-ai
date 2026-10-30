import { loadEnvFile } from 'node:process'
import z from 'zod'

loadEnvFile()

const envSchema = z.object({
    PORT: z.coerce.number().default(8090),
    ENV: z.enum(['dev', 'prod']),
    DATABASE_URL: z.string().nonempty(),
    SEED_ADMIN_EMAIL: z.string().trim().pipe(z.email()).optional(),
    JWT_SECRET: z.string().nonempty(),
    GOOGLE_API_KEY: z.string().nonempty(),
    AWS_ENDPOINT_URL_S3: z.url(),
    AWS_ACCESS_KEY_ID: z.string().nonempty(),
    AWS_SECRET_ACCESS_KEY: z.string().nonempty(),
    AWS_REGION: z.string().nonempty(),
    S3_BUCKET: z.string().nonempty(),
    GOOGLE_CLIENT_ID: z.string().nonempty(),
    GOOGLE_CLIENT_SECRET: z.string().nonempty(),
    GOOGLE_REDIRECT_URI: z.url(),
    // comma separated domains, e.g. "acme.com,acme.io". matched against google's `hd` claim
    ALLOWED_DOMAINS: z
        .string()
        .transform((s) =>
            s
                .split(',')
                .map((d) => d.trim().toLowerCase())
                .filter(Boolean),
        )
        .pipe(z.array(z.string()).nonempty('At least one domain is required')),
})

export const env = envSchema.parse(process.env)
