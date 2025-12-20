import { Server } from 'socket.io';
import handleSocketConnection from './main';
import { validateJWT } from "../utils/validate";
import { ProtectedUserInfo } from "../types/user.types";
import http from "http";

export function initSocket(server: http.Server){
// Socket Setup
  const io = new Server(server, {
    cors: {
      origin: 'http://snapptalk.io:3000/', // React app
      methods: ['GET', 'POST']
    }
  });

  console.log("WebSocket server initialized");

  //Authenticating every connection
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
      
    if (!token){
      const socketErrorMessage = {error: "auth_error", message: "Invalid auth token"};
      socket.emit("message", socketErrorMessage);
      socket.disconnect();
      return;
    };

    //This can be data of jwt token or false
    const validationResponse: ProtectedUserInfo | Boolean = await validateJWT(token);

    if(validationResponse === false){
      const socketErrorMessage = {error: "auth_error", message: "Invalid auth token"};
      socket.emit("message", socketErrorMessage);
      socket.disconnect();
      return;
    }
    
    //Attaching userinfo to connection
    // (socket as any).userInfo = validationResponse as ProtectedUserInfo;
    socket.userInfo = validationResponse as ProtectedUserInfo;
    next();
  });

  io.on('connection', (socket) => { 
    handleSocketConnection(socket);
  });
}
