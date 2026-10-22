---
name: frontend-form-fields
description: Pick or add field components for `useAppForm` from `apps/frontend/components/form/`. Use when choosing `TextField`/`TextareaField`/`CheckboxField`, making identifier fields copyable, showing read-only values, or registering a new field component.
---

# Form Fields

Field components live in `components/form/`, built on the shadcn (Base UI) inputs in `components/ui/`. Registered fields are exposed as `f.X` inside `<form.AppField>`.

## Cheat sheet

| Component       | Value type | Notes                                                                                                                       |
| --------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| `TextField`     | `string`   | `type` (`text`, `email`, `password`, `date`, …), `copyable`, `placeholder`, `required` (asterisk), `maxLength`, `autoComplete`, `description` |
| `TextareaField` | `string`   | `rows`                                                                                                                      |
| `CheckboxField` | `boolean`  | `description` for sub-text                                                                                                  |
| `SelectField`   | `string \| null` | `options` (`{ value, label }[]`; `value: null` = a pickable "none" item), `placeholder`, `required`, `description`; `''` and `null` both show the placeholder |
| `FileField`     | `File \| null` | `accept`, `required`, `description`; uncontrolled, so `form.reset()` needs the form to remount to clear the picked file |

Form component (`form.X` inside `<form.AppForm>`): `SubscribeButton` (`label`, `submittingLabel`, `className`). Read-only display outside a form: `TextFieldView` (not registered).

A component missing from this table is not registered on `useAppForm`: render it directly rather than as `f.X`, or add it (below).

## Conventions by data type

- **Identifier** (`id`, values the user copies) → `<TextField copyable disabled />`.
- **Plain editable text** → `<TextField />`.
- **Email / password** → `type="email"` / `type="password"` with the matching `autoComplete` (`email`, `current-password`, `new-password`).
  `type="password"` renders a show/hide toggle (Phosphor `Eye`/`EyeSlash`) automatically.
- **Dates** → `<TextField type="date" />`; value stays an ISO `yyyy-mm-dd` string.
- **Numbers** → `<TextField type="number" />` holding a string; the form schema converts to a number.

## Adding a new field

1. Create it in `components/form/` with `'use client'` (shadcn primitive first: `pnpm dlx shadcn@latest add <component>` in `apps/frontend/`).
2. Read field state with `useFieldContext<T>()` from `@/hooks/form-context`; wrap the input in `FieldShell` (label, required asterisk, error/description) and show `formatFieldErrors(field.state.meta.errors)` (`./field-utils`). Errors are zod issues (`{ message }`) or strings (server errors); render both. Wire `field.handleChange` and `field.handleBlur`; pass `name={field.name}`. Keep non-component helpers in `field-utils.ts`.
3. Export it from `components/form/index.ts`.
4. Register it in `fieldComponents` in `hooks/useAppForm.ts`, and add a row to the cheat sheet above.

A select: Base UI `Select` accepts `null` as its empty value, so no sentinel is needed; hold `string | null` in the field and let the form schema reject `null` when required.
