import z from 'zod'
import { isoDateSchema } from '../common/date.schema.js'

export const departmentSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    createdAt: isoDateSchema,
    updatedAt: isoDateSchema,
})
export type Department = z.infer<typeof departmentSchema>

export const publicDepartmentSchema = departmentSchema.pick({ id: true, name: true })
export type PublicDepartment = z.infer<typeof publicDepartmentSchema>

export const createDepartmentRequestSchema = z.object({
    name: z.string('Name is required').trim().nonempty('Name is required'),
})
export type CreateDepartmentRequest = z.infer<typeof createDepartmentRequestSchema>

export const updateDepartmentRequestSchema = createDepartmentRequestSchema.partial()
export type UpdateDepartmentRequest = z.infer<typeof updateDepartmentRequestSchema>
