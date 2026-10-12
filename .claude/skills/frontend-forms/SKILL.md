---
name: frontend-forms
description: Build and edit forms with `useAppForm` + `withForm` (TanStack Form) in `apps/frontend/`. Use when creating a form or detail/edit page, wiring the edit-mode toggle, validators, submit handlers, mapping backend validation errors to fields, or splitting a large form. Raw `useForm` is banned.
---

# Forms

TanStack Form (`@tanstack/react-form` 1.33+) via `useAppForm` (`hooks/useAppForm.ts`, built with `createFormHook`). Forms are client components: the file holding `useAppForm` starts with `'use client'`; `page.tsx` stays thin and renders it (`frontend-routing`).

Related: field components → `frontend-form-fields`; schemas → `frontend-zod-schemas`; the mutation it submits → `frontend-mutation-hooks`; confirm dialogs → `frontend-confirm-dialog`.

## Stack

- `useAppForm` / `withForm` / `withFieldGroup` → `@/hooks/useAppForm`.
- Field components in `components/form/`, exposed as `f.X` inside `form.AppField`.
- `form.SubscribeButton` inside `<form.AppForm>`; disables on `!canSubmit || isSubmitting || isDefaultValue`.
- Validators: the feature's zod form schema (`features/<feature>/schemas.ts`), run through `revalidateLogic()`: on submit first, then on every change ([dynamic validation](https://tanstack.com/form/latest/docs/framework/react/guides/dynamic-validation)).
- Render props are nested children (`<form.AppField name="x">{(f) => ...}</form.AppField>`), not a `children=` prop: the `react/no-children-prop` lint rule rejects it.

## Conventions

