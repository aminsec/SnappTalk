import { Collection, ObjectId } from "mongodb";
import { getMessagesCollection } from "../models/messages.model";
import { ErrorResponse } from "../types/response.types";
import { InsertMessage, Message } from "../types/messages.types";

export async function getMessageById(messageId: ObjectId): Promise<[Message | null, ErrorResponse | null]> {
    try {
        const messagesCollection: Collection<Message> = await getMessagesCollection();
        const message = await messagesCollection.findOne({
            _id: messageId
        });
        
        return [message, null];
    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function getConversationMessagesByLimitedDate(conversationId: ObjectId, deletedConversationDate: string, limit: number, offset: number): Promise<[Message[] | null, ErrorResponse | null]> {
    try {
        const messagesCollection: Collection<Message> = await getMessagesCollection();
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

export async function createNewMessage(data: InsertMessage): Promise<[ObjectId | null, ErrorResponse | null]> {
    try {
        const messagesCollection: Collection = await getMessagesCollection();
        const message = await messagesCollection.insertOne({
            conversation_id: data.conversation_id,
            sender: data.sender,
            type: data.type,
            content: data.content,
            attachments: data.attachments,
            seen_by: {[data.sender.toString()]: new Date()},
            edited: false,
            created_at: new Date(),
            replied_to: data.replied_to
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
        const messagesCollection: Collection = await getMessagesCollection();
        const updateResult = await messagesCollection.updateOne({
            conversation_id,
            _id: message_id,
        }, {
            $set: {
                [`seen_by.${userid}`]: new Date()
            }
        });
    
        if(updateResult.matchedCount === 0){
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

export async function getUnreadMessagesCount(userId: string, conversationId: ObjectId): Promise<[Number | null, ErrorResponse | null]> {
    try {
        const messagesCollection: Collection = await getMessagesCollection();
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
        const messagesCollection: Collection = await getMessagesCollection();
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

export async function editMessageById(messageId: ObjectId, new_message: string): Promise<[Boolean | null, null | ErrorResponse]> {
    try {
        const messagesCollection: Collection = await getMessagesCollection();
        const result = await messagesCollection.updateOne({
            _id: messageId
        }, {
            $set: {
                content: new_message,
                edited: true,
                edited_at: new Date()
            }
        });

        return [true, null];

    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function deleteMessageById(messageId: ObjectId): Promise<[Boolean | null, ErrorResponse | null]> {
    try {
        const messagesCollection: Collection = await getMessagesCollection();
        const result = await messagesCollection.deleteOne({
            _id: messageId
        });

        if(result.acknowledged === true){
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