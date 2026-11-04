import { ThrottlerOptions } from '@nestjs/throttler'

// basic http limits, per user (or per ip when not logged in). ttl is in ms.
// gemini quota is guarded separately, in AiQuotaService
export const THROTTLERS = [
    // stops bursts and runaway frontend loops
    { name: 'short', limit: 20, ttl: 1000 },
    // normal app use stays well below this
    { name: 'long', limit: 300, ttl: 60_000 },
] as const satisfies ThrottlerOptions[]

// costly or public routes: chat, upload, auth
export const STRICT_THROTTLE = { long: { limit: 10, ttl: 60_000 } }

// public read routes
export const PUBLIC_THROTTLE = { long: { limit: 30, ttl: 60_000 } }

// pass to @SkipThrottle to skip every named throttler
export const SKIP_ALL_THROTTLERS = Object.fromEntries(THROTTLERS.map(({ name }) => [name, true]))
