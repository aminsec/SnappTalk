import { Conversation } from "../types/conversation.types";
import { ErrorResponse } from "../types/response.types";
import { Conversation as ConversationModel } from "../models/conversatations.model";
import { ProtectedUserInfo } from "../types/user.types";
import { getUserInfoById } from "./account.services";
import { Types } from "mongoose";
import { whiteListConversations } from "../utils/operations";
import { deleteConversationMessages, getMessageById, getUnreadMessagesCount } from "./messages.services";

export async function getUserConversations(userInfo: ProtectedUserInfo): Promise<[Conversation[] | null, ErrorResponse | null]> {
    try {
        const conversations: Conversation[] = await ConversationModel.find(
            {members: 
                {$in: [new Types.ObjectId(userInfo.id)]}
            }
        ).lean();

        let detailedConversations: Conversation[] = [];

        //Attaching contact userinfo for pv types of conversations
        for(let conversation of conversations){
            var contactId = (conversation.members[0]).toString() !== userInfo.id ? conversation.members[0].toString() : conversation.members[1].toString();
            //Attaching last messsage to contact
            const lastMessageId = conversation.last_message_id[userInfo.id.toString()];
            const [lastMessage, error] = await getMessageById(lastMessageId);
            if(error || lastMessage === null) {
                const err: ErrorResponse = {message: "message not found", state: "failed", type: "not_found"};
                return [null, err];
            }

            //This check is for checking conversations that deleted last time or not
            if(conversation.deleted_for[userInfo.id] > lastMessage.created_at){
                continue;
            }
            
            const [senderOfLastMessage, _] = await getUserInfoById(new Types.ObjectId(lastMessage.sender));

            conversation.last_message = {
                content: lastMessage.content,
                type: lastMessage.type,
                sender: senderOfLastMessage?.username,
                when: lastMessage.created_at,
                seen: conversation.type == "group" && Object.keys(lastMessage.seen_by).length > 0 ? true : contactId in lastMessage.seen_by ? true : false
            };

            //Extracting contact userid by checking !userid
            if(conversation.type === "pv" && conversation.members){    
                const [contactUserInfo, error] = await getUserInfoById(new Types.ObjectId(contactId));
                if(error){
                    console.log(error);
                    throw new Error();
                }

                conversation.contact_info = contactUserInfo;

                if(contactUserInfo){
                    const [unreadMessages, err] = await getUnreadMessagesCount(userInfo.id.toString(), conversation._id);
                    if(err || unreadMessages === null){
                        const err: ErrorResponse = {message: "message not found", state: "failed", type: "not_found"};
                        return [null, err];
                    }

                    conversation.unread_messages_count = unreadMessages;
                }
            }

            detailedConversations.push(conversation)
        }

        const validConversations: Conversation[] = whiteListConversations(detailedConversations);
        return [validConversations, null];

    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function checkIsThereConversation(firstUserId: Types.ObjectId, secondUserId: Types.ObjectId): Promise<[Types.ObjectId | null, null | ErrorResponse]> {
    try {
        const conversation: Conversation | null = await ConversationModel.findOne(
            {
                members: {
                    $all: [firstUserId, secondUserId]
                },
                type: "pv"
            }
        ).lean();
    
        if(conversation){
            return [conversation._id, null];

        }else{
            return [null, null];
        }

    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function createNewPvConversation(firstUserId: Types.ObjectId, secondUserId: Types.ObjectId, lastMessageId: Types.ObjectId): Promise<[Types.ObjectId | null, ErrorResponse | null]> {
    try {
        const conversation = await ConversationModel.create({
            group_name: null,
            group_avatar: null,
            members: [firstUserId, secondUserId],
            type: "pv",
            last_message_id: {
                [firstUserId.toString()]: lastMessageId,
                [secondUserId.toString()]: lastMessageId
            },
            deleted_for: {
                [firstUserId.toString()]: new Date(),
                [secondUserId.toString()]: new Date()
            },
            created_at: new Date()
        });

        if(conversation){
            return [conversation._id, null];
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

export async function updateConversationLastMessageId(conversationId: Types.ObjectId, lastMessageId: Types.ObjectId, side: "one" | "both", userId?: Types.ObjectId,): Promise<[true | false | null, ErrorResponse | null]> {
    try {
        let result;

        if (side === "one") {
            if (!userId) {
                const err: ErrorResponse = {message: "userId is required when side is 'one'", state: "failed", type: "input_error"};
                return [null, err];
            }

            console.log(conversationId, lastMessageId, userId);
            result = await ConversationModel.updateOne(
                {_id: conversationId},
                {$set: {[`last_message_id.${userId.toString()}`]: lastMessageId}}
            );
            console.log("update result:", result);
        } else if (side === "both") {
            result = await ConversationModel.updateOne(
                {_id: conversationId},
                [
                    {
                        $set: {
                            last_message_id: {
                                $arrayToObject: {
                                    $map: {
                                        input: {$objectToArray: "$last_message_id"},
                                        as: "kv",
                                        in: {k: "$$kv.k", v: lastMessageId}
                                    }
                                }
                            }
                        }
                    }
                ]
            );

        } else {
            const err: ErrorResponse = {message: "Invalid side value", state: "failed", type: "input_error"};
            return [null, err];
        }

        if (result.acknowledged === true) {
            return [true, null];
        } else {
            const err: ErrorResponse = {message: "Couldn't update conversation last message id", state: "failed", type: "system_error"};
            return [null, err];
        }

    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function softDeleteConversation(userInfo: ProtectedUserInfo, conversationId: Types.ObjectId): Promise<[Boolean | null, null | ErrorResponse]> {
    try {
        await ConversationModel.updateOne({
            _id: conversationId
        }, {
            $set: {
                [`deleted_for.${userInfo.id}`]: new Date()
            }
        });

        return [true, null];
    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function hardDeleteConversation(conversationId: Types.ObjectId): Promise<[Boolean | null, null | ErrorResponse]> {
    try {
        //Deleting conversation all messages
        const [messageDeleteResult, error] = await deleteConversationMessages(conversationId);
        if(error){
            return [null, error];
        }

        await ConversationModel.deleteOne({
            _id: conversationId
        });

        return [true, null]
    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function getConversationById(convId: Types.ObjectId): Promise<[Conversation | null, ErrorResponse | null]> {
    try {
        const conversation: Conversation | null = await ConversationModel.findOne({
            _id: convId
        }).lean();
    
        if(conversation){
            return [conversation, null];
    
        }else{
            return [null, null];
        }

    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};