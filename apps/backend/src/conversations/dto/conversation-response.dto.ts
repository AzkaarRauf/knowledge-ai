import { createZodDto } from 'nestjs-zod'
import { conversationResponseSchema } from 'shared'

export class ConversationResponseDto extends createZodDto(conversationResponseSchema, {
    codec: true,
}) {}
