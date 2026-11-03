'use client'

import { useQuery } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { healthQueryOptions } from '@/features/health/api/queries'
import { cn } from '@/lib/utils'

/** One-line backend status: dot, label, refresh button. */
export function HealthStatus({ className }: { className?: string }) {
  const { data, isPending, isError, isFetching, refetch } = useQuery(healthQueryOptions())

  const ok = !isError && data?.status === 'ok'
  const label = isError ? 'Service unreachable' : ok ? 'All systems operational' : 'Service degraded'

  return (
    <div className={cn('flex items-center justify-between gap-2 text-xs text-muted-foreground', className)}>
      {isPending ? (
        <HealthStatusSkeleton />
      ) : (
        <span className="flex items-center gap-2" title="Backend health">
          <span className="relative flex size-2">
            {ok && <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-50" />}
            <span className={cn('relative inline-flex size-2 rounded-full', ok ? 'bg-success' : 'bg-destructive')} />
          </span>
          {label}
        </span>
      )}
      <Button variant="ghost" size="icon-xs" aria-label="Refresh health status" disabled={isFetching} onClick={() => refetch()}>
        <RefreshCw className={cn(isFetching && 'animate-spin')} />
      </Button>
    </div>
  )
}

function HealthStatusSkeleton() {
  return (
    <div role="status" aria-label="Loading health status">
      <Skeleton className="h-4 w-32" />
    </div>
  )
}
