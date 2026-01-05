import { Socket } from "socket.io";
import { MessageSeenEVT, MessageSendEVT } from "../../types/socket.events.types";
import { createNewMessage, seenMessageById } from "../../services/messages.services";
import { ObjectId } from "mongodb";
import { updateConversationLastMessageId } from "../../services/conversations.services";

export async function handleMessageSend(socket: Socket, data: MessageSendEVT) {
    const { conversation_id, message_text, track_id } = data;

    //Checking user has access the conversation
    if(socket.rooms.has(conversation_id)){
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

            socket.to(conversation_id).emit("message:receive", {
                conversation_id,
                message_id: insertedMessageId.toString(),
                message_text,
                sender_info: socket.userInfo,
                when: Date.now()
            });

            //Acknowledge
            socket.emit("message:send:ack", {message_id: insertedMessageId, track_id});
        }

        return;
    }else{
        socket.emit("error", {message: "Couldn't send message"});
        return;
    }
};

export async function handleSeen(socket: Socket, data: MessageSeenEVT) {
    const { conversation_id, message_id } = data;

    //This controls access to conversaion 
    if(socket.rooms.has(conversation_id)){
        const [_, error] = await seenMessageById(new ObjectId(message_id), new ObjectId(conversation_id), socket.userInfo.id.toString());
        if(error){
            socket.emit("seen:error", error);
            return;
        }

        socket.to(conversation_id).emit("message:seen", {conversation_id, message_id});
    }else{
        socket.emit("seen:error", {message: "Coulnd't seen message"});
        return;
    }
}
