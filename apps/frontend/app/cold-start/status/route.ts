import { getBackendState } from '@/features/cold-start/lib/backend-state'

/** Backend state for the browser: checked by the guard on load/refocus, polled by the cold-start page until ready. */
export async function GET() {
  const state = await getBackendState()
  return Response.json({ state }, { headers: { 'Cache-Control': 'no-store' } })
}
