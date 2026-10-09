---
name: frontend-zod-schemas
description: Zod schemas for API responses and request bodies in the frontend. Use when adding or changing a schema, choosing `.catch`/`.nullable`/`.nullish`, or modelling a paginated response.
---

# Zod Schemas

Location: `features/<feature>/schemas.ts`, one file per feature; import as `@/features/<feature>/schemas`. Export the schemas and their inferred types (`export type User = z.infer<typeof UserSchema>`); the inferred type is the single source of truth for the model, so a feature has no hand-written `types.ts`.

Two kinds of schema, two rule sets:

| Kind     | Validates             | Failure mode                                           | `.catch`?        |
| -------- | --------------------- | ------------------------------------------------------ | ---------------- |
| Response | API responses         | Resilient: one bad field must not fail the whole parse | YES, every field |
| Request  | Outgoing request body | Loud: invalid input throws                             | NO               |

## Response schemas

The schema mirrors the FULL wire shape, not the subset the UI shows. Parse in the API function, before data reaches the cache or a component.

**Every field the API sends MUST be modelled**, including audit fields (`createdAt`, `updatedAt`) and ids of related records (`userId`). zod strips unknown keys, so an unmodelled field silently disappears from the cache and the inferred type. Take the field list from the Prisma model in `apps/backend/prisma/schema.prisma` (field names as in the model, not the `@map` column names) minus anything the service strips (e.g. `password`), or from a real response, not from what the UI renders. When the backend adds a field, add it to the schema.

Per field:

- `String` / `@db.Uuid` / `DateTime` → `z.string()` (dates arrive as ISO strings); `Int`/`Float` → `z.number()`; `Boolean` → `z.boolean()`; Prisma `enum` → `z.enum([...])` with the same values.
- `.catch()` on every field, with the falsy value of its type: string → `''`, number → `0`, boolean → `false`, array → `[]`; enum → its most common value.
- `.nullable()` only for optional fields (`Type?`).

```ts
export const UserSchema = z.object({
  id: z.string().catch(''),
  name: z.string().catch(''),
  email: z.string().catch(''),
  createdAt: z.string().catch(''),
  updatedAt: z.string().catch(''),
})
export type User = z.infer<typeof UserSchema>
```

### Paginated responses

The backend has no pagination helper yet. When one lands, build a shared `paginatedSchema(itemSchema)` factory in `lib/schemas.ts` mirroring its envelope, normalise the item array to `[]` so callers never null-check it, and update this section.

## Request schemas

Mirror the backend DTO (`apps/backend/src/**/dto/*.dto.ts`, zod via `nestjs-zod`, or the `components.schemas` in `/docs-json`). Parse the outgoing body in the API function before sending; invalid request data throws, so the bug surfaces at its source instead of as a 400.

```ts
export const CreateUserRequestSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(8),
})
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>
```
