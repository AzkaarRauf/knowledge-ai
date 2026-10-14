import { createZodDto } from 'nestjs-zod'
import { updateConversationRequestSchema } from 'shared'

export class UpdateConversationRequestDto extends createZodDto(updateConversationRequestSchema) {}
