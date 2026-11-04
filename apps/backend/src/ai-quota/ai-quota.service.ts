import { Inject, Injectable, Logger } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { setTimeout as sleep } from 'node:timers/promises'
import {
    AiBusyException,
    AiDailyLimitException,
    RateLimitUnavailableException,
} from 'src/common/exceptions/rate-limit.exceptions.js'
import { REDIS_CLIENT, type RedisClient } from 'src/redis/redis.constants.js'
import { AI_QUOTA, CHAT_MAX_WAIT_MS, CHAT_MAX_WAITING } from './ai-quota.constants.js'
import { nextPacificMidnight, pacificDate } from './pacific-time.js'

export type AiModel = 'llm' | 'embedding'
type Bucket = keyof typeof AI_QUOTA

// one limit to check. all rules of a reserve() pass or none are applied
type Rule =
    // sliding 60s window
    | { kind: 'minute'; bucket: Bucket; weight: number }
    // counter for the pacific day
    | { kind: 'day'; bucket: Bucket; weight: number }
    // pause set after gemini sent a 429
    | { kind: 'cooldown'; model: AiModel }

type ReserveResult = { status: 'ok' } | { status: 'wait'; waitMs: number } | { status: 'daily' }

const WINDOW_MS = 60_000
// day keys live a bit longer than a day, so a key never expires mid day
const DAY_KEY_TTL_MS = 48 * 60 * 60 * 1000
// self heals the waiting counter if the process dies mid wait
const WAITING_KEY_TTL_MS = 60_000

// checks every rule, then applies all of them, in one atomic step.
// KEYS: one per rule. ARGV: now, member id, then per rule: kind, limit, weight, ttl ms.
// window members are "<id>:<weight>", scored by time.
// returns { 1 } ok, { 0, wait ms } wait, { -1 } daily limit, { -2 } weight can never fit
const RESERVE_SCRIPT = `
local now = tonumber(ARGV[1])
local id = ARGV[2]
local rules = #KEYS
local maxWait = 0
local function weightOf(member) return tonumber(string.match(member, ':(%d+)$')) end
for i = 1, rules do
    local base = 2 + (i - 1) * 4
    local kind = ARGV[base + 1]
    local limit = tonumber(ARGV[base + 2])
    local weight = tonumber(ARGV[base + 3])
    local ttl = tonumber(ARGV[base + 4])
    local key = KEYS[i]
    if kind == 'cooldown' then
        local pttl = redis.call('PTTL', key)
        if pttl > maxWait then maxWait = pttl end
    elseif kind == 'day' then
        local used = tonumber(redis.call('GET', key) or '0')
        if used + weight > limit then return { -1 } end
    elseif kind == 'minute' then
        if weight > limit then return { -2 } end
        redis.call('ZREMRANGEBYSCORE', key, '-inf', now - ttl)
        local entries = redis.call('ZRANGE', key, 0, -1, 'WITHSCORES')
        local used = 0
        for j = 1, #entries, 2 do used = used + weightOf(entries[j]) end
        if used + weight > limit then
            -- wait until enough old entries leave the window
            local freed = 0
            for j = 1, #entries, 2 do
                freed = freed + weightOf(entries[j])
                if used - freed + weight <= limit then
                    local wait = tonumber(entries[j + 1]) + ttl - now
                    if wait > maxWait then maxWait = wait end
                    break
                end
            end
        end
    end
end
if maxWait > 0 then return { 0, maxWait } end
for i = 1, rules do
    local base = 2 + (i - 1) * 4
    local kind = ARGV[base + 1]
    local weight = tonumber(ARGV[base + 3])
    local ttl = tonumber(ARGV[base + 4])
    local key = KEYS[i]
    if kind == 'day' then
        redis.call('INCRBY', key, weight)
        redis.call('PEXPIRE', key, ttl)
    elseif kind == 'minute' then
        redis.call('ZADD', key, now, id .. ':' .. weight)
        redis.call('PEXPIRE', key, ttl + 1000)
    end
end
return { 1 }
`

/**
 * Strict gemini quota guard, shared by the api and the worker through redis.
 * Knows nothing about the http throttler. Redis down means every call fails (fail closed).
 */
@Injectable()
export class AiQuotaService {
    private logger = new Logger(AiQuotaService.name)

    constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisClient) {}

    /**
     * Reserves the whole chat up front (llm calls + 1 query embed), so a chat never stops halfway.
     * Waits up to CHAT_MAX_WAIT_MS. Throws AiDailyLimitException, AiBusyException or RateLimitUnavailableException.
     */
    async reserveChat({ llmCalls }: { llmCalls: number }) {
        const rules: Rule[] = [
            { kind: 'cooldown', model: 'llm' },
            { kind: 'cooldown', model: 'embedding' },
            { kind: 'day', bucket: 'llm', weight: llmCalls },
            { kind: 'day', bucket: 'embedding', weight: 1 },
            { kind: 'minute', bucket: 'llm', weight: llmCalls },
            { kind: 'minute', bucket: 'embedding', weight: 1 },
        ]
        const deadline = Date.now() + CHAT_MAX_WAIT_MS
        let waiting = false
        try {
            for (;;) {
                const result = await this.reserve(rules)
                if (result.status === 'ok') return
                if (result.status === 'daily') throw new AiDailyLimitException(nextPacificMidnight())
                if (Date.now() + result.waitMs > deadline) throw new AiBusyException(result.waitMs / 1000)
                if (!waiting) {
                    waiting = true
                    const count = await this.redisCall(() => this.redis.incr(this.waitingKey()))
                    await this.redisCall(() => this.redis.pExpire(this.waitingKey(), WAITING_KEY_TTL_MS))
                    if (count > CHAT_MAX_WAITING) throw new AiBusyException(result.waitMs / 1000)
                }
                await sleep(result.waitMs)
            }
        } finally {
            if (waiting) await this.redis.decr(this.waitingKey()).catch((e: unknown) => this.logger.error(e))
        }
    }

    /**
     * Reserves today's embedding budget for a whole document, so a big doc never stops halfway.
     * Throws AiDailyLimitException right away when it does not fit today.
     */
    async reserveIngestionDay(texts: number) {
        const result = await this.reserve([
            { kind: 'day', bucket: 'embedding', weight: texts },
            { kind: 'day', bucket: 'ingestion', weight: texts },
        ])
        if (result.status === 'daily') throw new AiDailyLimitException(nextPacificMidnight())
    }

    /** waits, as long as needed, until one ingestion batch fits the per minute quota */
    async waitIngestionMinute(texts: number) {
        const rules: Rule[] = [
            { kind: 'cooldown', model: 'embedding' },
            { kind: 'minute', bucket: 'embedding', weight: texts },
            { kind: 'minute', bucket: 'ingestion', weight: texts },
        ]
        for (;;) {
            const result = await this.reserve(rules)
            if (result.status === 'ok') return
            if (result.status === 'wait') await sleep(result.waitMs)
        }
    }

    /** pauses every call to this model, after gemini sent a 429 */
    async cooldown(model: AiModel, ms: number) {
        await this.redisCall(() => this.redis.set(this.cooldownKey(model), '1', { expiration: { type: 'PX', value: ms } }))
    }

    private async reserve(rules: Rule[]): Promise<ReserveResult> {
        const day = pacificDate()
        const keys = rules.map((rule) => {
            if (rule.kind === 'cooldown') return this.cooldownKey(rule.model)
            if (rule.kind === 'day') return `ai-quota:${rule.bucket}:day:${day}`
            return `ai-quota:${rule.bucket}:minute`
        })
        const args = rules.flatMap((rule) => {
            if (rule.kind === 'cooldown') return [rule.kind, '0', '0', '0']
            if (rule.kind === 'day')
                return [rule.kind, String(AI_QUOTA[rule.bucket].perDay), String(rule.weight), String(DAY_KEY_TTL_MS)]
            return [rule.kind, String(AI_QUOTA[rule.bucket].perMinute), String(rule.weight), String(WINDOW_MS)]
        })
        const reply = await this.redisCall(() =>
            this.redis.eval(RESERVE_SCRIPT, { keys, arguments: [String(Date.now()), randomUUID(), ...args] }),
        )
        const [code, waitMs] = (reply as number[]).map(Number)
        if (code === 1) return { status: 'ok' }
        if (code === 0) return { status: 'wait', waitMs: Math.max(1, waitMs) }
        if (code === -1) return { status: 'daily' }
        throw new Error('AI quota request is bigger than the per minute limit')
    }

    // any redis error means limits can't be checked, so fail closed
    private async redisCall<T>(fn: () => Promise<T>) {
        try {
            return await fn()
        } catch (e) {
            this.logger.error(e)
            throw new RateLimitUnavailableException()
        }
    }

    private cooldownKey(model: AiModel) {
        return `ai-quota:${model}:cooldown`
    }

    private waitingKey() {
        return 'ai-quota:chat:waiting'
    }
}
