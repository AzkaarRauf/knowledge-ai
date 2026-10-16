import { ConversationView } from '@/features/conversations/components/ConversationView'

export default async function ConversationPage(props: PageProps<'/chat/[conversationId]'>) {
  const { conversationId } = await props.params
  return <ConversationView key={conversationId} conversationId={conversationId} />
}
