import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { QueryClientInstance } from '@/lib/queryClient';

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={QueryClientInstance}>
      {children}
    </QueryClientProvider>
  );
}
