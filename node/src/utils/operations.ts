import * as bcrypt from 'bcrypt';
import { Resp, ErrorResponse } from '../types/response.types';
import { Response } from 'express';
import { ProtectedUserInfo, RawUserInfo } from '../types/user.types';
import * as fs from 'fs';
import * as jwt from "jsonwebtoken";
import { Conversation } from '../types/conversation.types';
const saltRounds = 10;

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

export function whiteListUserInfo(userData: RawUserInfo): ProtectedUserInfo{
    const validatedUserData = {
        id: userData._id.toString(),
        username: userData.username,
        email: userData.email,
        role: userData.role,
        profile_pic: userData.profile_pic,
        joined_at: userData.joined_at,
        bio: userData.bio || "" // Default bio is empty if not provided
    };

    return validatedUserData;
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

export function getRandomString(): string {
    const length = 25;
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export async function uploadFile(content: string): Promise<[string | null, ErrorResponse | null]> {
    // Decoding the base64 to save in buffer
    const file: Buffer = Buffer.from(content, "base64");

    // Writing the binary into a file in /uploads folder
    try {
        // Avoiding using file extention for security reasons
        const filename: string = getRandomString();
        const uploadPath = "/up/node/uploads/" + filename;
        fs.writeFile(uploadPath, file, err => {
            if(err){
                throw new Error("System error occurred. Coudln't upload file");
            }
        });

        return [filename, null];

    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred. Couldn't upload file", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function deleteFileFromUploads(filename: string): Promise<[Boolean | null, ErrorResponse | null]>  {
    try {
        // Preventing deleting default image
        if(filename === "default.png"){
            return [true, null];
        }

        const filePath = "/up/node/uploads/" + filename;
        fs.unlink(filePath, error => {
            if(error){
                console.log(error);
                throw new Error("System error occurred. Coudln't upload file");
            }
        });

        return [true, null]

    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export function generateJWTToken(userInfo: ProtectedUserInfo): [string | null, ErrorResponse | null] {
    try {
        const userInfoToBeSign = {
            id: userInfo.id,
            email: userInfo.email,
            username: userInfo.username,
            profile_pic: userInfo.profile_pic,
            role: userInfo.role,
            joined_at: userInfo.joined_at,
        }
    
        const token = jwt.sign(userInfoToBeSign, String(process.env.JWT_SECRET_KEY), {expiresIn: "1h"});
        return [token, null];

    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

// Generates salt automatically
export async function makeBcryptHash(value: string) {
    return await bcrypt.hash(value, saltRounds);
};

export async function checkBcrypt(plainText: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(plainText, hash);
};