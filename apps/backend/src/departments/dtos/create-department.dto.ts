import { createZodDto } from 'nestjs-zod'
import { createDepartmentRequestSchema } from 'shared'

export class CreateDepartmentDto extends createZodDto(createDepartmentRequestSchema) {}
