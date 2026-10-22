import {
  chatRequestSchema,
  conversationResponseSchema,
  conversationsQuerySchema,
  createConversationRequestSchema,
  messageResponseSchema,
  messagesQuerySchema,
  updateConversationRequestSchema,
} from 'shared'
import { z } from 'zod'
import { paginatedSchema } from '@/lib/schemas'

export const ConversationSchema = z.object({
  id: z.string().catch(''),
  title: z.string().catch(''),
  departmentId: z.string().nullable().catch(null),
  createdAt: z.string().catch(''),
  updatedAt: z.string().catch(''),
}) satisfies z.ZodType<z.input<typeof conversationResponseSchema>>
export type Conversation = z.infer<typeof ConversationSchema>

export const PaginatedConversationsSchema = paginatedSchema(ConversationSchema)
export type PaginatedConversations = z.infer<typeof PaginatedConversationsSchema>

export const ListConversationsRequestSchema = conversationsQuerySchema
/** What callers pass: every field optional, defaults filled in on parse. */
export type ListConversationsParams = z.input<typeof ListConversationsRequestSchema>
export type ListConversationsQuery = z.output<typeof ListConversationsRequestSchema>

export const MessageSchema = z.object({
  id: z.string().catch(''),
  content: z.string().catch(''),
  role: z.enum(['user', 'assistant', 'system']).catch('assistant'),
  createdAt: z.string().catch(''),
  updatedAt: z.string().catch(''),
}) satisfies z.ZodType<z.input<typeof messageResponseSchema>>
export type Message = z.infer<typeof MessageSchema>

export const PaginatedMessagesSchema = paginatedSchema(MessageSchema)
export type PaginatedMessages = z.infer<typeof PaginatedMessagesSchema>

export const ListMessagesRequestSchema = messagesQuerySchema
export type ListMessagesParams = z.input<typeof ListMessagesRequestSchema>

// shared allows a null department; a new chat on the FE must pick one
export const CreateConversationRequestSchema = createConversationRequestSchema.extend({
  departmentId: z.uuid(),
})
export type CreateConversationRequest = z.infer<typeof CreateConversationRequestSchema>

export const UpdateConversationRequestSchema = updateConversationRequestSchema
export type UpdateConversationRequest = z.infer<typeof UpdateConversationRequestSchema>

export const ChatRequestSchema = chatRequestSchema
export type ChatRequest = z.infer<typeof ChatRequestSchema>

export const RenameConversationFormSchema = UpdateConversationRequestSchema
export type RenameConversationFormInput = z.input<typeof RenameConversationFormSchema>