- `defaultValues` typed `z.input<typeof XxxFormSchema>` (exported as `XxxFormInput`); cast the literal `as XxxFormInput` when needed.
- `validationLogic: revalidateLogic()` + `validators: { onDynamic: XxxFormSchema }`. Not `validators.onSubmit`: its errors only re-run on the next submit, so a cross-field error stays on its field after the user fixes the *other* field, and `canSubmit` keeps the button disabled.
- Schema depends on loaded data (taken names) → a schema factory (`createXxxFormSchema(taken)`) memoized in the component.
- `onSubmit` receives the schema **input**; parse with the same schema to get the output ([docs](https://tanstack.com/form/latest/docs/framework/react/guides/submission-handling)) → strip form-only fields → build the request body.
- `onSubmitInvalid` → `if (process.env.NODE_ENV === 'development') console.error(...)`; the fields already show the errors, so no toast.
- `onSubmit` wraps the mutation in `safe(...)` (`@/lib/safe`). Branch on `ApiValidationError.check(res)` first (`@/lib/errors`) and `return res.applyToForm(formApi)` to put backend field errors on the fields. Then `isError(res)` → `toast.error(getErrorMessage(res))`, else `toast.success` + reset/exit edit mode or navigate.
- `applyToForm` calls `formApi.setErrorMap({ onServer: { fields } })`; field keys are the backend's dotted issue paths, so form field names must match the request body's. Form-level `onServer` errors are cleared by the form's next validation (any change). Writing `errorMap.onServer` per field with `setFieldMeta` is wrong: a field without its own validators never clears it, and the error blocks `canSubmit` forever.

```tsx
'use client'

const form = useAppForm({
  defaultValues: documentToForm(document),
  validationLogic: revalidateLogic(), // from @tanstack/react-form
  validators: { onDynamic: DocumentFormSchema },
  onSubmitInvalid: ({ formApi }) => {
    if (process.env.NODE_ENV === 'development') console.error('Document form invalid', formApi.state.errors)
  },
  onSubmit: async ({ value, formApi }) => {
    const parsed = DocumentFormSchema.parse(value)
    const res = await safe(updateDocumentMutation.mutateAsync({ id: document.id, ...parsed }))
    if (ApiValidationError.check(res)) return res.applyToForm(formApi)
    if (isError(res)) return toast.error(getErrorMessage(res))
    toast.success('Document updated')
    form.reset(value) // also makes `value` the new defaultValues
    setIsEditing(false)
  },
})
```

- Confirm-before-submit → `onSubmitMeta` (below). Never `form.validateSync`: it is `@private` in form-core.
- Re-mount on entity swap → `<XxxForm key={entity.id} />`.

## Confirm before submit — `onSubmitMeta`

Validation runs first; `onSubmit` asks for confirmation unless the submit carries `confirmed: true`, and Accept resubmits with it:

```tsx
const [confirming, setConfirming] = useState(false)

const form = useAppForm({
  // ...defaultValues, validationLogic, validators
  onSubmitMeta: { confirmed: false },
  onSubmit: async ({ value, formApi, meta }) => {
    const parsed = XxxFormSchema.parse(value)
    if (parsed.public && !meta.confirmed) return setConfirming(true)
    // ...mutate
  },
})

const handleConfirm = () => {
  setConfirming(false)
  void form.handleSubmit({ confirmed: true })
}
```

## Create forms

After a successful create, navigate with `useRouter()` from `next/navigation`: `router.replace(`/documents/${res.id}`)` (or `push` to keep the form in history). Cancel → `router.back()` or `router.push(listHref)`.

## Edit-mode workflow (default for detail pages)

Detail pages render read-only first. Edit → fields become editable and the action row swaps to Update + Cancel.

```tsx
const [isEditing, setIsEditing] = useState(initialEditing) // e.g. from a `?edit=1` search param
const disabled = !isEditing
```

- Pass `disabled={disabled}` to every editable field. Identifier fields stay `disabled` always.
- Submit handler ignores Enter while read-only:

```tsx
const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  if (!isEditing) return
  void form.handleSubmit()
}
```

- Cancel: in edit mode entered from the page → `form.reset()` + `setIsEditing(false)`; otherwise leave the page.
- Action row:

```tsx
<div className="mt-4 flex justify-end gap-3">
  {isEditing ? (
    <form.AppForm>
      <form.SubscribeButton label="Update" submittingLabel="Updating..." />
    </form.AppForm>
  ) : (
    <Button type="button" onClick={() => setIsEditing(true)}>
      Edit
    </Button>
  )}
  <Button type="button" variant="outline" onClick={handleCancel}>
    Cancel
  </Button>
</div>
```

- On a successful update: `form.reset(value)` + `setIsEditing(false)`; the page stays put.

## Layout

```tsx
<div className="space-y-4 p-6">
  <h1 className="text-xl font-semibold">Document</h1>

  <form onSubmit={handleFormSubmit} noValidate>
    <div className="rounded-lg border bg-card p-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">{/* fields */}</div>
      {/* more rows: repeat the grid div */}
    </div>

    <div className="mt-4 flex justify-end gap-3">{/* Edit / Update + Cancel */}</div>
  </form>
</div>
```

- Outer container carries the padding (`space-y-4 p-6`); the `<form>` carries none.
- Form card: `rounded-lg border bg-card p-6`. Grid: `grid grid-cols-1 gap-4 lg:grid-cols-3`; one grid `div` per logical row; checkbox rows `flex items-end gap-4 md:col-span-2 lg:col-span-3`.
- Action row: `mt-4 flex justify-end gap-3`, inside `<form>`, outside the card.
- Small standalone forms (login, dialogs) skip the grid: a single `grid gap-4` column.

## Splitting big forms — `withForm`

```tsx
export const DocumentFormFields = withForm({
  defaultValues: emptyDocumentForm, // type-only; not used at runtime
  props: { disabled: false },
  render: function Render({ form, disabled }) {
    return (
      <form.AppField name="title">
        {(f) => <f.TextField label="Title" disabled={disabled} />}
      </form.AppField>
    )
  },
})

<DocumentFormFields form={form} disabled={!isEditing} />
```

Use a named `function Render` so the hooks lint rule treats it as a component. Create and detail pages share one `<Feature>FormFields` section (`features/<feature>/components/`); each owns its `useAppForm`. Reusing a field cluster across *different* forms → `withFieldGroup` ([form composition](https://tanstack.com/form/latest/docs/framework/react/guides/form-composition)).

## Multiple forms on one page

One `useAppForm` per form and one `<form>` per submit action. Tabs: each tab component owns its form and inactive tabs unmount, so dirty state stays scoped.

## Read-only display without a form

A page with no edit capability renders `TextFieldView` (`@/components/form`) directly, no `useAppForm`:

```tsx
<TextFieldView label="Document ID" value={document.id} disabled copyable />
```

`value` is a string (coerce with `String(n)`, `value ?? ''`).

## Checklist

- [ ] `useAppForm`, never raw `useForm`; file is `'use client'`
- [ ] `defaultValues` typed via `z.input` of the form schema
- [ ] `validationLogic: revalidateLogic()` + `validators.onDynamic` = form schema; `onSubmit` parses with it
- [ ] `safe()` → `ApiValidationError.check` → `applyToForm` before generic `isError` → toast
- [ ] Confirm-before-submit uses `onSubmitMeta`, not `validateSync`
- [ ] Submit button is `form.SubscribeButton` inside `<form.AppForm>`
- [ ] Detail page: `useState(initialEditing)`, `disabled={!isEditing}`, Edit ↔ Update + Cancel; submit no-ops while read-only
- [ ] `<form noValidate>`; render props nested as children
- [ ] `key={entity.id}` when the entity can swap
- [ ] `pnpm exec tsc --noEmit && pnpm lint` in `apps/frontend/`
