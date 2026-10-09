'use client'

import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { toast, Toaster } from 'sonner'
import { getErrorMessage } from '@/lib/errors'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => toast.error(getErrorMessage(error)),
        }),
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors />
    </QueryClientProvider>
  )
}
