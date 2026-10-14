import { createZodDto } from 'nestjs-zod'
import { createConversationRequestSchema } from 'shared'

export class CreateConversationRequestDto extends createZodDto(createConversationRequestSchema) {}
