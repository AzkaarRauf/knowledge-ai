import { createZodDto } from 'nestjs-zod'
import { updateConversationResponseSchema } from 'shared'

export class UpdateConversationResponseDto extends createZodDto(updateConversationResponseSchema, {
    codec: true,
}) {}
