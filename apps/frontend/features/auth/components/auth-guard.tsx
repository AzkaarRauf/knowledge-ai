'use client'

import { useRouter } from 'next/navigation'
import { type ReactNode, useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { LOGIN_ROUTE, getAccessToken, refreshAccessToken } from '@/lib/auth'

/**
 * Renders children only for a signed-in user. The access token lives in memory, so after a
 * reload it is restored from the refresh cookie; if that fails the user is sent to login.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getAccessToken()))

  useEffect(() => {
    if (isAuthenticated) return
    let cancelled = false
    // Concurrent calls (e.g. Strict Mode's double effect) share one refresh request.
    refreshAccessToken()
      .then(() => {
        if (!cancelled) setIsAuthenticated(true)
      })
      .catch(() => {
        if (!cancelled) router.replace(LOGIN_ROUTE)
      })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) return <AuthGuardSkeleton />
  return children
}

function AuthGuardSkeleton() {
  return (
    <div role="status" aria-label="Checking session" className="flex flex-1 flex-col gap-4 p-8">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-5 w-full max-w-md" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
