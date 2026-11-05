// Server-only: BACKEND_URL is not exposed to the browser.
const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8090'

// Render puts this header on its 503 while a sleeping free service spins back up.
const WAKE_HEADER = 'x-render-routing'
const WakeValues = new Set([
  'hibernate-pending-wake',
  // Set when the service is suspended by hand in Render. Off for now: behaviour not decided yet.
  // 'suspend-by-user'
])

// Give up if the backend is slow to answer for some other reason; the caller sees "down".
const CHECK_TIMEOUT_MS = 3000

// Render only answers right away with the 503 + wake header when the request accepts HTML.
// Other requests get held until the service is up.
const BROWSER_NAVIGATION_HEADERS = {
  accept: 'text/html',
}

export type BackendState = 'ready' | 'waking' | 'down'

/** Hit the backend URL directly and say whether it is up, waking, or down. */
export async function getBackendState(): Promise<BackendState> {
  try {
    const res = await fetch(backendUrl, {
      headers: BROWSER_NAVIGATION_HEADERS,
      cache: 'no-store',
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
    })
    if (res.status === 503 && WakeValues.has(res.headers.get(WAKE_HEADER) ?? '')) return 'waking'
    // Any other answer (even a 404 for the root path) means the backend is awake.
    return 'ready'
  } catch {
    return 'down'
  }
}
