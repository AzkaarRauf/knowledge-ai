import { createZodDto } from 'nestjs-zod'
import { conversationsQuerySchema } from 'shared'

export class ConversationsQueryDto extends createZodDto(conversationsQuerySchema) {}
