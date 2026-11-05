import { loadEnvFile } from 'node:process'
import z from 'zod'

// a missing .env is fine (e.g. on a host that sets env vars directly)
try {
    loadEnvFile()
} catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
}

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
    REDIS_CONNECTION_STRING: z.string().nonempty(),
    REDIS_CACHE_TTL_MS: z.coerce.number().optional(),
    // turn off the http throttler, e.g. for e2e tests. the gemini quota guard always stays on
    THROTTLE_ENABLED: z.stringbool().default(true),
    // proxies to trust for X-Forwarded-For. "true"/"false", a hop count (e.g. 2), or an ip/preset (e.g. loopback)
    TRUST_PROXY: z
        .string()
        .trim()
        .default('loopback')
        .transform((v): boolean | number | string => {
            if (v === 'true') return true
            if (v === 'false') return false
            if (/^d+$/.test(v)) return Number(v)
            return v
        }),
})

export const env = envSchema.parse(process.env)
