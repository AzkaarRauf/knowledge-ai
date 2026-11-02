import { createZodDto } from 'nestjs-zod'
import { upsertFeedbackRequestSchema } from 'shared'

export class UpsertFeedbackRequestDto extends createZodDto(upsertFeedbackRequestSchema) {}
