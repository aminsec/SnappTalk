import { connectToSnappTalkDB } from "./config/database";
import http from "http";
import app from "./app";
import { Server } from 'socket.io';

const PORT = Number(process.env.APP_PORT) || 2020;
const server = http.createServer(app);

try {
  //Connecting to database when starting app
  connectToSnappTalkDB();

  // WebSocket Setup
  const io = new Server(server, {
    cors: {
      origin: 'http://snapptalk.io:3000/', // React app
      methods: ['GET', 'POST']
    }
  });


  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
  
    // Listen for events from the client
    socket.on('message', (data) => {
      console.log('Message received:', data);

    });
  
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

  });
  
} catch (error) {
  console.error("System error accoured while starting one of servers", error);
};

server.listen(PORT, () => {
  console.log(`Sancity app and WS listening on port ${PORT}`);
});
