import { Conversation } from "../types/conversation.types";
import { ErrorResponse } from "../types/response.types";
import { Conversation as ConversationModel } from "../models/conversatations.model";
import { ProtectedUserInfo } from "../types/user.types";
import { Types } from "mongoose";
import { deleteConversationMessages } from "./messages.services";

export async function getUserConversations(userInfo: ProtectedUserInfo): Promise<[Conversation[] | null, ErrorResponse | null]> {
    try {
        const conversations: Conversation[] = await ConversationModel.find(
            {members:
                {$in: [userInfo._id]}
            }
        ).lean();

        return [conversations, null];

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
                ],
                {updatePipeline: true}
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
                [`deleted_for.${userInfo._id}`]: new Date()
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
