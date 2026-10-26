'use client'

import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useLogoutMutation } from '@/features/auth/hooks/logout-mutation.hook'
import { getErrorMessage } from '@/lib/errors'
import { isError, safe } from 'shared'
import { useRouter } from 'next/navigation'
import { LOGIN_ROUTE } from '@/lib/auth'

export function LogoutButton() {
  const logoutMutation = useLogoutMutation()
  const router = useRouter()

  const handleLogout = async () => {
    const res = await safe(logoutMutation.mutateAsync())
    if (isError(res)) toast.error(getErrorMessage(res))
    router.push(LOGIN_ROUTE)
  }

  return (
    <Button variant="outline" onClick={handleLogout} disabled={logoutMutation.isPending}>
      {logoutMutation.isPending ? 'Logging out...' : 'Log out'}
    </Button>
  )
}
