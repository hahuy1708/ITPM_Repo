import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from './AuthProvider';
import { AppProvider } from './AppStateProvider';
import { QueryProvider } from './QueryProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AppProvider>
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </AppProvider>
    </AuthProvider>
  );
}
