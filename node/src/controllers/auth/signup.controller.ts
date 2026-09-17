import { Request, Response } from "express";
import { createUser, getRawUserInfoByEmail } from "../../services/auth.services";
import { getRandomString, sendResponse, showError } from "../../utils/operations";
import { ErrorResponse } from "../../types/response.types";
import { checkUserExistsByUsername } from "../../services/account.services";
import { sendEmailJob } from "../../types/jobs.types";
import { queueEmail } from "../../producers/email";

export async function handleSignup(req: Request, resp: Response) {
    const { username, email, password } = req.body;
    const { hostname, protocol } = req;

    const [ emailInfo, error ] = await getRawUserInfoByEmail(email);
    if(error){
        showError(error, resp);
        return;
    }

    if(emailInfo.verified === true){
        const message: ErrorResponse = {message: "This email is already taken", state: "failed", type: "input_error"};
        showError(message, resp);
        return;
    }

    //Note for frontend: In this case frontend should show a message to user that email is waiting for verification with a resend link
    if(emailInfo.verified === false){
        const message: ErrorResponse = {message: "This email is waiting for verification", state: "failed", type: "input_error"};
        showError(message, resp);
        return;
    }

    const [ usernameExist, err ] = await checkUserExistsByUsername(username);
    if(err){
        console.log("sdfsdf")
        showError(err, resp);
        return;
    }

    if(usernameExist === true){
        const message: ErrorResponse = {message: "This username is already taken", state: "failed", type: "input_error"};
        showError(message, resp);
        return;
    }

    const [ rawToken, hashedToken ] = getRandomString();
    const verifyUrl = `${protocol}://${hostname}/api/v1/auth/forgot-password/${rawToken}`;

    const [ createUserResult, createError ] = await createUser(email, password, hashedToken);
    if(createError){
        showError(createError, resp);
        return;
    }
    
    //Queueing email
    const verifyEmailJob: sendEmailJob = {
        to: email,
        subject: "Welcome To SnappTalk",
        template: "verify-email",
        parameters: {"VERIFY_URL": verifyUrl},
    };

    const [ _ , queueError] = await queueEmail(verifyEmailJob);
    if(queueError){
        showError(queueError, resp);
        return;
    }

    const message = {state: "success", message: "Email sent"};
    sendResponse(message, {}, 202, resp);
};