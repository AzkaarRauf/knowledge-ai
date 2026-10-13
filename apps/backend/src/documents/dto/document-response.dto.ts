import { createZodDto } from 'nestjs-zod'
import { documentSchema } from 'shared'

export class DocumentResponseDto extends createZodDto(documentSchema, { codec: true }) {}
