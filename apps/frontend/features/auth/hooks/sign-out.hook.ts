'use client'

import { useRouter } from 'next/navigation'
import { isError, safe } from 'shared'
import { useLogoutMutation } from '@/features/auth/hooks/logout-mutation.hook'
import { LOGIN_ROUTE } from '@/lib/auth'
import { showErrorToast } from '@/lib/error-toast'

/** Logs out, then sends the user to the login page even if the request failed. */
export function useSignOut() {
  const logoutMutation = useLogoutMutation()
  const router = useRouter()

  const signOut = async () => {
    const res = await safe(logoutMutation.mutateAsync())
    if (isError(res)) showErrorToast(res)
    router.push(LOGIN_ROUTE)
  }

  return { signOut, isPending: logoutMutation.isPending }
}
