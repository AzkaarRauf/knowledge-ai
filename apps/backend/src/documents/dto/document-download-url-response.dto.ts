import { createZodDto } from 'nestjs-zod'
import { documentDownloadUrlSchema } from 'shared'

export class DocumentDownloadUrlResponseDto extends createZodDto(documentDownloadUrlSchema) {}
