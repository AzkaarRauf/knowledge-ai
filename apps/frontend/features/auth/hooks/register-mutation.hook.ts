import { useMutation } from '@tanstack/react-query'
import { register } from '../auth.api'

export function useRegisterMutation() {
  return useMutation({
    mutationFn: register,
  })
}
