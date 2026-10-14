import { createZodDto } from 'nestjs-zod'
import { messagesResponseSchema } from 'shared'

export class MessagesResponseDto extends createZodDto(messagesResponseSchema, {
    codec: true,
}) {}
