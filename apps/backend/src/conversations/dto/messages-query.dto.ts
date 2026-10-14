import { createZodDto } from 'nestjs-zod'
import { messagesQuerySchema } from 'shared'

export class MessagesQueryDto extends createZodDto(messagesQuerySchema) {}
