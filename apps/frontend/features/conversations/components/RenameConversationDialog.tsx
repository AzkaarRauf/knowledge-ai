'use client'

import { revalidateLogic } from '@tanstack/react-form'
import { toast } from 'sonner'
import { isError, safe } from 'shared'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useRenameConversationMutation } from '@/features/conversations/hooks/useRenameConversationMutation'
import {
  type Conversation,
  RenameConversationFormSchema,
  type RenameConversationFormInput,
} from '@/features/conversations/schemas'
import { useAppForm } from '@/hooks/useAppForm'
import { ApiValidationError, getErrorMessage } from '@/lib/errors'

type RenameConversationDialogProps = {
  conversation: Conversation | null
  onOpenChange: (open: boolean) => void
}

export function RenameConversationDialog({ conversation, onOpenChange }: RenameConversationDialogProps) {
  return (
    <AlertDialog open={conversation !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Rename chat</AlertDialogTitle>
        </AlertDialogHeader>
        {/* key: fresh form for each chat */}
        {conversation && (
          <RenameConversationForm key={conversation.id} conversation={conversation} onDone={() => onOpenChange(false)} />
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}

function RenameConversationForm({ conversation, onDone }: { conversation: Conversation; onDone: () => void }) {
  const renameMutation = useRenameConversationMutation()

  const form = useAppForm({
    defaultValues: { title: conversation.title } as RenameConversationFormInput,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: RenameConversationFormSchema },
    onSubmitInvalid: ({ formApi }) => {
      if (process.env.NODE_ENV === 'development') console.error('Rename chat form invalid', formApi.state.errors)
    },
    onSubmit: async ({ value, formApi }) => {
      const parsed = RenameConversationFormSchema.parse(value)
      const res = await safe(renameMutation.mutateAsync({ id: conversation.id, ...parsed }))
      if (ApiValidationError.check(res)) return res.applyToForm(formApi)
      if (isError(res)) return toast.error(getErrorMessage(res))
      onDone()
    },
  })

  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.AppField name="title">{(f) => <f.TextField label="Title" autoFocus />}</form.AppField>
      <AlertDialogFooter>
        <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
        <form.AppForm>
          <form.SubscribeButton label="Save" submittingLabel="Saving..." />
        </form.AppForm>
      </AlertDialogFooter>
    </form>
  )
}
