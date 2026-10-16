import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { rehypeFadeInWords } from '@/features/conversations/rehype-fade-in-words'
import { type Message } from '@/features/conversations/schemas'

export function ChatMessage({
  message: { role, content },
  streaming = false,
}: {
  message: Pick<Message, 'role' | 'content'>
  // fade in new words as they arrive
  streaming?: boolean
}) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-3xl bg-muted px-5 py-2.5 whitespace-pre-wrap break-words">{content}</div>
      </div>
    )
  }

  return (
    <div className="prose prose-neutral max-w-none break-words dark:prose-invert prose-pre:bg-muted prose-pre:text-foreground">
      <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={streaming ? [rehypeFadeInWords] : []}>
        {content}
      </Markdown>
    </div>
  )
}
