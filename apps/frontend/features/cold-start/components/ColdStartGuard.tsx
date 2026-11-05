'use client'

import { useQuery } from '@tanstack/react-query'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { coldStartCheckQueryOptions } from '@/features/cold-start/api/queries'
import { COLD_START_ROUTE } from '@/features/cold-start/routes'

/** Renders nothing. Checks the backend on page load and window refocus; if it is asleep, sends the user to the cold-start page. */
export function ColdStartGuard() {
  const onColdStartPage = usePathname().startsWith(COLD_START_ROUTE)
  const { data } = useQuery({ ...coldStartCheckQueryOptions(), enabled: !onColdStartPage })
  const waking = data?.state === 'waking'

  useEffect(() => {
    if (!waking || onColdStartPage) return
    const next = window.location.pathname + window.location.search
    window.location.replace(`${COLD_START_ROUTE}?next=${encodeURIComponent(next)}`)
  }, [waking, onColdStartPage])

  return null
}
