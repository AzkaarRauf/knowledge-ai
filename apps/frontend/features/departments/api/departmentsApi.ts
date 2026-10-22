import { api } from '@/lib/api-client'
import {
  type CreateDepartmentRequest,
  CreateDepartmentRequestSchema,
  DepartmentListSchema,
  DepartmentSchema,
  PublicDepartmentListSchema,
  type UpdateDepartmentRequest,
  UpdateDepartmentRequestSchema,
} from '@/features/departments/schemas'

export async function getDepartments() {
  const res = await api.get('/departments')
  return DepartmentListSchema.parse(res.data)
}

export async function getPublicDepartments() {
  const res = await api.get('/departments/public')
  return PublicDepartmentListSchema.parse(res.data)
}

export async function getDepartment(id: string) {
  const res = await api.get(`/departments/${id}`)
  return DepartmentSchema.parse(res.data)
}

export async function createDepartment(request: CreateDepartmentRequest) {
  const res = await api.post('/departments', CreateDepartmentRequestSchema.parse(request))
  return DepartmentSchema.parse(res.data)
}

export async function updateDepartment(id: string, request: UpdateDepartmentRequest) {
  const res = await api.patch(`/departments/${id}`, UpdateDepartmentRequestSchema.parse(request))
  return DepartmentSchema.parse(res.data)
}

export async function deleteDepartment(id: string) {
  const res = await api.delete(`/departments/${id}`)
  return DepartmentSchema.parse(res.data)
}
