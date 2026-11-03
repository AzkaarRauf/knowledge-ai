import { redirect } from 'next/navigation'
import { type ReactNode, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { getCredentials } from '@/features/auth/auth.server'

const HOME_ROUTE = '/'

/**
 * Server-side admin check for a route segment: non-admins are sent home.
 * Reading the cookie is request-time, so the check streams in behind Suspense.
 * Only hides UI; the backend still checks the role.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<AdminGateSkeleton />}>
      <AdminCheck>{children}</AdminCheck>
    </Suspense>
  )
}

async function AdminCheck({ children }: { children: ReactNode }) {
  const credentials = await getCredentials()
  if (credentials?.role !== 'ADMIN') redirect(HOME_ROUTE)
  return children
}

function AdminGateSkeleton() {
  return (
    <div role="status" aria-label="Checking access" className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-8 sm:py-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}
