import { Navigate, Outlet } from 'react-router-dom';
import { FullscreenLoader } from '@/components/feedback/LoadingState';
import { useAuth } from '@/app/providers/AuthProvider';

export function ProtectedRoute() {
  const { isLoadingAuth, isAuthenticated } = useAuth();

  if (isLoadingAuth) {
    return <FullscreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
