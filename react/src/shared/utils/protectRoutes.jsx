import { Navigate, Outlet } from 'react-router-dom';

import { AUTH_STATUS } from '@/shared/state/userStateContext';
import { useAuth } from '@/shared/state/useAuth';

const LoadingScreen = () => (
  <div className="route-loading">
    Loading...
  </div>
);

export function RequireGuest() {
  const { status } = useAuth();

  if (status === AUTH_STATUS.LOADING) {
    return <LoadingScreen />;
  }

  if (status === AUTH_STATUS.AUTHENTICATED) {
    return <Navigate to="/chats" replace />;
  }

  return <Outlet />;
}

export function RequireAuth() {
  const { status } = useAuth();

  if (status === AUTH_STATUS.LOADING) {
    return <LoadingScreen />;
  }

  if (status === AUTH_STATUS.UNAUTHENTICATED) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
