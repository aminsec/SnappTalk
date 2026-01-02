import { NewPvConversationEVT } from "../../types/socket.events.types";
import { checkIsThereConversation, createNewPvConversation, updateConversationLastMessageId } from "../../services/conversations.services";
import { Server, Socket } from "socket.io";
import { ObjectId } from "mongodb";
import { createNewMessage } from "../../services/messages.services";

export async function handleNewPvConversationEvent(socket: Socket, data: NewPvConversationEVT, onlineUsers: Map<string, string>, io: Server) {
    const requestedUserId = new ObjectId(socket.userInfo.id);
    const contactUserId = new ObjectId(data.new_user_id);
    //Checking if there is a conversation with requested user id
    const [isThereConversation, error] = await checkIsThereConversation(requestedUserId, contactUserId);

    if(error){
        socket.emit("error", {message: "There was a problem in our backend"});
        return;
    }

    if(isThereConversation === true){
        socket.emit("error", {message: "You already have conversation with this user"});
        return;
    }

    //Creating new conversation                                                                      /*Temporary id for now*/
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
        }

        //Joining users to room
        socket.join(newPvConversationId.toString());
        const targetSocketId = onlineUsers.get(contactUserId.toString());
        if(targetSocketId){ //Checks if user is online
            const targetSocket = io.sockets.sockets.get(targetSocketId) as Socket; 
            targetSocket?.join(newPvConversationId.toString());
            targetSocket?.emit("new_pv_conversation", {conversation_id: newPvConversationId.toString()});
            socket.to(newPvConversationId.toString()).emit("message", {message_id: newMessageId, content: data.message_text, sender: socket.userInfo.username, when: new Date().toISOString()});
            socket.emit("message", {message: "Conversation created", conversationId: newPvConversationId.toString()});
        }
    }
    
};