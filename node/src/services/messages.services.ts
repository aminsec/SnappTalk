import { ObjectId } from "mongodb";
import { getMessagesCollection } from "../models/messages.model";
import { ErrorResponse } from "../types/response.types";
import { Message } from "../types/messages.types";

export async function getMessageById(messageId: ObjectId): Promise<Message> {
    const messagesCollection = await getMessagesCollection();
    const message = await messagesCollection.findOne({
        _id: messageId
    });

    return message;
};

export async function getConversationMessagesByLimitedDate(conversationId: ObjectId, deletedConversationDate: string, limit: number, offset: number): Promise<[Message[] | null, ErrorResponse | null]> {
    try {
        console.log(deletedConversationDate)
        const messagesCollection = await getMessagesCollection();
        const messages = await messagesCollection.find({
            conversation_id: conversationId,
            created_at: {
                $gt: new Date(deletedConversationDate)
            }

        }, {
            limit: limit,
            skip: offset
        }).sort({ created_at: -1 }).toArray();

        return [messages, null];
    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function createNewMessage(conversationId: ObjectId, sender: ObjectId, type: string, content: string, attachments: string[]): Promise<[ObjectId | null, ErrorResponse | null]> {
    try {
        const messagesCollection = await getMessagesCollection();
        const message = await messagesCollection.insertOne({
            conversation_id: conversationId,
            sender: sender,
            type: type,
            content: content,
            attachments: attachments,
            seen_by: {[sender.toString()]: new Date()},
            edited: false,
            created_at: new Date()
        });

        if(message.acknowledged === true){
            return [message.insertedId, null];
        }else{
            const err: ErrorResponse = {message: "Couldn't create message", state: "failed", type: "system_error"};
            return [null, err];
        }

    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function seenMessageById(message_id: ObjectId, conversation_id: ObjectId, userid: string): Promise<[Boolean | null, ErrorResponse | null]> {
    try {
        const messagesCollection = await getMessagesCollection();
        const updateResult = messagesCollection.updateOne({
            conversation_id,
            _id: message_id,
        }, {
            $set: {
                [`seen_by.${userid}`]: new Date()
            }
        });
    
        if(updateResult.matchCount === 0){
            const error: ErrorResponse = {state: "failed", message: "Coulnd't find message", type: "not_found"}; 
            return [null, error];
        }

        return [true, null];

    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function getUnreadMessagesCount(userId: string, conversationId: ObjectId) {
    try {
        const messagesCollection = await getMessagesCollection();
        const count = await messagesCollection.countDocuments({
          conversation_id: conversationId,
          sender: { $ne: new ObjectId(userId) },                 
          [`seen_by.${userId}`]: { $exists: false }
        });
    
        return [count, null];
    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function deleteConversationMessages(conversationId: ObjectId): Promise<[Boolean | null, ErrorResponse | null]> {
    try {
        const messagesCollection = await getMessagesCollection();
        const result = await messagesCollection.deleteMany({
            conversation_id: conversationId
        });

        return [true, null];
    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};