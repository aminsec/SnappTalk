import { Socket, Server } from "socket.io";
import { MessageDeleteEVT, MessageEditEVT, MessageSeenEVT, MessageSendEVT } from "../../types/socket.events.types";
import { createNewMessage, deleteMessageById, editMessageById, getConversationMessagesByLimitedDate, getMessageById, seenMessageById } from "../../services/messages.services";
import { ObjectId } from "mongodb";
import { getConversationById, updateConversationLastMessageId } from "../../services/conversations.services";
import { handlePvConversationDelete } from "./conversation.event";

export async function handleMessageSend(socket: Socket, data: MessageSendEVT) {
    const { conversation_id, message_text, track_id } = data;

    //Checking user has access the conversation
    if(socket.rooms.has(conversation_id)){
        //Inserting message to db
        const [insertedMessageId, error] = await createNewMessage(new ObjectId(conversation_id), new ObjectId(socket.userInfo.id), "text", message_text, []);
        if(error){
            socket.emit("error", {message: "Couldn't save the message"});
            return;
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
};

export async function handleMessageEdit(socket: Socket, data: MessageEditEVT) {
    const { message_id, new_message } = data;
    const { userInfo } = socket;

    //Checking user is sender of the message
    const message = await getMessageById(new ObjectId(message_id));

    if(message.sender.toString() !== userInfo.id){
        const error = {message: "Access denied"};
        socket.emit("message:edit:error", error);
        return;
    }

    if(new_message.length > 255) { 
        const error = {message: "Message is too long"};
        socket.emit("message:edit:error", error);
        return;
    }

    //Editing message
    const [editResult, err] = await editMessageById(new ObjectId(message._id), new_message);

    if(err){
        socket.emit("message:edit:error", {message_id, error: err.message});
        return;
    }

    //Sending success and new message to room of message
    socket.emit("message:edit:ack", {message: "Message edited successfully"});

    const conversationOfMessage = message.conversation_id;
    socket.to(conversationOfMessage.toString()).emit("message:edited", {message_id, new_message, conversation_id: message.conversation_id});
    return;
};

export async function handleMessageDelete(socket: Socket, data: MessageDeleteEVT, io: Server) {
    const { message_id } = data;
    const { userInfo } = socket;
    let isLastMessage = false
    const messageInfo = await getMessageById(new ObjectId(message_id));
    if(messageInfo === null){
        socket.emit("message:delete:error", {message: "Message not found", message_id});
        return;
    }

    if(messageInfo.sender.toString() === userInfo.id){
        const [conversationOfMessage, error] = await getConversationById(messageInfo.conversation_id);
        if(error || conversationOfMessage === null){
            socket.emit("message:delete:error", {message: "Message not found", message_id});
            return;
        }

        var [oneMessageBeforeLastMessage, err] = await getConversationMessagesByLimitedDate(conversationOfMessage._id, "0", 2, 0); //This will be an array with one element
        if(err || oneMessageBeforeLastMessage === null){
            socket.emit("message:delete:error", {message: "Coudn't delete message"});
            return;
        }

        //This checks the targeted message is the only message left in conversation, in this situation we delete whole conversation for both side
        if(oneMessageBeforeLastMessage?.length === 1){
            handlePvConversationDelete(socket, {conversation_id: conversationOfMessage._id.toString(), delete_for: "all"}, io);
            return;
        }

        //Checking if the message is last message of conversation because if it is we need to update last message of conversation
        if(conversationOfMessage.last_message_id.toString() === messageInfo._id.toString()){
            isLastMessage = true;
            const [updateResult, err] = await updateConversationLastMessageId(conversationOfMessage._id, oneMessageBeforeLastMessage[1]._id);
            if(err){
                socket.emit("message:delete:error", {message: err.message, message_id});
                return;
            }
        }

        const [deleteResult, Error] = await deleteMessageById(messageInfo._id);
        if(Error){
            socket.emit("message:delete:error", {message: Error.message, message_id});
            return;
        }

        if(deleteResult){
            socket.emit("message:delete:ack", {message: "Message deleted successfully", message_id});
            socket.to(messageInfo.conversation_id.toString()).emit("message:deleted", {message_id, conversation_id: conversationOfMessage._id, is_last_message: isLastMessage});
            return;
        }

    }else{
        socket.emit("message:delete:error", {message: "Access denied"});
        return;
    }
};