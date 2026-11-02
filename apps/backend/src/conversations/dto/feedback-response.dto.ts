import { createZodDto } from 'nestjs-zod'
import { feedbackResponseSchema } from 'shared'

export class FeedbackResponseDto extends createZodDto(feedbackResponseSchema, {
    codec: true,
}) {}
