import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AUTH_STATUS, UserStateContext } from '@/shared/state/userStateContext';
import { AuthStatus } from '@/shared/types/auth.types';
import { User } from '@/shared/types/user.types';

export interface UserStateProviderProps {
  children: React.ReactNode;
}

const defaultUser: User | null = null;

const UserStateProvider: React.FC<UserStateProviderProps> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>(AUTH_STATUS.LOADING);
  const [user, setUser] = useState<User | null>(defaultUser);
  const [error, setError] = useState<Error | null>(null);

  const resolveUser = useCallback(
    async (signal?: AbortSignal): Promise<User | null> => {
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
        const resolvedUser: User | null = payload?.userInfo ?? null;
        // Backend whitelists users with `_id`; normalize to `id` too so every
        // consumer (seen logic, ownership checks) can rely on `user.id`.
        if (resolvedUser && !resolvedUser.id && resolvedUser._id) {
          resolvedUser.id = resolvedUser._id.toString();
        }
        setUser(resolvedUser);
        setStatus(resolvedUser ? AUTH_STATUS.AUTHENTICATED : AUTH_STATUS.UNAUTHENTICATED);
        setError(null);

        return resolvedUser;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return null;
        }

        console.error('Failed to resolve user state:', err);
        setUser(defaultUser);
        setStatus(AUTH_STATUS.UNAUTHENTICATED);
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      }
    },
    []
  );

  const refreshUser = useCallback(async (): Promise<User | null> => {
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

