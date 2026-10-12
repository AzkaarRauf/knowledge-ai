import { api } from '@/lib/api-client'
import { DepartmentListSchema, PublicDepartmentListSchema } from '@/features/departments/schemas'

export async function getDepartments() {
  const res = await api.get('/departments')
  return DepartmentListSchema.parse(res.data)
}

export async function getPublicDepartments() {
  const res = await api.get('/departments/public')
  return PublicDepartmentListSchema.parse(res.data)
}
