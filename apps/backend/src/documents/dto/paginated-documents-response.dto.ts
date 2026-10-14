import { createZodDto } from 'nestjs-zod'
import { paginatedDocumentsSchema } from 'shared'

export class PaginatedDocumentsResponseDto extends createZodDto(paginatedDocumentsSchema, {
    codec: true,
}) {}
