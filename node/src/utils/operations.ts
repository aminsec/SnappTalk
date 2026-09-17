import { Resp, ErrorResponse } from '../types/response.types';
import { Response } from 'express';
import { ProtectedUserInfo } from '../types/user.types';
import * as jwt from "jsonwebtoken";
import { Conversation } from '../types/conversation.types';
import { Message } from '../types/messages.types';
import { Types } from 'mongoose';
import crypto from "node:crypto";

// Function to send normall messages
export function sendResponse(data: Resp, headers: any = {}, code:number, resp: Response){
    headers["Content-Type"] = "application/json"; // Setting content-type to json
    resp.statusCode = code; // Setting status code
    resp.header(headers);
    resp.send(JSON.stringify(data));
    resp.end();
};

export function showError(error: ErrorResponse, resp: Response){
    sendResponse(error, {}, (
        error.type === "not_found" ? 404 :
        error.type === "system_error" ? 500 :
        error.type === "creds_error" ? 401 :
        error.type === "access_denied" ? 403 :
        error.type === "input_error" ? 400 :
        500), resp);

    if(error.type === "system_error"){
        console.log(error.message);
    }
    return;
};

export function whiteListConversations(conversations: Conversation[]): Conversation[]{
    const validConversations = [];

    for(var conv of conversations){
        const validConversation: any = {};
        validConversation._id = conv._id;
        validConversation.type = conv.type;
        validConversation.group_name = conv.group_name;
        validConversation.group_avatar = conv.group_avatar;
        validConversation.contact_info = conv.contact_info;
        validConversation.created_at = conv.created_at;
        validConversation.last_message = conv.last_message;
        validConversation.unread_messages_count = conv.unread_messages_count;
        validConversations.push(validConversation);
    }

    return validConversations;
};

export function getRandomString(): [string, string] {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes); // Web Crypto API — global, no import needed
    const rawToken = Buffer.from(bytes).toString("hex");

    const hasher = new Bun.CryptoHasher("sha256");
    hasher.update(rawToken);
    const hashedToken = hasher.digest("hex");

    return [rawToken, hashedToken];
}

export function generateJWTToken(userInfo: ProtectedUserInfo): [string | null, ErrorResponse | null] {
    try {
        const userInfoToBeSign = {
            _id: userInfo._id,
            email: userInfo.email,
            username: userInfo.username,
            profile_pic: userInfo.profile_pic,
            role: userInfo.role,
            joined_at: userInfo.joined_at,
        }

        const token = jwt.sign(userInfoToBeSign, String(process.env.JWT_SECRET_KEY), {expiresIn: "24h"});
        return [token, null];

    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function filterMessagesDeletedForUser(messages: Message[], userId: Types.ObjectId): Promise<Message[]> {
    const filteredMessages = messages.filter((message) => {
        return !message.deleted_for.some((id) => id.equals(userId));
    });

    return filteredMessages;
};