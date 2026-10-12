import { createZodDto } from 'nestjs-zod'
import { publicDepartmentSchema } from 'shared'

export class PublicDepartmentResponseDto extends createZodDto(publicDepartmentSchema) {}
