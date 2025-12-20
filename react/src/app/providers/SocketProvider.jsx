import { useEffect, useMemo, useState } from 'react';

import { SocketContext } from '@/shared/state/socketContext';
import { useAuth } from '@/shared/state/useAuth';
import { socket } from '@/shared/utils/socket';
import { SOCKET_EVENTS } from '@/shared/state/socketEvents';

const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState('disconnected');

  useEffect(() => {
    if (!user) {
      if (socket.connected) {
        socket.disconnect();
      }
      setStatus('disconnected');
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      setStatus('connected');
      socket.emit(SOCKET_EVENTS.AUTH, {}, (ack) => {
        if (ack?.ok) {
          setStatus('authenticated');
        } else if (ack?.error) {
          setStatus('auth_error');
        }
      });
    };

    const handleDisconnect = () => {
      setStatus('disconnected');
    };

    const handleAuthOk = () => {
      setStatus('authenticated');
    };

    const handleAuthError = () => {
      setStatus('auth_error');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on(SOCKET_EVENTS.AUTH_OK, handleAuthOk);
    socket.on(SOCKET_EVENTS.AUTH_ERROR, handleAuthError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off(SOCKET_EVENTS.AUTH_OK, handleAuthOk);
      socket.off(SOCKET_EVENTS.AUTH_ERROR, handleAuthError);
    };
  }, [user]);

  const value = useMemo(
    () => ({
      socket,
      status,
    }),
    [status]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export default SocketProvider;
