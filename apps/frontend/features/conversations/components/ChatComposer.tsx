'use client'

import { ArrowUp } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ChatComposerProps = {
  /** Returns (or resolves) `false` when sending failed, so the draft is put back. */
  onSend: (prompt: string) => boolean | Promise<boolean>
  disabled?: boolean
  /** Small text under the box, e.g. why sending is paused. */
  notice?: string
  autoFocus?: boolean
  className?: string
}

/** Rounded prompt box. Enter sends, Shift+Enter adds a new line. */
export function ChatComposer({ onSend, disabled, notice, autoFocus, className }: ChatComposerProps) {
  const [draft, setDraft] = useState('')
  const canSend = !disabled && draft.trim().length > 0

  async function send() {
    if (!canSend) return
    const prompt = draft.trim()
    setDraft('')
    const ok = await onSend(prompt)
    // put the prompt back unless the user already started a new one
    if (!ok) setDraft((current) => current || prompt)
  }

  return (
    <>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void send()
        }}
        className={cn(
          'flex items-end gap-2 rounded-2xl border bg-card p-2 pl-4 shadow-sm transition-shadow focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20',
          className,
        )}
      >
        <label htmlFor="chat-prompt" className="sr-only">
          Message
        </label>
        <textarea
          id="chat-prompt"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // isComposing: don't send while an IME is still building a word
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              void send()
            }
          }}
          placeholder="Ask anything"
          rows={1}
          autoFocus={autoFocus}
          className="field-sizing-content max-h-52 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-base outline-none placeholder:text-muted-foreground"
        />
        <Button type="submit" size="icon-lg" className="shrink-0 rounded-xl" disabled={!canSend} aria-label="Send message">
          <ArrowUp />
        </Button>
      </form>
      {notice && (
        <p role="status" className="mt-2 text-center text-xs text-muted-foreground">
          {notice}
        </p>
      )}
    </>
  )
}
