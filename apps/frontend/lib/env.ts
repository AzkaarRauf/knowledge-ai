import { z } from 'zod'

// Next inlines NEXT_PUBLIC_* vars only when referenced literally, so list each one by name.
export const env = z
  .object({ NEXT_PUBLIC_API_BASE_URL: z.string().default('/api/v1') })
  .parse({ NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL })
