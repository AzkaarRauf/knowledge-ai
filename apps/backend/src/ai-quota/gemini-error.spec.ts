import { GEMINI_DEFAULT_COOLDOWN_MS } from './ai-quota.constants.js'
import { geminiRetryAfterMs } from './gemini-error.js'

describe('geminiRetryAfterMs', () => {
    it('is null for errors that are not a 429', () => {
        expect(geminiRetryAfterMs(new Error('boom'))).toBeNull()
        expect(geminiRetryAfterMs(Object.assign(new Error('bad'), { status: 400 }))).toBeNull()
        expect(geminiRetryAfterMs('not an error')).toBeNull()
    })

    it('reads the RetryInfo delay', () => {
        const error = Object.assign(new Error('quota'), { status: 429, errorDetails: [{}, { retryDelay: '17s' }] })
        expect(geminiRetryAfterMs(error)).toBe(17_000)
    })

    it('reads the delay from the message', () => {
        expect(geminiRetryAfterMs(new Error('[429 Too Many Requests] Please retry in 2.5s.'))).toBe(2500)
    })

    it('falls back to the default cooldown', () => {
        expect(geminiRetryAfterMs(new Error('RESOURCE_EXHAUSTED'))).toBe(GEMINI_DEFAULT_COOLDOWN_MS)
    })
})
