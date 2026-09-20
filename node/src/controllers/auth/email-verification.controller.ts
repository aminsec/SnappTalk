import { Request, Response } from "express";
import { verifyEmailToken } from "../../services/auth.services";
import { generateJWTToken, sendResponse, showError } from "../../utils/operations";
import { getRandomString } from "../../utils/operations";
import { queueMessage } from "../../producers/email";
import { sendEmailMessage } from "../../types/brokers.messages.types";
import { resendEmailVerification } from "../../services/auth.services";
import { EMAIL_QUEUE } from "../../constants/queue";

export async function handleEmailVerification(req: Request, resp: Response) {
    const { token } = req.params;

    const hashedToken = new Bun.CryptoHasher("sha256").update(token).digest("hex")
    const [userInfo, error] = await verifyEmailToken(hashedToken);
    if(error){
        showError(error, resp);
        return;
    }

    const [jwtToken, err] = generateJWTToken(userInfo);

    if(err){
        showError(err, resp);
        return;
    }

    const responseHeaders = {"Set-Cookie": `token=${jwtToken}; path=/; sameSite=lax; domain=.snapptalk.io`, "Location": "/chat"};
    sendResponse({state: "success"}, responseHeaders, 301, resp);
};

export async function handleResendEmailVerification(req: Request, resp: Response) {
    const { email } = req.body;
    const [ rawToken, hashedToken ] = getRandomString();
    const {hostname, protocol} = req;
    const verifyUrl = `${protocol}://${hostname}/api/v1/auth/verify-email/${rawToken}`;

    const [ resendResult, error ] = await resendEmailVerification(email, hashedToken);
    if(error){
        showError(error, resp);
        return;
    }

    if(resendResult === false){
        const message = {message: "Email sent", state: "success"};
        sendResponse(message, {}, 200, resp);
        return;
    }

    //Queueing email
    const verifyEmailJob: sendEmailMessage = {
        to: email,
        subject: "Welcome To SnappTalk",
        template: "verify-email",
        parameters: {"VERIFY_URL": verifyUrl},
    };

    const [ _ , queueError] = await queueMessage(EMAIL_QUEUE, verifyEmailJob);
    if(queueError){
        showError(queueError, resp);
        return;
    }

    sendResponse({state: "success", message: "Email sent"}, {}, 200, resp);
};