import * as bcrypt from 'bcrypt';
import { Resp, Error } from '../types/response.types';
import { Response } from 'express';
import { ProtectedUserInfo, RawUserInfo } from '../types/user.types';
import * as fs from 'fs';
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

export function whiteListUserInfo(userData: RawUserInfo): ProtectedUserInfo{
    const validatedUserData = {
        id: userData._id.toString(),
        username: userData.username,
        email: userData.email,
        role: userData.role,
        profilePic: userData.profilePic,
        joinedAt: userData.joinedAt,
        bio: userData.bio || "" // Default bio is empty if not provided
    };

    return validatedUserData;
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

export async function uploadFile(content: string): Promise<[string | null, Error | null]> {
    //Decoding the base64 to save in buffer
    const file: Buffer = Buffer.from(content, "base64");

    //Writing the binary into a file in /uploads folder
    try {
        //Avoiding using file extention for security reasons
        const filename: string = getRandomString();
        const uploadPath = "/up/node/uploads/" + filename;
        fs.writeFile(uploadPath, file, err => {
            if(err){
                throw new Error("System error occurred. Coudln't upload file")
            }
        });

        return [filename, null];

    } catch (error) {
        console.log(error);
        const err: Error = {message: "A system error occurred. Couldn't upload file", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function deleteFileFromUploads(filename: string): Promise<[Boolean | null, Error | null]>  {
    try {
        //Preventing deleting default image
        if(filename === "default.png"){
            return [true, null];
        }

        const filePath = "/up/node/uploads/" + filename;
        fs.unlink(filePath, error => {
            if(error){
                throw new Error("System error occurred. Coudln't upload file")
            }
        });

        return [true, null]

    } catch (error) {
        console.log(error);
        const err: Error = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

//Generates salt automatically
export async function makeBcryptHash(value: string) {
    return await bcrypt.hash(value, saltRounds);
};

export async function checkBcrypt(plainText: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(plainText, hash);
};