'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import {
  type ListDocumentsParams,
  type ListDocumentsQuery,
  ListDocumentsRequestSchema,
} from '@/features/documents/schemas'

/** `undefined` or `''` removes the key from the URL. */
export type DocumentListParamUpdates = Partial<
  Record<keyof ListDocumentsQuery, string | number | undefined>
>

/** List params live in the URL query string, so a page can be shared and survives refresh. */
export function useDocumentListParams() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const { params, query } = useMemo(() => {
    const raw = Object.fromEntries(searchParams)
    const result = ListDocumentsRequestSchema.safeParse(raw)
    // a bad value in the URL (e.g. ?page=abc) falls back to defaults instead of breaking the page
    if (!result.success) return { params: {}, query: ListDocumentsRequestSchema.parse({}) }
    // raw passed validation, so it is safe to send as-is (dates stay ISO strings)
    return { params: raw as ListDocumentsParams, query: result.data }
  }, [searchParams])

  const hrefFor = useCallback(
    (updates: DocumentListParamUpdates) => {
      const next = new URLSearchParams(searchParams)
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === '') next.delete(key)
        else next.set(key, String(value))
      }
      const qs = next.toString()
      return qs ? `${pathname}?${qs}` : pathname
    },
    [searchParams, pathname],
  )

  const setParams = useCallback(
    (updates: DocumentListParamUpdates, { replace = false }: { replace?: boolean } = {}) => {
      const href = hrefFor(updates)
      if (replace) router.replace(href, { scroll: false })
      else router.push(href, { scroll: false })
    },
    [hrefFor, router],
  )

  return { params, query, hrefFor, setParams }
}
