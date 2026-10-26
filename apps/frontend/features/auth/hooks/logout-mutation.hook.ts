import { setAccessToken } from '@/lib/auth'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { logout } from '../auth.api'

export function useLogoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logout,
    // Sign out locally even if the server call fails; the cookie expires on its own.
    onSettled: () => {
      setAccessToken(null)
      queryClient.clear()
    },
  })
}
