'use client'

import { useQuery } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { healthQueryOptions } from '@/features/health/api/queries'
import { cn } from '@/lib/utils'

export function HealthStatus() {
  const { data, isPending, isError, isFetching, refetch } = useQuery(healthQueryOptions())

  const ok = !isError && data?.status === 'ok'
  const label = isError ? 'unreachable' : data?.status || 'unknown'

  return (
    <div className="fixed right-3 bottom-3 flex items-center gap-1 text-xs text-muted-foreground">
      {isPending ? (
        <HealthStatusSkeleton />
      ) : (
        <span className="flex items-center gap-1.5" title="Backend health">
          <span className={cn('size-2 rounded-full', ok ? 'bg-green-500' : 'bg-red-500')} />
          API {label}
        </span>
      )}
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Refresh health status"
        disabled={isFetching}
        onClick={() => refetch()}
      >
        <RefreshCw className={cn(isFetching && 'animate-spin')} />
      </Button>
    </div>
  )
}

function HealthStatusSkeleton() {
  return (
    <div role="status" aria-label="Loading health status">
      <Skeleton className="h-4 w-16" />
    </div>
  )
}
