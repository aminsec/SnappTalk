import { Types } from "mongoose";
import { Message as MessageModel } from "../models/messages.model";
import { ErrorResponse } from "../types/response.types";
import { InsertMessage, Message } from "../types/messages.types";

export async function getMessageById(messageId: Types.ObjectId): Promise<[Message | null, ErrorResponse | null]> {
    try {
        const message: Message | null = await MessageModel.findOne({
            _id: messageId
        }).lean();
        
        return [message, null];
    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function getConversationMessagesByLimitedDate(conversationId: Types.ObjectId, deletedConversationDate: string, limit: number, offset: number, userId: Types.ObjectId): Promise<[Message[] | null, ErrorResponse | null]> {
    try {
        const messages: Message[] = await MessageModel.aggregate<Message>([
            {
                $match: {
                  conversation_id: conversationId,
                  created_at: {
                        $gt: new Date(deletedConversationDate)
                    },
                  deleted_for: {$nin: [userId]}
                }
              },
            
              {
                $sort: {
                  created_at: -1,
                  _id: -1           
                }
              },
            
              { $skip: offset },
              { $limit: limit },
            {
              $lookup: {
                from: "messages",
                localField: "replied_to",
                foreignField: "_id",
                as: "replied_to_doc",
                pipeline: [
                  // Extracting needed fields
                  {
                    $project: {
                      _id: 1,
                      type: 1,
                      content: 1,
                    }
                  }
                ]
              }
            },
            {
              $addFields: {
                replied_to: { $first: "$replied_to_doc" } // convert array -> single object. The $first operator returns the first element of the array we created replied_to_doc. If the array is empty, it returns null.
              }
            },
            { $project: { replied_to_doc: 0 } }
          ]);

          return [messages, null];
          
    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function createNewMessage(data: InsertMessage): Promise<[Types.ObjectId | null, ErrorResponse | null]> {
    try {
        const message = await MessageModel.create({
            conversation_id: data.conversation_id,
            sender: data.sender,
            type: data.type,
            content: data.content,
            attachments: data.attachments,
            seen_by: {[data.sender.toString()]: new Date()},
            edited: false,
            created_at: new Date(),
            replied_to: data.replied_to,
            deleted_for: []
        });

        if(message){
            return [message._id, null];
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

export async function seenMessageById(message_id: Types.ObjectId, conversation_id: Types.ObjectId, userid: string): Promise<[Boolean | null, ErrorResponse | null]> {
    try {
        const updateResult = await MessageModel.updateOne({
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

export async function getUnreadMessagesCount(userId: string, conversationId: Types.ObjectId): Promise<[Number | null, ErrorResponse | null]> {
    try {
        const count = await MessageModel.countDocuments({
          conversation_id: conversationId,
          sender: { $ne: new Types.ObjectId(userId) },                 
          [`seen_by.${userId}`]: { $exists: false }
        });
    
        return [count, null];
    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function deleteConversationMessages(conversationId: Types.ObjectId): Promise<[Boolean | null, ErrorResponse | null]> {
    try {
        await MessageModel.deleteMany({
            conversation_id: conversationId
        });

        return [true, null];
    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function editMessageById(messageId: Types.ObjectId, new_message: string): Promise<[Boolean | null, null | ErrorResponse]> {
    try {
        await MessageModel.updateOne({
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

export async function deleteMessageById(messageId: Types.ObjectId): Promise<[Boolean | null, ErrorResponse | null]> {
    try {
        const result = await MessageModel.deleteOne({
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

export async function softDeleteMessage(messageId: Types.ObjectId, userId: Types.ObjectId): Promise<[Boolean | null, ErrorResponse | null]> {
    try {
        await MessageModel.updateOne({
            _id: messageId
        }, {
            $addToSet: {
                deleted_for: userId
            }
        });

        return [true, null];
    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};