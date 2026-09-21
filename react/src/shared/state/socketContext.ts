import { createContext } from 'react';
import { SocketContextValue } from '../types/socket.types';

export const SocketContext = createContext<SocketContextValue>({
  socket: null,
  status: 'disconnected',
});

