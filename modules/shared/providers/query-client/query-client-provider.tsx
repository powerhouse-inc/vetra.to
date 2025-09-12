'use client'

import {
  QueryClient,
  QueryClientProvider as TanstackQueryClientProvider,
} from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'

export default function QueryClientProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return <TanstackQueryClientProvider client={queryClient}>{children}</TanstackQueryClientProvider>
}
