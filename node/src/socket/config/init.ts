import { Server } from 'socket.io';
import { handleSocketConnection } from './main';
import http from "http";
import { authenticateSocket } from "./socket.middlewares";

export function initSocket(server: http.Server){
// Socket Setup
  const io = new Server(server, {
    cors: {
      origin: 'http://snapptalk.io:3000', // React app
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  console.log("WebSocket server initialized");

  // Attaching middlewares
  // io.use(authenticateSocket);

  io.on('connection', (socket) => { 
    handleSocketConnection(socket);
  });
}
