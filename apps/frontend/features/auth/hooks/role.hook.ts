import { getAccessToken, getRole, refreshAccessToken, subscribeAccessToken } from '@/lib/auth'
import { useEffect, useState, useSyncExternalStore } from 'react'

/**
 * Current user's role from the in-memory access token. After a reload the token is empty,
 * so this restores it from the refresh cookie; `isPending` is true until that settles.
 */
export function useRole() {
  const role = useSyncExternalStore(subscribeAccessToken, getRole, () => null)
  const [isRefreshing, setIsRefreshing] = useState(() => !getAccessToken())

  useEffect(() => {
    if (getAccessToken()) return
    let cancelled = false
    // concurrent calls share one refresh request
    refreshAccessToken()
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsRefreshing(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { role, isAdmin: role === 'ADMIN', isPending: isRefreshing && !role }
}
