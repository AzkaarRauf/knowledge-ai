'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { isError, safe } from 'shared'
import { chatReplyQueryOptions } from '@/features/conversations/api/queries'
import { ChatComposer } from '@/features/conversations/components/ChatComposer'
import { useCreateConversationMutation } from '@/features/conversations/hooks/useCreateConversationMutation'
import { setPendingReply } from '@/features/conversations/pending-prompt'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { publicDepartmentsQueryOptions } from '@/features/departments/api/queries'
import { getErrorMessage } from '@/lib/errors'

const TITLE_MAX_LENGTH = 60

/** Empty chat. The first prompt creates the conversation, then the reply streams on its page. */
export function NewChat() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const createMutation = useCreateConversationMutation()
  const { data: departments = [], isPending: departmentsPending } = useQuery(publicDepartmentsQueryOptions())
  const [departmentId, setDepartmentId] = useState<string | null>(null)
  const departmentOptions = departments.map((d) => ({ value: d.id, label: d.name }))

  async function handleSend(prompt: string) {
    if (!departmentId) {
      toast.error('Select a department first')
      return false
    }
    const title = prompt.length > TITLE_MAX_LENGTH ? `${prompt.slice(0, TITLE_MAX_LENGTH).trimEnd()}…` : prompt
    const res = await safe(createMutation.mutateAsync({ title, departmentId }))
    if (isError(res)) {
      toast.error(getErrorMessage(res))
      return false
    }
    const pending = { prompt, sentAt: Date.now() }
    // start the reply here; the stream lives in the cache, so it keeps going across the navigation
    void queryClient.prefetchQuery(chatReplyQueryOptions(res.id, pending))
    setPendingReply(res.id, pending)
    router.push(`/chat/${res.id}`)
    return true
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 pb-[15vh]">
      <h1 className="text-2xl font-semibold sm:text-3xl">What can I help with?</h1>
      <div className="flex w-full max-w-3xl flex-col gap-3">
        {departmentsPending ? (
          <Skeleton role="status" aria-label="Loading departments" className="h-9 w-56" />
        ) : (
          <Select items={departmentOptions} value={departmentId} onValueChange={setDepartmentId}>
            <SelectTrigger aria-label="Department" className="h-9 w-56 data-[size=default]:h-9">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departmentOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <ChatComposer onSend={handleSend} disabled={createMutation.isPending || !departmentId} autoFocus />
      </div>
    </div>
  )
}
