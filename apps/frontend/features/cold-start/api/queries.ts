import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'

const ColdStartStatusSchema = z.object({ state: z.enum(['ready', 'waking', 'down']) })

const POLL_INTERVAL_MS = 5000

// Calls our own Next route, not the backend, so it skips the shared axios client.
async function getColdStartStatus() {
  const res = await fetch('/cold-start/status', { cache: 'no-store' })
  return ColdStartStatusSchema.parse(await res.json())
}

export const coldStartKeys = {
  check: ['cold-start', 'check'] as const,
  status: ['cold-start', 'status'] as const,
}

/** Background check to spot a sleeping backend: on load and on window refocus. No polling outside the cold-start page. */
export const coldStartCheckQueryOptions = () =>
  queryOptions({
    queryKey: coldStartKeys.check,
    queryFn: getColdStartStatus,
    // Stale right away so every refocus re-checks (the backend may have slept while the tab was hidden).
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: false,
  })

/** Polls while the cold-start page waits for the backend. */
export const coldStartStatusQueryOptions = () =>
  queryOptions({
    queryKey: coldStartKeys.status,
    queryFn: getColdStartStatus,
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    retry: false,
    gcTime: 0,
  })
