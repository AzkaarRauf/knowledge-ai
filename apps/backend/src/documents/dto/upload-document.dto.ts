import { createZodDto } from 'nestjs-zod'
import z from 'zod'

const uploadDocumentSchema = z.object({ file: z.file() })

export class UploadDocumentDto extends createZodDto(uploadDocumentSchema) {}
