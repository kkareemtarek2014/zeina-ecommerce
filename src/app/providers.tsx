'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FeatureProvider } from '@/shared/contexts/FeatureContext';
import { SessionHydrator } from '@/features/auth';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <FeatureProvider>
        <SessionHydrator />
        {children}
      </FeatureProvider>
    </QueryClientProvider>
  );
}
