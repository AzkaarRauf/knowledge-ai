import { createDepartmentRequestSchema, updateDepartmentRequestSchema } from 'shared'
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

export const CreateDepartmentRequestSchema = createDepartmentRequestSchema
export type CreateDepartmentRequest = z.infer<typeof CreateDepartmentRequestSchema>

export const UpdateDepartmentRequestSchema = updateDepartmentRequestSchema
export type UpdateDepartmentRequest = z.infer<typeof UpdateDepartmentRequestSchema>

/** Create and edit forms share one shape: just the name. */
export const DepartmentFormSchema = createDepartmentRequestSchema
export type DepartmentFormInput = z.input<typeof DepartmentFormSchema>
