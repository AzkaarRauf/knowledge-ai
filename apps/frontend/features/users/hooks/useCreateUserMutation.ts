import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createUser } from '@/features/users/api/usersApi'
import { userKeys } from '@/features/users/api/queries'
import type { CreateUserRequest } from '@/features/users/schemas'

export function useCreateUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateUserRequest) => createUser(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  })
}
