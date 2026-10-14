import { createZodDto } from 'nestjs-zod'
import { conversationsResponseSchema } from 'shared'

export class ConversationsResponseDto extends createZodDto(conversationsResponseSchema, {
    codec: true,
}) {}
