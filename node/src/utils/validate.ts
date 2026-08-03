import { Types } from "mongoose";
import { Conversation as ConversationModel } from "../models/conversatations.model";
import {ErrorResponse } from "../types/response.types";
import { Conversation } from "../types/conversation.types";
import * as jwt from "jsonwebtoken";
import { ProtectedUserInfo } from "../types/user.types";
import { DeadSession } from "../models/dead_sessions.model";

export async function checkEmailIsValid(email: string): Promise<[true | false | null,ErrorResponse | null]> {
    try {
        // Checking email is in correct format
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

export async function checkUserHasAccessToConversation(conversationId: Types.ObjectId, userId: string): Promise<[Conversation | null, ErrorResponse | null]> {
    try {
        const conversation: Conversation | null = await ConversationModel.findOne({
            _id: conversationId,
            members: {
                $in: [new Types.ObjectId(userId)]
            }
        }).lean();

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

export async function validateJWT(token: string): Promise<ProtectedUserInfo | boolean> {
    // Checking if token is not in dead_sessions list
    const isTokenIsInDeadSessions = await DeadSession.findOne({token: token}).lean();
    if(isTokenIsInDeadSessions){
        return false;
    }

    // Verifing token in try-catch. If token was not valid, it will go through an error and we handle it with catch
    try {
        const userInfo = jwt.verify(token, String(process.env.JWT_SECRET_KEY)) as ProtectedUserInfo;
        return userInfo;
    } catch (error) {
        return false;
    }
};