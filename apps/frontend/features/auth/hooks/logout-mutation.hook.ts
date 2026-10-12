import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { LOGIN_ROUTE, setAccessToken } from '@/lib/auth'
import { logout } from '../auth.api'

export function useLogoutMutation() {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: logout,
    // Sign out locally even if the server call fails; the cookie expires on its own.
    onSettled: () => {
      setAccessToken(null)
      queryClient.clear()
      router.replace(LOGIN_ROUTE)
    },
  })
}
