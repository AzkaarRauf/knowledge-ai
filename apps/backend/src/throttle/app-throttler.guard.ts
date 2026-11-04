import { ExecutionContext, Injectable } from '@nestjs/common'
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler'
import { type Request } from 'express'
import { RateLimitUserException } from 'src/common/exceptions/rate-limit.exceptions.js'
import { env } from 'src/env.js'

/**
 * Throttler that counts per user when logged in, else per ip.
 * Must run after AuthGuard, so `req.jwtPayload` is set.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
    protected override shouldSkip(): Promise<boolean> {
        return Promise.resolve(!env.THROTTLE_ENABLED)
    }

    // req.ip is the real client ip because main.ts trusts the next.js proxy (X-Forwarded-For)
    protected override getTracker(req: Request): Promise<string> {
        const userId = req.jwtPayload?.userId
        return Promise.resolve(userId ? `user:${userId}` : `ip:${req.ip}`)
    }

    protected override throwThrottlingException(_context: ExecutionContext, detail: ThrottlerLimitDetail): Promise<void> {
        throw new RateLimitUserException(detail.timeToBlockExpire)
    }
}
