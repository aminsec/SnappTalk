import { Socket, Server } from "socket.io";
import { MessageDeleteEVT, MessageEditEVT, MessageReplyEVT, MessageSeenEVT, MessageSendEVT } from "../../types/socket.events.types";
import { createNewMessage, deleteMessageById, editMessageById, getConversationMessagesByLimitedDate, getMessageById, seenMessageById, softDeleteMessage } from "../../services/messages.services";
import { Types } from "mongoose";
import { getConversationById, updateConversationLastMessageId } from "../../services/conversations.services";
import { handlePvConversationDelete } from "./conversation.event";
import { InsertMessage } from "../../types/messages.types";

export async function handleMessageSend(socket: Socket, data: MessageSendEVT) {
    const { conversation_id, message_text, track_id } = data;
    const { userInfo } = socket;

    //Checking user has access the conversation
    if(socket.rooms.has(conversation_id)){
        //Inserting message
        const insertData: InsertMessage = {
            sender: new Types.ObjectId(userInfo.id),
            content: message_text,
            conversation_id: new Types.ObjectId(conversation_id),
            replied_to: null,
            attachments: [],
            type: "text",
            deleted_for: []
        }

        const [insertedMessageId, error] = await createNewMessage(insertData);
        if(error){
            socket.emit("error", {message: "Couldn't save the message"});
            return;
        }

        if(insertedMessageId){
            const [lastMessageUpdated, err] = await updateConversationLastMessageId(new Types.ObjectId(conversation_id), new Types.ObjectId(insertedMessageId), "both");
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

export async function handleMessageReply(socket: Socket, data: MessageReplyEVT) {
    const { userInfo } = socket;
    const { conversation_id, message_text, reply_to, track_id } = data;

    //Checking user has access the conversation
    if(socket.rooms.has(conversation_id)){
        const [replyMessageInfo, error] = await getMessageById(new Types.ObjectId(reply_to));
        if(error || replyMessageInfo === null){
            socket.emit("message:send:reply:error", {message: "Message not found", conversation_id, track_id});
            return;
        }

        //Checking if the reply message is a message of conversation. User can not reply a message doesn't exist in the conversation
        if(replyMessageInfo.conversation_id.toString() !== conversation_id){
            socket.emit("message:send:reply:error", {message: "Message not found", conversation_id, track_id});
            return;
        }

        //Inserting message
        const insertData: InsertMessage = {
            sender: new Types.ObjectId(userInfo.id),
            content: message_text,
            conversation_id: new Types.ObjectId(conversation_id),
            replied_to: reply_to? new Types.ObjectId(reply_to) : null,
            attachments: [],
            type: "text",
            deleted_for: []
        };

        const [insertedMessageId, err] = await createNewMessage(insertData);
        if(err || insertedMessageId === null){
            socket.emit("error", {message: "Couldn't save the message", conversation_id, track_id});
            return;
        }

        //Setting the message as last message of conversation
        const [lastMessageUpdated, updateError] = await updateConversationLastMessageId(new Types.ObjectId(conversation_id), new Types.ObjectId(insertedMessageId), "both");
        if(updateError){
            socket.emit("error", {message: "Couldn't send the message"});
            return;
        }

        //Sending ack
        socket.emit("message:send:reply:ack", {message_id: insertedMessageId, conversation_id, track_id});
        socket.to(conversation_id).emit("message:receive:reply", {
            conversation_id,
            message_id: insertedMessageId,
            message_text,
            replied_to: reply_to,
            when: new Date(),
            sender_info: socket.userInfo
        });

    }else{
        socket.emit("message:send:reply:error", {message: "Access denied", conversation_id, track_id});
        return;
    }
};

export async function handleSeen(socket: Socket, data: MessageSeenEVT) {
    const { conversation_id, message_id } = data;

    //This controls access to conversaion 
    if(socket.rooms.has(conversation_id)){
        const [_, error] = await seenMessageById(new Types.ObjectId(message_id), new Types.ObjectId(conversation_id), socket.userInfo.id.toString());
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
    const [message, error] = await getMessageById(new Types.ObjectId(message_id));
    if(error || message === null){
        socket.emit("message:edit:error", {message: error?.message});
        return;
    }

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
    const [editResult, err] = await editMessageById(new Types.ObjectId(message._id), new_message);

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

export async function handleMessageDeleteForAll(socket: Socket, data: MessageDeleteEVT, io: Server) {
    const { message_id } = data;
    const { userInfo } = socket;
    let isLastMessage = false;

    const [messageInfo, error] = await getMessageById(new Types.ObjectId(message_id));
    if(messageInfo === null || error){
        socket.emit("message:delete:error", {message: "Message not found", message_id});
        return;
    }

    //Checking user is sender of the message
    if(messageInfo.sender.toString() === userInfo.id){
        const [conversationOfMessage, error] = await getConversationById(messageInfo.conversation_id);
        if(error || conversationOfMessage === null){
            socket.emit("message:delete:error", {message: "Message not found", message_id});
            return;
        }

        var [oneMessageBeforeLastMessage, err] = await getConversationMessagesByLimitedDate(conversationOfMessage._id, "0", 2, 0, new Types.ObjectId(userInfo.id)); //This will be an array with two elements, if the message is not the only message left in converstion
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
        if(conversationOfMessage.last_message_id[userInfo.id.toString()].toString() === messageInfo._id.toString()){
            isLastMessage = true;
            const [updateResult, err] = await updateConversationLastMessageId(conversationOfMessage._id, oneMessageBeforeLastMessage[1]._id, "both");
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

export async function handleMessageDeleteForMe(socket: Socket, data: MessageDeleteEVT, io: Server) {
    const { message_id } = data;
    const { userInfo } = socket;
    let isLastMessage = false;

    const [messageInfo, err] = await getMessageById(new Types.ObjectId(message_id));
    if(messageInfo === null || err){
        socket.emit("message:delete:for_me:error", {message: "Message not found", message_id});
        return;
    }

    //Security check, user can only delete messages that has access to its conversation
    if(!socket.rooms.has(messageInfo.conversation_id.toString())){
        socket.emit("message:delete:for_me:error", {message: "Access denied", message_id});
        return;
    }

    //Updating last message of conversation if the deleted message is the last message of conversation
    const [conversationOfMessage, returnError] = await getConversationById(messageInfo.conversation_id);
    if(returnError || conversationOfMessage === null){
        socket.emit("message:delete:for_me:error", {message: "Couldn't delete message", message_id});
        return;
    }

    if(conversationOfMessage.last_message_id[userInfo.id.toString()].toString() === message_id){
        isLastMessage = true;
        const [oneMessageBeforeLastMessage, error] = await getConversationMessagesByLimitedDate(conversationOfMessage._id, "0", 2, 0, new Types.ObjectId(userInfo.id));
        if(error || oneMessageBeforeLastMessage === null){
            socket.emit("message:delete:error", {message: "Coudn't delete message"});
            return;
        }

        //This checks the targeted message is the only message left in conversation, in this situation we delete whole conversation for both side
        if(oneMessageBeforeLastMessage?.length === 1){
            handlePvConversationDelete(socket, {conversation_id: conversationOfMessage._id.toString(), delete_for: "me"}, io);
            return;
        }

        const [updateResult, err] = await updateConversationLastMessageId(conversationOfMessage._id, oneMessageBeforeLastMessage[1]._id, "one", new Types.ObjectId(userInfo.id));
        if(err){
            socket.emit("message:delete:error", {message: err.message, message_id});
            return;
        }
    }

    const [softDeleteResult, error] = await softDeleteMessage(new Types.ObjectId(message_id), new Types.ObjectId(userInfo.id));
    if(error){
        socket.emit("message:delete:error", {message: error.message, message_id});
        return;
    }

    if(softDeleteResult){
        socket.emit("message:delete:ack", {message: "Message deleted successfully", message_id});
        socket.to(messageInfo.conversation_id.toString()).emit("message:deleted", {message_id, conversation_id: conversationOfMessage._id, is_last_message: isLastMessage});
        return;
    }
};