import { Request, Response } from "express";
import { showError, sendResponse, getRandomString } from "../../utils/operations";
import { insertForgotTokenByEmail } from "../../services/forgot.services";
import { sendEmail } from "../../providers/email";

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
    console.log(result)
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