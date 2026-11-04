'use client'

import { showErrorToast } from '@/lib/error-toast'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => showErrorToast(error),
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
