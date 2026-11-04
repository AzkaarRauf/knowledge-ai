import { nextPacificMidnight, pacificDate } from './pacific-time.js'

describe('pacific time', () => {
    it('gives the pacific date, not the utc date', () => {
        // 03:00 utc on nov 5 is still nov 4 in pacific
        expect(pacificDate(new Date('2026-11-05T03:00:00Z'))).toBe('2026-11-04')
    })

    it('finds the next midnight in winter (PST, utc-8)', () => {
        expect(nextPacificMidnight(new Date('2026-12-10T20:00:00Z')).toISOString()).toBe('2026-12-11T08:00:00.000Z')
    })

    it('finds the next midnight in summer (PDT, utc-7)', () => {
        expect(nextPacificMidnight(new Date('2026-07-10T20:00:00Z')).toISOString()).toBe('2026-07-11T07:00:00.000Z')
    })

    it('handles the day daylight saving ends', () => {
        // nov 1 2026: clocks go back at 2am. next midnight is nov 2, in PST
        expect(nextPacificMidnight(new Date('2026-11-01T12:00:00Z')).toISOString()).toBe('2026-11-02T08:00:00.000Z')
    })
})
