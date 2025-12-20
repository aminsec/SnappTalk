import { validateJWT } from "../utils/validate";
import { ProtectedUserInfo } from "../types/user.types";
import { Socket } from "socket.io";

export async function  authenticateSocket(socket: Socket, next: Function) {
    const token = socket.handshake.auth.token;
      
    if (!token){
      const socketErrorMessage = {error: "auth_error", message: "Invalid auth token"};
      socket.emit("message", socketErrorMessage);
      socket.disconnect();
      return;
    };

    // This can be the decoded JWT data or false
    const validationResponse: ProtectedUserInfo | Boolean = await validateJWT(token);

    if(validationResponse === false){
      const socketErrorMessage = {error: "auth_error", message: "Invalid auth token"};
      socket.emit("message", socketErrorMessage);
      socket.disconnect();
      return;
    }
    
    // Attaching userinfo to connection
    socket.userInfo = validationResponse as ProtectedUserInfo;
    next();
};