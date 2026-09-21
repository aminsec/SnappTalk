import { createContext } from 'react';
import { AUTH_STATUS, AuthContextValue } from '../types/auth.types';

export { AUTH_STATUS };
export type { AuthStatus, AuthContextValue } from '../types/auth.types';

const noop = () => Promise.resolve(null);

export const UserStateContext = createContext<AuthContextValue>({
  status: AUTH_STATUS.LOADING,
  user: null,
  error: null,
  refreshUser: noop,
  setUser: () => {},
});

