import { useMutation } from '@tanstack/react-query'
import { login } from '../auth.api'

export function useLoginMutation() {
  return useMutation({
    mutationFn: login,
  })
}
