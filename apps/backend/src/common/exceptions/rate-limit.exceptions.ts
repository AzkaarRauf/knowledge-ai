import { HttpException, HttpStatus } from '@nestjs/common'

// tells the frontend which limit was hit. part of the api contract, do not rename
export const RATE_LIMIT_CODE = {
    user: 'RATE_LIMIT_USER',
    aiDaily: 'AI_DAILY_LIMIT',
    aiBusy: 'AI_BUSY',
    unavailable: 'RATE_LIMIT_UNAVAILABLE',
} as const
export type RateLimitCode = (typeof RATE_LIMIT_CODE)[keyof typeof RATE_LIMIT_CODE]

// body of every 429/503 below. the http exception filter copies retryAfterSec into the Retry-After header
export type RateLimitBody = {
    statusCode: number
    message: string
    code: RateLimitCode
    retryAfterSec?: number
    resetAt?: string
}

abstract class RateLimitException extends HttpException {
    constructor(body: RateLimitBody) {
        super(body, body.statusCode)
    }
}

/** HTTP throttler: this user (or ip) sent too many requests */
export class RateLimitUserException extends RateLimitException {
    constructor(retryAfterSec: number) {
        const sec = Math.max(1, Math.ceil(retryAfterSec))
        super({
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Too many requests. Try again in ${sec}s.`,
            code: RATE_LIMIT_CODE.user,
            retryAfterSec: sec,
        })
    }
}

/** gemini daily budget is used up. resets at the next pacific midnight */
export class AiDailyLimitException extends RateLimitException {
    constructor(public readonly resetAt: Date) {
        super({
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Daily AI limit reached.',
            code: RATE_LIMIT_CODE.aiDaily,
            retryAfterSec: Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000)),
            resetAt: resetAt.toISOString(),
        })
    }
}

/** gemini per minute limit: chat would wait too long, the wait queue is full, or gemini sent a 429 */
export class AiBusyException extends RateLimitException {
    constructor(retryAfterSec?: number) {
        super({
            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            message: 'AI busy, try again in a few seconds.',
            code: RATE_LIMIT_CODE.aiBusy,
            ...(retryAfterSec !== undefined && { retryAfterSec: Math.max(1, Math.ceil(retryAfterSec)) }),
        })
    }
}

/** redis is down, so limits can't be checked. fail closed */
export class RateLimitUnavailableException extends RateLimitException {
    constructor() {
        super({
            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            message: 'Service temporarily unavailable. Try again shortly.',
            code: RATE_LIMIT_CODE.unavailable,
        })
    }
}
