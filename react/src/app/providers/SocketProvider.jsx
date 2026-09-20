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
      setStatus('authenticated');
    };

    const handleConnectError = (err) => {
      console.warn('[socket] connection error:', err);
      setStatus('auth_error');
    };

    const handleDisconnect = () => {
      setStatus('disconnected');
    };

    const handleNewPvConversation = (payload) => {
      try {
        localStorage.setItem(
          'new_pv_conversation_pending',
          JSON.stringify({ payload, ts: Date.now() })
        );
      } catch (error) {
        console.error('Failed to store new pv conversation flag:', error);
      }
      window.dispatchEvent(new CustomEvent('new_pv_conversation', { detail: payload }));
    };

    const handleAnyEvent = (eventName, payload) => {
      console.log('[socket]', eventName, payload);
    };

    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);
    socket.on('disconnect', handleDisconnect);
    socket.on('new_pv_conversation', handleNewPvConversation);
    socket.onAny(handleAnyEvent);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      socket.off('disconnect', handleDisconnect);
      socket.off('new_pv_conversation', handleNewPvConversation);
      socket.offAny(handleAnyEvent);
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
