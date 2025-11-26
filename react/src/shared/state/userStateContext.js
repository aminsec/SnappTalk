import { createContext } from 'react';

export const AUTH_STATUS = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
};

const noop = () => Promise.resolve(null);

export const UserStateContext = createContext({
  status: AUTH_STATUS.LOADING,
  user: null,
  error: null,
  refreshUser: noop,
  setUser: () => {},
});
