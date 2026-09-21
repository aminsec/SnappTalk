import { useContext } from 'react';
import { UserStateContext } from './userStateContext';
import { AuthContextValue } from '../types/auth.types';

export function useAuth(): AuthContextValue {
  const context = useContext(UserStateContext);

  if (!context) {
    throw new Error('useAuth must be used within a UserStateProvider');
  }

  return context;
}

