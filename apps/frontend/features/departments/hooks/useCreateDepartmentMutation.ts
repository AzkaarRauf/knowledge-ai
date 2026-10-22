import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createDepartment } from '@/features/departments/api/departmentsApi'
import { departmentKeys } from '@/features/departments/api/queries'
import type { CreateDepartmentRequest } from '@/features/departments/schemas'

export function useCreateDepartmentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateDepartmentRequest) => createDepartment(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: departmentKeys.all }),
  })
}
