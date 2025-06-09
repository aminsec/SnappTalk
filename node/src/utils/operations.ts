import * as bcrypt from 'bcrypt';
import { Resp, Error } from '../types/response.types';
import { Response } from 'express';
import { ProtectedUserInfo, RawUserInfo } from '../types/user.types';
const saltRounds = 10;

//Function to send normall messages
export function sendResponse(data: Resp, headers: any = {}, code:number, resp: Response){
    headers["Content-Type"] = "application/json"; //Setting content-type to json
    resp.statusCode = code; //Setting status code
    resp.header(headers);
    resp.send(JSON.stringify(data)); 
    resp.end();
};

export function showError(error: Error, resp: Response){
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

//Generates salt automatically
export async function makeBcryptHash(value: string) {
    return await bcrypt.hash(value, saltRounds);
};

export async function checkBcrypt(plainText: string, hash: string) {
    return await bcrypt.compare(plainText, hash);
};

export function whiteListUserInfo(userData: RawUserInfo): ProtectedUserInfo{
    const validatedUserData = {
        id: userData._id.toString(),
        username: userData.username,
        email: userData.email,
        role: userData.role,
        profilePic: userData.profilePic,
        joinedAt: userData.joinedAt
    };

    return validatedUserData;
};