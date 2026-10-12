import { useMutation } from '@tanstack/react-query'
import { setAccessToken } from '@/lib/auth'
import { register } from '../auth.api'

export function useRegisterMutation() {
  return useMutation({
    mutationFn: register,
    onSuccess: (data) => setAccessToken(data.token),
  })
}
