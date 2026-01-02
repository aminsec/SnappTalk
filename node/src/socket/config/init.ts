import { Server } from 'socket.io';
import { handleSocketConnection } from '../main';
import http from "http";
import { authenticateSocket } from "../../middlewares/socket.middlewares";
import { connectUserToRooms } from '../../services/socket.services';

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
  io.use(authenticateSocket);

  //Tracking users connections
  const onlineUsers = new Map<string, string>();
  
  io.on('connection', async (socket) => { 
    //Connecting user to rooms
    const [success, error] = await connectUserToRooms(socket);
    if(error){
      socket.emit("error", {message: error.message});
      return;
    }

    if(success === true){
      handleSocketConnection(socket, io as Server, onlineUsers);
    }else{
      socket.emit("error", {message: "Couldn't connect to rooms"});
      return;
    }
  });
}
