import { z } from 'zod'
import { api } from '@/lib/api-client'
import { redirectToLogin, refreshAccessToken } from '@/lib/auth'
import { env } from '@/lib/env'
import { ApiError } from '@/lib/errors'
import {
  ChatRequestSchema,
  type ChatRequest,
  ConversationSchema,
  CreateConversationRequestSchema,
  type CreateConversationRequest,
  type ListConversationsParams,
  ListConversationsRequestSchema,
  type ListMessagesParams,
  ListMessagesRequestSchema,
  PaginatedConversationsSchema,
  PaginatedMessagesSchema,
  UpdateConversationRequestSchema,
  type UpdateConversationRequest,
} from '@/features/conversations/schemas'

export async function getConversations(params: ListConversationsParams = {}) {
  const res = await api.get('/conversations', { params: ListConversationsRequestSchema.parse(params) })
  return PaginatedConversationsSchema.parse(res.data)
}

export async function getConversation(id: string) {
  const res = await api.get(`/conversations/${id}`)
  return ConversationSchema.parse(res.data)
}

export async function getMessages(id: string, params: ListMessagesParams = {}) {
  const res = await api.get(`/conversations/${id}/messages`, { params: ListMessagesRequestSchema.parse(params) })
  return PaginatedMessagesSchema.parse(res.data)
}

export async function createConversation(request: CreateConversationRequest) {
  const res = await api.post('/conversations', CreateConversationRequestSchema.parse(request))
  return ConversationSchema.parse(res.data)
}

export async function updateConversation(id: string, request: UpdateConversationRequest) {
  const res = await api.patch(`/conversations/${id}`, UpdateConversationRequestSchema.parse(request))
  return ConversationSchema.parse(res.data)
}

export async function deleteConversation(id: string) {
  await api.delete(`/conversations/${id}`)
}

const SseDataSchema = z.string().catch('')
const ErrorBodySchema = z.object({ message: z.union([z.string(), z.array(z.string())]).catch('') }).catch({ message: '' })

/**
 * Sends a prompt and yields the SSE reply piece by piece.
 * Uses fetch, not axios: axios cannot read a streamed body in the browser.
 */
export async function* streamChat(args: { id: string; request: ChatRequest }) {
  const { id, request } = args
  const body = JSON.stringify(ChatRequestSchema.parse(request))
  const send = () =>
    fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/conversations/${id}/chat`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body,
    })

  let res = await send()
  // access cookie expired: rotate it once and retry, same as the axios interceptor
  if (res.status === 401) {
    try {
      await refreshAccessToken()
    } catch {
      redirectToLogin()
      throw new ApiError('Session expired', 401)
    }
    res = await send()
  }
  if (!res.ok || !res.body) {
    const { message } = ErrorBodySchema.parse(await res.json().catch(() => null))
    throw new ApiError((Array.isArray(message) ? message.join(', ') : message) || `Request failed (${res.status})`, res.status)
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  let errorMessage = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += value
    // events are split by a blank line; keep the last, maybe partial, piece in the buffer
    const events = buffer.split('\n\n')
    buffer = events.pop() ?? ''
    for (const raw of events) {
      const event = parseSseEvent(raw)
      if (event.type === 'chunk') yield event.data
      if (event.type === 'error') errorMessage = event.data || 'Something went wrong'
    }
  }
  if (errorMessage) throw new ApiError(errorMessage, 500)
}

function parseSseEvent(raw: string) {
  let type = 'message'
  let data = ''
  for (const line of raw.split('\n')) {
    if (line.startsWith('event:')) type = line.slice('event:'.length).trim()
    if (line.startsWith('data:')) data += line.slice('data:'.length).trim()
  }
  // chunk and error data are JSON strings; done has no data
  if (!data) return { type, data: '' }
  try {
    return { type, data: SseDataSchema.parse(JSON.parse(data)) }
  } catch {
    return { type, data: '' }
  }
}
