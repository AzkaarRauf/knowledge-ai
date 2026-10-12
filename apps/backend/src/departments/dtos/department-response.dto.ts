import { createZodDto } from 'nestjs-zod'
import { departmentSchema } from 'shared'

export class DepartmentResponseDto extends createZodDto(departmentSchema, { codec: true }) {}
