// gemini daily quota resets at midnight pacific time
const TIME_ZONE = 'America/Los_Angeles'

// en-CA formats as YYYY-MM-DD
const dateFormat = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })
const timeFormat = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

/** pacific calendar date, e.g. "2026-11-04". used in daily quota keys */
export function pacificDate(at = new Date()) {
    return dateFormat.format(at)
}

/** the next midnight in pacific time, when the gemini daily quota resets */
export function nextPacificMidnight(at = new Date()) {
    const [year, month, day] = pacificDate(at).split('-').map(Number)
    // pacific is utc-8 (PST) or utc-7 (PDT). keep the one that lands on 00:00 pacific
    for (const offsetHours of [8, 7]) {
        const candidate = new Date(Date.UTC(year, month - 1, day + 1, offsetHours))
        if (timeFormat.format(candidate) === '00:00') return candidate
    }
    // never reached, both offsets are covered above
    return new Date(Date.UTC(year, month - 1, day + 1, 8))
}
