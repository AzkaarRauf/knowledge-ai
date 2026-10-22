import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteDepartment } from '@/features/departments/api/departmentsApi'
import { departmentKeys } from '@/features/departments/api/queries'

export function useDeleteDepartmentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string }) => deleteDepartment(id),
    onSuccess: (_, { id }) => {
      queryClient.removeQueries({ queryKey: departmentKeys.detail(id) })
      return queryClient.invalidateQueries({ queryKey: departmentKeys.all })
    },
  })
}
