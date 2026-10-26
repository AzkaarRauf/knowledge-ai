'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { useRole } from '@/features/auth/hooks/role.hook'
import { HOME_ROUTE } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { type ReactNode, useEffect } from 'react'

/**
 * Renders children only for admins; other users are sent to the home page.
 * Only hides UI; the backend still checks the role.
 */
export function AdminOnly({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { isAdmin, isPending } = useRole()

  useEffect(() => {
    if (!isPending && !isAdmin) router.replace(HOME_ROUTE)
  }, [isPending, isAdmin, router])

  // keep the skeleton up while the redirect happens
  if (isPending || !isAdmin) return <AdminOnlySkeleton />
  return children
}

function AdminOnlySkeleton() {
  return (
    <div role="status" aria-label="Checking access" className="mx-auto w-full max-w-4xl space-y-4 p-6">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
