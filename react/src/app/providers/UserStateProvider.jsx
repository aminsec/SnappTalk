import { useCallback, useEffect, useMemo, useState } from 'react';

import { AUTH_STATUS, UserStateContext } from '@/shared/state/userStateContext';

const defaultUser = null;

const UserStateProvider = ({ children }) => {
  const [status, setStatus] = useState(AUTH_STATUS.LOADING);
  const [user, setUser] = useState(defaultUser);
  const [error, setError] = useState(null);

  const resolveUser = useCallback(
    async (signal) => {
      try {
        const response = await fetch('/api/v1/user/info', {
          method: 'GET',
          credentials: 'include',
          signal,
        });

        if (response.redirected || response.status === 401) {
          setUser(defaultUser);
          setStatus(AUTH_STATUS.UNAUTHENTICATED);
          setError(null);
          return null;
        }

        if (!response.ok) {
          throw new Error(`Failed to load user (${response.status})`);
        }

        const payload = await response.json();
        const resolvedUser = payload?.userInfo ?? null;
        setUser(resolvedUser);
        setStatus(resolvedUser ? AUTH_STATUS.AUTHENTICATED : AUTH_STATUS.UNAUTHENTICATED);
        setError(null);

        return resolvedUser;
      } catch (err) {
        if (err.name === 'AbortError') {
          return null;
        }

        console.error('Failed to resolve user state:', err);
        setUser(defaultUser);
        setStatus(AUTH_STATUS.UNAUTHENTICATED);
        setError(err);
        return null;
      }
    },
    []
  );

  const refreshUser = useCallback(async () => {
    setStatus(AUTH_STATUS.LOADING);
    return resolveUser();
  }, [resolveUser]);

  useEffect(() => {
    const controller = new AbortController();

    const bootstrap = async () => {
      await resolveUser(controller.signal);
    };

    bootstrap();

    return () => {
      controller.abort();
    };
  }, [resolveUser]);

  const value = useMemo(
    () => ({
      status,
      user,
      error,
      refreshUser,
      setUser,
    }),
    [status, user, error, refreshUser]
  );

  return <UserStateContext.Provider value={value}>{children}</UserStateContext.Provider>;
};

export default UserStateProvider;
