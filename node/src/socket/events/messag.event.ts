import { Socket } from "socket.io";
import { MessageSendEVT } from "../../types/socket.events.types";
import { createNewMessage } from "../../services/messages.services";
import { ObjectId } from "mongodb";
import { updateConversationLastMessageId } from "../../services/conversations.services";

export async function handleMessageSend(socket: Socket, data: MessageSendEVT) {
    const { conversation_id, message_text, track_id } = data;

    //Checking user has access the conversation
    if(socket.rooms.has(conversation_id)){
        const response = socket.to(conversation_id).emit("message:receive", {conversation_id, message_text, sender_info: socket.userInfo, when: Date.now()});
        if(response === true){
            //Inserting message to db
            const [insertedMessageId, error] = await createNewMessage(new ObjectId(conversation_id), new ObjectId(socket.userInfo.id), "text", message_text, []);
            if(error){
                console.log(error);
                socket.emit("error", {message: "Couldn't save the message"})
            }

            if(insertedMessageId){
                const [lastMessageUpdated, err] = await updateConversationLastMessageId(new ObjectId(conversation_id), new ObjectId(insertedMessageId));
                if(err){
                    socket.emit("error", {message: "Couldn't send the message"});
                    return;
                }
            }

            //Acknowledge
            socket.emit("message:send:ack", {message_id: insertedMessageId, track_id});

        }else{
            socket.emit("error", {message: "Couldn't send the message"});
        }
 
        return;
    }else{
        socket.emit("error", {message: "Couldn't send message"});
        return;
    }
};