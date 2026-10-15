import z from 'zod'
import { isoDateSchema } from '../common/date.schema.js'
import { listQuerySchema, paginatedSchema } from '../common/pagination.schema.js'

export const messageRoleSchema = z.enum(['user', 'assistant', 'system'])
export type MessageRole = z.infer<typeof messageRoleSchema>

export const messageResponseSchema = z.object({
    id: z.uuid(),
    content: z.string(),
    role: messageRoleSchema,
    createdAt: isoDateSchema,
    updatedAt: isoDateSchema,
})
export type MessageResponse = z.infer<typeof messageResponseSchema>

export const messagesResponseSchema = paginatedSchema(messageResponseSchema)
export type MessagesResponse = z.infer<typeof messagesResponseSchema>

export const MESSAGE_SORT_FIELDS = ['createdAt'] as const satisfies (keyof MessageResponse)[]
export const messagesQuerySchema = listQuerySchema({
    sortFields: MESSAGE_SORT_FIELDS,
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'asc',
})
