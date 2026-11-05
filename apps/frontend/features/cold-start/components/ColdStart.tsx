'use client'

import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { coldStartStatusQueryOptions } from '@/features/cold-start/api/queries'
import { safeReturnPath } from '@/features/cold-start/routes'

/** Shown while the backend wakes up. Polls status, then sends the user back where they were. */
export function ColdStart() {
  const { data } = useQuery(coldStartStatusQueryOptions())
  const ready = data?.state === 'ready'

  useEffect(() => {
    if (!ready) return
    // Read `next` here, not via searchParams, so the page stays static and needs no Suspense.
    const next = new URLSearchParams(window.location.search).get('next')
    // Full reload so the page and its data load fresh against the now-awake backend.
    window.location.replace(safeReturnPath(next))
  }, [ready])

  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
      <h1 className="text-lg font-medium">{ready ? 'Ready, taking you back…' : 'Waking up the server…'}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        {data?.state === 'down'
          ? 'The server is not responding yet. Still trying.'
          : 'It sleeps when idle. This usually takes under a minute.'}
      </p>
    </div>
  )
}
