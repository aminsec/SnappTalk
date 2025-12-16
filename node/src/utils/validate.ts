import { ObjectId } from "mongodb";
import { getConversationsCollection } from "../models/conversatations.model";
import {ErrorResponse } from "../types/response.types";
import { Conversation } from "../types/conversation.types";

export async function checkEmailIsValid(email: string): Promise<[true | false | null,ErrorResponse | null]> {
    try {
        //Checking email is in correct format
        const emailCheckRegex = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$");

        if(emailCheckRegex.test(email)){
            return [true, null];

        }else{
            return [false, null];
        }

    } catch (error) {
        console.log(error);
        const err:ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function checkUserHasAccessToConversation(conversationId: ObjectId, userId: string): Promise<[Conversation | null, ErrorResponse | null]> {
    try {
        const conversationsCollection = await getConversationsCollection();
        const conversation = await conversationsCollection.findOne({
            _id: conversationId,
            members: {
                $in: [new ObjectId(userId)]
            }
        });

        if(conversation){
            return [conversation, null];
        }else{
            const err: ErrorResponse = {message: "Converstaion not found", state: "failed", type: "not_found"};
            return [null, err];
        }

    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};