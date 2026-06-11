import { QueryClient } from '@tanstack/react-query'

/**
 * Shared QueryClient instance used across the application.
 * Extracted into its own module so that both App.tsx (provider) and
 * api/client.ts (interceptors) can access the same instance.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60,
    },
  },
})
