import { Socket } from "socket.io";
import { MessageSendEVT } from "../../types/socket.events.types";
import { createNewMessage } from "../../services/messages.services";
import { ObjectId } from "mongodb";

export async function handleMessageSend(socket: Socket, data: MessageSendEVT) {
    const { conversation_id, message_text } = data;

    //Checking user has access the conversation
    if(socket.rooms.has(conversation_id)){
        const response = socket.to(conversation_id).emit("message:receive", {conversation_id, message_text});
        if(response === true){
            //Inserting message to db
            const [insertedMessageId, error] = await createNewMessage(new ObjectId(conversation_id), new ObjectId(socket.userInfo.id), "text", message_text, []);
            if(error){
                console.log(error);
                socket.emit("error", {message: "Couldn't save the message"})
            }

            socket.emit("message:send:ack", {message_id: insertedMessageId});

        }else{
            socket.emit("error", {message: "Couldn't send the message"});
        }

        return;
    }else{
        socket.emit("error", {message: "Couldn't send message"});
        return;
    }
};