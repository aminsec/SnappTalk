import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://ws.odyssey.io:3000';

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket'],
});

