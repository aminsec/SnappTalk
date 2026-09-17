import { Request, Response } from "express";
import { checkCredentials } from "../../services/auth.services";
import { showError, sendResponse, generateJWTToken } from "../../utils/operations";
import {ErrorResponse } from "../../types/response.types";
import { RawUserInfo } from "../../types/user.types";

export async function handleLogin(req: Request, resp: Response): Promise<void> {
    const { email, password } = req.body;

    //Checking user existance and correcness of creds in one query
    const [credsCheckResult, userInfo , error]: [false, null, null] | [true, RawUserInfo , null] | [null, null, ErrorResponse] = await checkCredentials(email, password);
    if(error){
        showError(error, resp);
        return;
    }

    //Assigning token if credentials was correct
    if(credsCheckResult === true){
        //Signing token
        const [token, err] = generateJWTToken(userInfo);
        if(err){
            showError(err, resp);
            return;
        }

        const responseData = {state: "success", message: "Login was successful"};
        const responseHeaders = {"Set-Cookie": `token=${token}; path=/; sameSite=lax; domain=.snapptalk.io`};
        sendResponse(responseData, responseHeaders, 200, resp);

    }else{
        const error:ErrorResponse = {state: "failed", message: "Invalid username or password", type: "creds_error"};
        showError(error, resp);
        return;
    }
};