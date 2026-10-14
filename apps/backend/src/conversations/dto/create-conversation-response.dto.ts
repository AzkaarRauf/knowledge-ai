import { createZodDto } from 'nestjs-zod'
import { createConversationResponseSchema } from 'shared'

export class CreateConversationResponseDto extends createZodDto(createConversationResponseSchema, {
    codec: true,
}) {}
