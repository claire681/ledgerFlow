/**
 * React Query client with Novala defaults.
 * 
 * - staleTime: 30s (data is "fresh" for 30 seconds, no refetch)
 * - gcTime: 5min (cached data kept 5 min after unmount)
 * - refetchOnWindowFocus: true (refetch when user returns to tab)
 * - refetchOnMount: true (always check if data is stale on mount)
 * - retry: 1 (retry once on network error, then fail)
 */
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

export default queryClient;
