'use client'

import type { ComponentProps } from 'react'
import { TextInputView } from './TextField'

type TextFieldViewProps = Omit<
  ComponentProps<typeof TextInputView>,
  'onChange' | 'onBlur' | 'error' | 'name'
>

/** A read-only text field for pages without a form. */
export function TextFieldView(props: TextFieldViewProps) {
  return <TextInputView {...props} />
}
