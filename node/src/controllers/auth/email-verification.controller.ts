import { Request, Response } from "express";
import { verifyEmailToken } from "../../services/auth.services";
import { generateJWTToken, sendResponse, showError } from "../../utils/operations";
import crypto from "node:crypto";

export async function handleEmailVerification(req: Request, resp: Response) {
    const { token } = req.params;
    console.log(token)
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const [userInfo, error] = await verifyEmailToken(hashedToken);
    console.log(userInfo)
    if(error){
        showError(error, resp);
        return;
    }

    const [jwtToken, err] = generateJWTToken(userInfo);
    console.log(jwtToken)
    if(err){
        showError(err, resp);
        return;
    }

    const responseHeaders = {"Set-Cookie": `token=${jwtToken}; path=/; sameSite=lax; domain=.snapptalk.io`, "Location": "/chat"};
    sendResponse({state: "success"}, responseHeaders, 301, resp);
};