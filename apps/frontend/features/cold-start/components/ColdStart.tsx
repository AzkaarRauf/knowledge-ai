'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { BrandMark } from '@/components/shell/Brand'
import { MadeBy } from '@/features/about/components/MadeBy'
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
    <div className="relative flex min-h-dvh flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="mb-3 flex items-center gap-3">
        <BrandMark className="size-11" />
        <span className="text-xl font-semibold tracking-tight">Knowledge AI</span>
      </div>
      <span role="status" aria-label="Loading" className="flex h-6 items-center gap-1.5">
        {/* each dot starts later, so they jump one after another */}
        {['0ms', '150ms', '300ms'].map((delay) => (
          <span
            key={delay}
            className="size-2 animate-bounce rounded-full bg-muted-foreground motion-reduce:animate-none"
            style={{ animationDelay: delay }}
          />
        ))}
      </span>
      <h1 className="text-lg font-medium">{ready ? 'Ready, taking you back…' : 'Waking up the server…'}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        {data?.state === 'down'
          ? 'The server is not responding yet. Still trying.'
          : 'It sleeps when idle. This usually takes under a minute.'}
      </p>
      <MadeBy className="absolute bottom-6" />
    </div>
  )
}
