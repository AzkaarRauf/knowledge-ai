'use client'

import { useEffect } from 'react'
import { HOME_ROUTE } from '@/lib/auth'

/**
 * Sends the user home with a new, same-site navigation. A server redirect would stay in the
 * cross-site chain started by google, so the browser would leave out the Strict auth cookies.
 */
export function GoogleDoneRedirect() {
  useEffect(() => {
    window.location.replace(HOME_ROUTE)
  }, [])

  return (
    <div role="status" aria-label="Signing in" className="flex min-h-svh items-center justify-center">
      <Spinner />
    </div>
  )
}

/** Material-style spinner: the arc grows and shrinks while the whole ring turns. */
function Spinner() {
  return (
    <svg viewBox="0 0 50 50" aria-hidden="true" className="size-12 animate-spin text-primary">
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="1 150"
      >
        <animate attributeName="stroke-dasharray" values="1 150;90 150;90 150" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="stroke-dashoffset" values="0;-35;-124" dur="1.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}
