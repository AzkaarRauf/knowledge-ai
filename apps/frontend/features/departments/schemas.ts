import { z } from 'zod'

export const DepartmentSchema = z.object({
  id: z.string().catch(''),
  name: z.string().catch(''),
  createdAt: z.string().catch(''),
  updatedAt: z.string().catch(''),
})
export type Department = z.infer<typeof DepartmentSchema>

export const DepartmentListSchema = z.array(DepartmentSchema).catch([])

export const PublicDepartmentSchema = DepartmentSchema.pick({ id: true, name: true })
export type PublicDepartment = z.infer<typeof PublicDepartmentSchema>

export const PublicDepartmentListSchema = z.array(PublicDepartmentSchema).catch([])
