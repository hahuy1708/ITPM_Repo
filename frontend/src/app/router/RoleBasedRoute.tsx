import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';

interface RoleBasedRouteProps {
  roles: string[];
  children: ReactNode;
}

export function RoleBasedRoute({ roles, children }: RoleBasedRouteProps) {
  const { user } = useAuth();

  if (!user?.role || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
