import { FileText } from 'lucide-react'
import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { citationSource, parseCitations } from '@/features/conversations/citations'
import { rehypeFadeInWords } from '@/features/conversations/rehype-fade-in-words'
import { type Message } from '@/features/conversations/schemas'

const markdownComponents: Components = {
  a: ({ href, children, node: _node, ...props }) => {
    const source = citationSource(href)
    if (source === null)
      return (
        <a href={href} {...props}>
          {children}
        </a>
      )

    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <span className="not-prose mx-0.5 inline-flex max-w-60 cursor-default items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 align-middle text-xs font-medium text-muted-foreground" />
          }
        >
          <FileText className="size-3 shrink-0" />
          <span className="truncate">{children}</span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="break-all">
          {source}
        </TooltipContent>
      </Tooltip>
    )
  },
}

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
        <div className="max-w-[80%] rounded-3xl bg-muted px-5 py-2.5 whitespace-pre-wrap wrap-break-word">{content}</div>
      </div>
    )
  }

  return (
    <div className="prose prose-neutral max-w-none wrap-break-word dark:prose-invert prose-pre:bg-muted prose-pre:text-foreground">
      <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={streaming ? [rehypeFadeInWords] : []} components={markdownComponents}>
        {parseCitations(content)}
      </Markdown>
    </div>
  )
}
