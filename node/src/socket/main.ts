// Entry point of every ws connection
import { Socket, Server } from "socket.io";
import { handleNewPvConversationEvent } from "./events/new_pv_conversation.event";
import { handleMessageSend } from "./events/messag.event";

export function handleSocketConnection(socket: Socket, io: Server, onlineUsers: Map<string, string>): void{
  console.log('New client connected:', socket.id);

  //Attaching user id as key and socket id as value to online users map to track user because we can not change socket.id
  onlineUsers.set(socket.userInfo.id, socket.id);
  
  // Listen for message from the client
  socket.on('message:send', (data) => {
    handleMessageSend(socket, data);
  });

  //An event for creating new conversation
  socket.on("new_pv_conversation", (data) => {
    handleNewPvConversationEvent(socket, data, onlineUsers, io);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
};