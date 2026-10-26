'use client'

import { TooltipProvider } from '@/components/ui/tooltip'
import { getErrorMessage } from '@/lib/errors'
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { toast, Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => toast.error(getErrorMessage(error)),
        }),
        defaultOptions: { queries: { retry: 0, staleTime: 10 * 1000 } },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster richColors />
    </QueryClientProvider>
  )
}
