import z from 'zod'
import { isoDateSchema } from '../common/date.schema.js'
import { listQuerySchema, paginatedSchema } from '../common/pagination.schema.js'

export const createConversationRequestSchema = z.object({
    title: z.string().nonempty().optional(),
})
export type CreateConversationRequest = z.infer<typeof createConversationRequestSchema>

export const conversationResponseSchema = z.object({
    id: z.uuid(),
    title: z.string(),
    createdAt: isoDateSchema,
    updatedAt: isoDateSchema,
})
export type ConversationResponse = z.infer<typeof conversationResponseSchema>

export const createConversationResponseSchema = conversationResponseSchema
export type CreateConversationResponse = z.infer<typeof createConversationResponseSchema>

export const conversationsResponseSchema = paginatedSchema(conversationResponseSchema)
export type ConversationsResponse = z.infer<typeof conversationsResponseSchema>

export const CONVERSATION_SORT_FIELDS = ['title', 'createdAt', 'updatedAt'] as const satisfies (keyof ConversationResponse)[]
export const conversationsQuerySchema = listQuerySchema({
    sortFields: CONVERSATION_SORT_FIELDS,
    defaultSortBy: 'updatedAt',
})

export const updateConversationRequestSchema = z.object({
    title: z.string().trim().nonempty(),
})
export type UpdateConversationRequest = z.infer<typeof updateConversationRequestSchema>

export const updateConversationResponseSchema = conversationResponseSchema
export type UpdateConversationResponse = z.infer<typeof updateConversationResponseSchema>
