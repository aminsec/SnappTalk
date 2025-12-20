// Entry point of every ws connection
import { Socket } from "socket.io";

export function handleSocketConnection(socket: Socket): void{
    console.log('New client connected:', socket.id);
    
    // Listen for events from the client
    socket.on('message', (data) => {
      console.log('Message received:', data);
    });
  
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
};