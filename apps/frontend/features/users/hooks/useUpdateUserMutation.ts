import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateUser } from '@/features/users/api/usersApi'
import { userKeys } from '@/features/users/api/queries'
import type { UpdateUserRequest } from '@/features/users/schemas'

export function useUpdateUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...request }: { id: string } & UpdateUserRequest) => updateUser(id, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  })
}
