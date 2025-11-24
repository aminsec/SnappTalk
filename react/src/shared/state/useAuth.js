import { useContext } from 'react';

import { UserStateContext } from './userStateContext';

export function useAuth() {
  const context = useContext(UserStateContext);

  if (!context) {
    throw new Error('useAuth must be used within a UserStateProvider');
  }

  return context;
}

