import { Socket } from "socket.io";
import { MessageSendEVT } from "../../types/socket.events.types";

export async function handleMessageSend(socket: Socket, data: MessageSendEVT) {
    const { conversation_id, message_text } = data;

    //Checking user has access the conversation
    if(socket.rooms.has(conversation_id)){
        socket.to(conversation_id).emit("message:receive", {conversation_id, message_text});
        return;
    }else{
        socket.emit("error", {message: "Couldn't send message"});
        return;
    }
};