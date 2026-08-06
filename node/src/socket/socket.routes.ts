// Entry point of every ws connection
import { Socket, Server } from "socket.io";
import { handleNewPvConversationEvent, handlePvConversationDelete } from "./events/conversation.event";
import { handleMessageEdit, handleMessageSend, handleSeen, handleMessageDeleteForAll, handleMessageReply, handleMessageDeleteForMe } from "./events/messag.event";
import { sendUserStatusToRooms } from "../services/socket.services";
import { setUserStatus } from "../services/account.services";
import { Types } from "mongoose";

export function handleSocketConnection(socket: Socket, io: Server, onlineUsers: Map<string, string>): void{

  // Listen for message from the client
  socket.on("message:send", (data) => {
    handleMessageSend(socket, data);
  });

  socket.on("message:send:reply", (data) => {
    handleMessageReply(socket, data);
  });

  socket.on("message:edit", (data) => {
    handleMessageEdit(socket, data);
  });

  socket.on("message:delete:for_all", (data) => {
    handleMessageDeleteForAll(socket, data, io);
  });

  socket.on("message:delete:for_me", (data) => {
    handleMessageDeleteForMe(socket, data, io);
  });

  socket.on("conversation:pv:delete", (data) => {
    handlePvConversationDelete(socket, data, io);
  });

  socket.on("new_pv_conversation", (data) => {
    handleNewPvConversationEvent(socket, data, onlineUsers, io);
  });

  socket.on("seen", (data) => {
    handleSeen(socket, data);
  });

  socket.on("disconnecting", async () => {
    sendUserStatusToRooms(socket, "offline");
    await setUserStatus(new Types.ObjectId(socket.userInfo.id), "offline");
    onlineUsers.delete(socket.userInfo.id);
  });

};