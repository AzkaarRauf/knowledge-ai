import { z } from 'zod'
import { isoDateSchema } from '../common/date.schema.js'

export const feedbackRatingSchema = z.enum(['UP', 'DOWN'])
export type FeedbackRating = z.infer<typeof feedbackRatingSchema>

export const upsertFeedbackRequestSchema = z.object({
    rating: feedbackRatingSchema,
    comment: z.string().trim().max(1000).optional(),
})
export type UpsertFeedbackRequest = z.infer<typeof upsertFeedbackRequestSchema>

export const feedbackResponseSchema = z.object({
    id: z.uuid(),
    messageId: z.uuid(),
    userId: z.uuid(),
    rating: feedbackRatingSchema,
    comment: z.string().nullable(),
    createdAt: isoDateSchema,
    updatedAt: isoDateSchema,
})
export type FeedbackResponse = z.infer<typeof feedbackResponseSchema>
