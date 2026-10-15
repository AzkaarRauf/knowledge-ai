import { createZodDto } from 'nestjs-zod'
import { chatRequestSchema } from 'shared'

export class ChatRequestDto extends createZodDto(chatRequestSchema) {}
