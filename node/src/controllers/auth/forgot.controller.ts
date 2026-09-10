import { Request, Response } from "express";
import { checkUserExistsByEmail } from "../../services/auth.services";
import { showError, sendResponse, getRandomString } from "../../utils/operations";
import { insertForgotTokenByEmail } from "../../services/forgot.services";
import { sendEmail } from "../../providers/email";

export async function requestForgotPasswordLink(req: Request, resp: Response) {
    const { email } = req.body;
    const {hostname, protocol} = req;
    console.log(hostname)

    const [userExists, error] = await checkUserExistsByEmail(email);
    if(error){
        showError(error, resp);
        return;
    }

    if(userExists === false){
        //We return success response even if email does not exist to prevent email gatheration for security
        const message = {state: "success", message: "Email sent"};
        sendResponse(message, {}, 200, resp);
        return;
    }

    //Inserting token
    const [rawToken, hashedToken] = getRandomString();
    const [result, insertError] = await insertForgotTokenByEmail(email, hashedToken);
    if(insertError){
        showError(insertError, resp);
        return;
    }

    if(result){
        //sending email
        const reset_url =  `${protocol}://${hostname}/api/v1/auth/forgot-password/${rawToken}`;
        const [result, err] = await sendEmail(email, "Forgot Password", "forgot-password", {"RESET_URL": reset_url});
        if(err){
            showError(err, resp);
            return;
        }

        const message = {state: "success", message: "Email sent"};
        sendResponse(message, {}, 200, resp);
    }
};