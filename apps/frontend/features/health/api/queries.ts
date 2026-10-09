import { queryOptions } from '@tanstack/react-query'
import { getHealth } from '@/features/health/api/healthApi'

export const healthKeys = {
  all: ['health'] as const,
}

export const healthQueryOptions = () =>
  queryOptions({
    queryKey: healthKeys.all,
    queryFn: getHealth,
    // A down backend should show as down right away, not after three retries.
    retry: false,
  })
