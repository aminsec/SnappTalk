import { Server } from 'socket.io';
import { handleSocketConnection } from '../socket/socket.routes';
import http from "http";
import { authenticateSocket } from "../middlewares/socket.middlewares";
import { connectUserToRooms, sendUserStatusToRooms } from '../services/socket.services';
import { setUserStatus } from '../services/account.services';
import { Types } from "mongoose";

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
      //Attaching user id as key and socket id as value to online users map to track user because we can not change socket.id
      onlineUsers.set(socket.userInfo._id.toString(), socket.id);

      //Sending online status to all rooms
      sendUserStatusToRooms(socket, "online");
      await setUserStatus(new Types.ObjectId(socket.userInfo._id.toString()), "online");
      handleSocketConnection(socket, io, onlineUsers);
    }else{
      socket.emit("error", {message: "Couldn't connect to rooms"});
      return;
    }
  });
}
