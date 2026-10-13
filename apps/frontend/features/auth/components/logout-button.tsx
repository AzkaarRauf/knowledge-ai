'use client'

import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useLogoutMutation } from '@/features/auth/hooks/logout-mutation.hook'
import { getErrorMessage } from '@/lib/errors'
import { isError, safe } from 'shared'

export function LogoutButton() {
  const logoutMutation = useLogoutMutation()

  const handleLogout = async () => {
    const res = await safe(logoutMutation.mutateAsync())
    if (isError(res)) toast.error(getErrorMessage(res))
  }

  return (
    <Button variant="outline" onClick={handleLogout} disabled={logoutMutation.isPending}>
      {logoutMutation.isPending ? 'Logging out...' : 'Log out'}
    </Button>
  )
}
