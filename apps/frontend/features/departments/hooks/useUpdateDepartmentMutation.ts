import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateDepartment } from '@/features/departments/api/departmentsApi'
import { departmentKeys } from '@/features/departments/api/queries'
import type { UpdateDepartmentRequest } from '@/features/departments/schemas'

export function useUpdateDepartmentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...request }: { id: string } & UpdateDepartmentRequest) => updateDepartment(id, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: departmentKeys.all }),
  })
}
