import { Request, Response } from "express";
import { showError, sendResponse, getRandomString, generateJWTToken } from "../../utils/operations";
import { checkForgotTokenAndRevoke, insertForgotTokenByEmail } from "../../services/forgot.services";
import { sendEmail } from "../../providers/email";
import { ErrorResponse } from "../../types/response.types";
import crypto from "node:crypto";

export async function requestForgotPasswordLink(req: Request, resp: Response) {
    const { email } = req.body;
    const {hostname, protocol} = req;

    //Inserting token
    const [rawToken, hashedToken] = getRandomString();
    const [result, insertError] = await insertForgotTokenByEmail(email, hashedToken); //atomic update
    if(insertError){
        showError(insertError, resp);
        return;
    }

    if(result === true){
        //sending email if the email was exist 
        const reset_url =  `${protocol}://${hostname}/api/v1/auth/forgot-password/${rawToken}`;
        const [result, err] = await sendEmail(email, "Forgot Password", "forgot-password", {"RESET_URL": reset_url});
        if(err){
            showError(err, resp);
            return;
        }

        const message = {state: "success", message: "Email sent"};
        sendResponse(message, {}, 200, resp);

    }else{
        //We show success message even if email was not exist
        const message = {state: "success", message: "Email sent"};
        sendResponse(message, {}, 200, resp);
    }
};

export async function handleForgotPasswordToken(req: Request, resp: Response) {
    const { token } = req.params;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    
    const [resetResult, error] = await checkForgotTokenAndRevoke(hashedToken);
    if(error){
        showError(error, resp);
        return;
    }

    if(resetResult === null){
        const message: ErrorResponse = {state: "failed", message: "Provided token not found or is expired", type: "input_error"};
        showError(message, resp);
        return;
    }

    //Assigning new token
    const [jwtToken, err] = generateJWTToken(resetResult);
    if(err){
        showError(err, resp);
        return;
    }

    const responseHeaders = {"Set-Cookie": `token=${jwtToken}; path=/; sameSite=lax; domain=.snapptalk.io`, "Location": "/chat"};
    sendResponse({state: "success"}, responseHeaders, 301, resp);
}