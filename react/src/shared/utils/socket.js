import { io } from 'socket.io-client';

const SOCKET_URL = 'http://ws.snapptalk.io';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket'],
});
