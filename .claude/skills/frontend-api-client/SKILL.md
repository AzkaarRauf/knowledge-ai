---
name: frontend-api-client
description: The axios client, auth token, errors and env config in `apps/frontend/lib/`. Use when calling the backend from an API function, adding a `NEXT_PUBLIC_*` env var, touching the error interceptor or auth header, the `/api` rewrite, or wiring a streaming endpoint.
---

# API Client

## Env

`lib/env.ts` parses the env with zod at module load and exports `env`. Missing or malformed config throws there, at boot, rather than as a failed request later.

Next inlines `NEXT_PUBLIC_*` vars into the client bundle only when referenced literally, so the schema input lists each var by name; never pass `process.env` itself or index it dynamically:

```ts
export const env = z
  .object({ NEXT_PUBLIC_API_BASE_URL: z.string().default('/api/v1') })
  .parse({ NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL })
```

`NEXT_PUBLIC_API_BASE_URL` defaults to `/api/v1`: `next.config.ts` `rewrites` proxies `/api/:path*` to the Nest backend on `:8090` (global prefix `api`, URI versioning default `v1`), so no CORS setup is needed.

Adding a var:

1. Add it to the schema and the literal input object in `env.ts`.
2. Add it to `apps/frontend/.env.example` with a comment.
3. Browser-visible → `NEXT_PUBLIC_` prefix; server-only otherwise (and never import it into a client component).

## Client

One axios instance, `api` in `lib/api-client.ts`:

- `baseURL: env.NEXT_PUBLIC_API_BASE_URL`.
- Request interceptor adds `Authorization: Bearer <token>` from `@/lib/auth` (once auth exists).
- Response interceptor `handleErrorResponse` (`lib/errors.ts`) clears the token on 401 and rethrows every failure as a typed error:
  - `ApiValidationError` for Nest validation failures (`StandardSchemaValidationPipe`, 400); `fieldErrors` maps the issue path (`path.join('.')`) → message. Check the real 400 body before relying on its shape.
  - `ApiError` otherwise, carrying the backend `message` and `status`.

Callers see the backend's message, never a raw `AxiosError`. Show errors with `getErrorMessage(error)`.

## Calling the backend

Feature API functions live in `features/<feature>/api/<feature>Api.ts`. Each one parses the request body with the request schema, calls `api`, then parses `res.data` with the response schema (`frontend-zod-schemas`):

```ts
export async function createUser(request: CreateUserRequest) {
  const res = await api.post('/users', CreateUserRequestSchema.parse(request))
  return UserSchema.parse(res.data)
}
```

Paths are relative to `baseURL`: `/users`, never `/api/v1/users`.

The backend's routes and request bodies are in its OpenAPI spec: `curl -s localhost:8090/docs-json` with the backend running (`ENV=dev`). The spec has no response shapes; take those from the Prisma models in `apps/backend/prisma/schema.prisma` and the service return values.

## Streaming endpoints

axios cannot consume a streamed body in the browser, so streaming endpoints (e.g. AI SDK UI message streams) use `fetch`, through the AI SDK `DefaultChatTransport` when using `useChat`:

```ts
new DefaultChatTransport({
  api: `${env.NEXT_PUBLIC_API_BASE_URL}/<resource>/${id}/stream`,
  headers: authHeaders,
  prepareSendMessagesRequest: ({ messages }) => ({
    body: RequestSchema.parse({ query: messageText(messages.at(-1)) }),
  }),
})
```

`authHeaders` comes from `@/lib/auth`. A 401 surfaces as `useChat`'s `error` (`APICallError` with `statusCode`); clear the token in `onError` when `statusCode === 401`.

## Checklist

- [ ] Base URL read from `env`, never `process.env` inline or a literal
- [ ] New env var in `env.ts` schema + literal input, and `.env.example`
- [ ] Non-streaming calls use `api`; streaming calls use `fetch`/AI SDK transport with `authHeaders`
- [ ] API functions parse requests and responses with zod
