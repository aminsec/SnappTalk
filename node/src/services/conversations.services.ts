import { Conversation } from "../types/conversation.types";
import { ErrorResponse } from "../types/response.types";
import { getConversationsCollection } from "../models/conversatations.model";
import { ProtectedUserInfo } from "../types/user.types";
import { getUserInfoById } from "./user.services";
import { ObjectId } from "mongodb";
import { whiteListConversations } from "../utils/operations";
import { getMessageById, getUnreadMessagesCount } from "./messages.services";

export async function getUserConversations(userInfo: ProtectedUserInfo): Promise<[Conversation[] | null, ErrorResponse | null]> {
    try {
        const conversationsCollection  = await getConversationsCollection();
        const conversations: Conversation[] = await conversationsCollection.find(
            {members: 
                {$in: [new ObjectId(userInfo.id)]}
            }
        ).toArray();

        //Attaching contact userinfo for pv types of conversations
        for(let conversation of conversations){
            //Extracting contact userid by checking !userid
            var contactId = (conversation.members[0]).toString() !== userInfo.id ? conversation.members[0].toString() : conversation.members[1].toString();
            if(conversation.type === "pv" && conversation.members){    
                const [contactUserInfo, error] = await getUserInfoById(contactId);
                if(error){
                    console.log(error)
                    throw new Error();
                }

                conversation.contact_info = contactUserInfo;

                if(contactUserInfo){
                    const [unreadMessages, err] = await getUnreadMessagesCount(userInfo.id.toString(), conversation._id);
                    conversation.unread_messages_count = unreadMessages;
                }
            }

            //Attaching last messsage to contact
            const lastMessageId = conversation.last_message_id;
            const lastMessage = await getMessageById(lastMessageId);
            const [senderOfLastMessage, _] = await getUserInfoById(lastMessage.sender);

            conversation.last_message = {
                content: lastMessage.content,
                type: lastMessage.type,
                sender: senderOfLastMessage?.username,
                when: lastMessage.created_at,
                seen: conversation.type == "group" && lastMessage.seen_by.length > 0 ? true : contactId in lastMessage.seen_by ? true : false
            };
        }

        const validConversations: Conversation[] = whiteListConversations(conversations);
        return [validConversations, null];

    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function checkIsThereConversation(firstUserId: ObjectId, secondUserId: ObjectId): Promise<[Boolean | null, null | ErrorResponse]> {
    try {
        const conversationsCollection  = await getConversationsCollection();
        const conversation: Conversation = await conversationsCollection.findOne(
            {
                members: {
                    $all: [firstUserId, secondUserId]
                },
                type: "pv"
            }
        );
    
        if(conversation){
            return [true, null];

        }else{
            return [false, null];
        }

    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function createNewPvConversation(firstUserId: ObjectId, secondUserId: ObjectId, lastMessageId: ObjectId): Promise<[ObjectId | null, ErrorResponse | null]> {
    try {
        const conversationsCollection  = await getConversationsCollection();
        const conversation = await conversationsCollection.insertOne({
            group_name: null,
            group_avatar: null,
            members: [firstUserId, secondUserId],
            type: "pv",
            last_message_id: lastMessageId,
            deleted_for: {
                [firstUserId.toString()]: new Date(),
                [secondUserId.toString()]: new Date()
            },
            created_at: new Date()
        });

        if(conversation.acknowledged === true){
            return [conversation.insertedId, null];
        }else{
            const err: ErrorResponse = {message: "Couldn't create conversation", state: "failed", type: "system_error"};
            return [null, err];
        }

    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function updateConversationLastMessageId(conversationId: ObjectId, lastMessageId: ObjectId): Promise<[true | false | null, ErrorResponse | null]> {
    try {
        const conversationsCollection  = await getConversationsCollection();
        const conversation = await conversationsCollection.updateOne({_id: conversationId}, {$set: {last_message_id: lastMessageId}});
        if(conversation.acknowledged === true){
            return [true, null];
        }else{
            const err: ErrorResponse = {message: "Couldn't update conversation last message id", state: "failed", type: "system_error"};
            return [null, err];
        }

    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};