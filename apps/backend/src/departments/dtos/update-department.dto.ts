import { createZodDto } from 'nestjs-zod'
import { updateDepartmentRequestSchema } from 'shared'

export class UpdateDepartmentDto extends createZodDto(updateDepartmentRequestSchema) {}
