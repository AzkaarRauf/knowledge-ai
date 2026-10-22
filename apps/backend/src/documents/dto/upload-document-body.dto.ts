import { createZodDto } from 'nestjs-zod'
import { uploadDocumentBodySchema } from 'shared'

export class UploadDocumentBodyDto extends createZodDto(uploadDocumentBodySchema) {}
