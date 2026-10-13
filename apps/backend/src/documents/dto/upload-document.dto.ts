import { createZodDto } from 'nestjs-zod'
import { uploadDocumentRequestSchema } from 'shared'

export class UploadDocumentDto extends createZodDto(uploadDocumentRequestSchema) {}
