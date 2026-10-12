import { createFormHook } from '@tanstack/react-form'
import {
  CheckboxField,
  SelectField,
  SubscribeButton,
  TextareaField,
  TextField,
} from '@/components/form'
import { fieldContext, formContext } from '@/hooks/form-context'

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField, TextareaField, CheckboxField, SelectField },
  formComponents: { SubscribeButton },
})
