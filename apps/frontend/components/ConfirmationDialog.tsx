'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type ConfirmationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAccept: () => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  destructive?: boolean
}

/** Asks the user to confirm an action. Built on shadcn `AlertDialog`. */
export function ConfirmationDialog({
  open,
  onOpenChange,
  onAccept,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
}: ConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => onOpenChange(nextOpen)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction variant={destructive ? 'destructive' : 'default'} onClick={onAccept}>
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
