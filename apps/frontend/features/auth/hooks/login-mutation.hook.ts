import { useMutation } from '@tanstack/react-query'
import { setAccessToken } from '@/lib/auth'
import { login } from '../auth.api'

export function useLoginMutation() {
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => setAccessToken(data.token),
  })
}
