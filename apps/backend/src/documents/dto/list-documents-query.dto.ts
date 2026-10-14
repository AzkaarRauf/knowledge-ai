import { createZodDto } from 'nestjs-zod'
import { listDocumentsQuerySchema } from 'shared'

export class ListDocumentsQueryDto extends createZodDto(listDocumentsQuerySchema, {
    codec: true,
}) {}
