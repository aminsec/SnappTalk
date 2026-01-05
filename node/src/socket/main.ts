// Entry point of every ws connection
import { Socket, Server } from "socket.io";
import { handleNewPvConversationEvent } from "./events/new_pv_conversation.event";
import { handleMessageSend, handleSeen } from "./events/messag.event";
import { sendUserStatusToRooms } from "../services/socket.services";
import { setUserStatus } from "../services/user.services";
import { ObjectId } from "mongodb";

export function handleSocketConnection(socket: Socket, io: Server, onlineUsers: Map<string, string>): void{

  // Listen for message from the client
  socket.on('message:send', (data) => {
    handleMessageSend(socket, data);
  });

  //An event for creating new conversation
  socket.on("new_pv_conversation", (data) => {
    handleNewPvConversationEvent(socket, data, onlineUsers, io);
  });

  socket.on("seen", (data) => {
    handleSeen(socket, data);
  });

  socket.on("disconnecting", async () => {
    sendUserStatusToRooms(socket, "offline");
    await setUserStatus(new ObjectId(socket.userInfo.id), "offline");
    onlineUsers.delete(socket.userInfo.id);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
};