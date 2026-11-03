import { ChatSidebar } from '@/features/conversations/components/ChatSidebar'

export default function ChatLayout({ children }: LayoutProps<'/chat'>) {
  return (
    // fill the screen (under the 3.5rem top bar on mobile); only the message list scrolls
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-0 bg-card md:h-dvh">
      <ChatSidebar />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  )
}
