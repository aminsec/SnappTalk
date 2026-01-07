import { NewPvConversationEVT, pvConversationDeleteEVT } from "../../types/socket.events.types";
import { checkIsThereConversation, createNewPvConversation, hardDeleteConversation, softDeleteConversation, updateConversationLastMessageId } from "../../services/conversations.services";
import { Server, Socket } from "socket.io";
import { ObjectId } from "mongodb";
import { createNewMessage } from "../../services/messages.services";
import { checkUserHasAccessToConversation } from "../../utils/validate";
import { ErrorResponse } from "../../types/response.types";
import { Conversation } from "../../types/conversation.types";

export async function handleNewPvConversationEvent(socket: Socket, data: NewPvConversationEVT, onlineUsers: Map<string, string>, io: Server) {
    const requestedUserId = new ObjectId(socket.userInfo.id);
    const contactUserId = new ObjectId(data.new_user_id);
    const { track_id } = data;
    
    //Checking if there is a conversation with requested user id
    const [conversationId, error] = await checkIsThereConversation(requestedUserId, contactUserId);

    if(error){
        socket.emit("error", {message: "There was a problem in our backend"});
        return;
    }

    if(conversationId){
        socket.emit("error", {message: "You already have conversation with this user", conversation_id: conversationId});
        return;
    }

    //Creating new conversation                                                                 /*Temporary id for now*/
    const [newPvConversationId, err] = await createNewPvConversation(requestedUserId, contactUserId, new ObjectId());

    if(err){
        socket.emit("error", {message: "There was a problem in our backend"});
        return;
    }

    //Inserting new message to the conversation
    if(newPvConversationId){
        const [newMessageId, err] = await createNewMessage(newPvConversationId, requestedUserId, "text", data.message_text, []);
        if(err){
            socket.emit("error", {message: "There was a problem in our backend"});
            return;
        }

        if(newMessageId){
            //Updating conversation with new last_message id
            const [updatedConversation, err] = await updateConversationLastMessageId(newPvConversationId, newMessageId);
            if(err){
                socket.emit("error", {message: "There was a problem in our backend"});
                return;
            }

            //Joining users to room
            socket.join(newPvConversationId.toString());
            const targetSocketId = onlineUsers.get(contactUserId.toString());
            if(targetSocketId){ //Checks if user is online
                const targetSocket = io.sockets.sockets.get(targetSocketId) as Socket; 
                targetSocket?.join(newPvConversationId.toString());
                targetSocket?.emit("new_pv_conversation", {conversation_id: newPvConversationId.toString()});
                socket.to(newPvConversationId.toString()).emit("message:receive", {
                    conversation_id: newPvConversationId.toString(),
                    message_id: newMessageId.toString(),
                    message_text: data.message_text,
                    sender_info: socket.userInfo,
                    when: Date.now()
                });
            }

            socket.emit("message", {message: "Conversation created", conversationId: newPvConversationId.toString()});
            socket.emit("message:send:ack", {message_id: newMessageId, track_id});
        }
    }
};

export async function handlePvConversationDelete(socket: Socket, data: pvConversationDeleteEVT, io: Server) {
    const { conversation_id, delete_for } = data;
    const { userInfo } = socket;
    const allowedValuesForDeletedFor = ["me", "all"];

    //Checking delete_for value
    if(!allowedValuesForDeletedFor.includes(delete_for)){
        socket.emit("conversation:pv:delete:error", {message: "Invalid delete_for parameter value"});
        return;
    }

    //Checking if user has access to the conversation
    const [conversation, err]: [Conversation | null, ErrorResponse | null] = await checkUserHasAccessToConversation(new ObjectId(conversation_id), userInfo.id);

    //If user had not access to conversation, a not found error will be shown
    if(err || conversation === null){
        socket.emit("conversation:pv:delete:error", {message: "Access denied", conversation_id});
        return;
    }

    //User can not delete group conversations
    if(conversation?.type === "pv"){
        if(delete_for === "me"){
            const [deleteResult, error] = await softDeleteConversation(userInfo, new ObjectId(conversation_id));
            if(error){
                socket.emit("conversation:pv:delete:error", {message: error.message, conversation_id});
                return;
            }
    
            socket.emit("conversation:pv:delete:ack", {message: "Conversation deleted successfully", conversation_id});
            return;
    
        }else if(delete_for === "all"){
            const [deleteResult, error] = await hardDeleteConversation(new ObjectId(conversation_id)); 
            if(error){
                socket.emit("conversation:pv:delete:error", {message: error.message, conversation_id});
                return;
            }

            if(deleteResult === true){
                socket.emit("conversation:pv:delete:ack", {message: "Conversation deleted successfully", conversation_id});
                socket.to(conversation_id).emit("conversation:pv:deleted", {conversation_id});

                //Removing sockets from room
                io.in(conversation_id).socketsLeave(conversation_id);
                return;

            }else{
                socket.emit("conversation:pv:delete:error", {message: "Couldn't delete conversation", conversation_id});
                return;
            }
        }

    }else{
        socket.emit("conversation:pv:delete:error", {message: "Access denied", conversation_id});
        return;
    }
};