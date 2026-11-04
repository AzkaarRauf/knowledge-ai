import { Logger } from '@nestjs/common'
import { ThrottlerStorage } from '@nestjs/throttler'
import { RateLimitUnavailableException } from 'src/common/exceptions/rate-limit.exceptions.js'
import { type RedisClient } from 'src/redis/redis.constants.js'

// fixed window counter + block key, in one atomic step.
// KEYS: hits key, block key. ARGV: ttl ms, limit, block ms. returns { hits, window ms left, block ms left }
const INCREMENT_SCRIPT = `
local hits = redis.call('INCR', KEYS[1])
local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then
    redis.call('PEXPIRE', KEYS[1], ARGV[1])
    ttl = tonumber(ARGV[1])
end
local blockTtl = redis.call('PTTL', KEYS[2])
if blockTtl < 0 then blockTtl = 0 end
local blockMs = tonumber(ARGV[3])
if blockTtl == 0 and hits > tonumber(ARGV[2]) and blockMs > 0 then
    redis.call('SET', KEYS[2], '1', 'PX', blockMs)
    blockTtl = blockMs
end
return { hits, ttl, blockTtl }
`

/** throttler counts in redis, so they survive restarts. redis down means every request fails (fail closed) */
export class RedisThrottlerStorage implements ThrottlerStorage {
    private logger = new Logger(RedisThrottlerStorage.name)

    constructor(private readonly redis: RedisClient) {}

    async increment(key: string, ttl: number, limit: number, blockDuration: number): ReturnType<ThrottlerStorage['increment']> {
        let reply: unknown
        try {
            reply = await this.redis.eval(INCREMENT_SCRIPT, {
                keys: [`throttle:${key}`, `throttle:${key}:blocked`],
                arguments: [String(ttl), String(limit), String(blockDuration)],
            })
        } catch (e) {
            this.logger.error(e)
            throw new RateLimitUnavailableException()
        }
        const [totalHits, ttlMs, blockMs] = (reply as number[]).map(Number)
        return {
            totalHits,
            // throttler wants seconds here
            timeToExpire: Math.ceil(ttlMs / 1000),
            isBlocked: blockMs > 0,
            timeToBlockExpire: Math.ceil(blockMs / 1000),
        }
    }
}
