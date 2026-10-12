import { queryOptions } from '@tanstack/react-query'
import { getDepartments, getPublicDepartments } from '@/features/departments/api/departmentsApi'

export const departmentKeys = {
  all: ['departments'] as const,
  list: () => [...departmentKeys.all, 'list'] as const,
  publicList: () => [...departmentKeys.all, 'public-list'] as const,
}

export const departmentsQueryOptions = () =>
  queryOptions({
    queryKey: departmentKeys.list(),
    queryFn: getDepartments,
  })

export const publicDepartmentsQueryOptions = () =>
  queryOptions({
    queryKey: departmentKeys.publicList(),
    queryFn: getPublicDepartments,
  })
