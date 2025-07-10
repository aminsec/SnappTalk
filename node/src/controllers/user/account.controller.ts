import { checkUserExistsByUsername, getRawUserInfo, getUserInfoById, revokeUserToken, updateEmail, updatePassword, updateUsername } from "../../services/account.services";
import { showError, sendResponse, checkBcrypt, makeBcryptHash } from "../../utils/operations";
import { Request, Response } from "express";
import { Error } from "../../types/response.types";
import { checkUserExistsByEmail } from "../../services/auth.services";
import * as jwt from "jsonwebtoken";

export async function showUserInfo(req: Request, resp: Response) {
    const userid = req.userInfo.id;
    const [userInfo, error] = await getUserInfoById(userid);
    if(error){
        showError(error, resp);
        return;
    }

    const responseData = {state: "success", userInfo: userInfo};
    sendResponse(responseData, {}, 200, resp);
};

export async function updateUserInfo(req: Request, resp: Response) {
    const { username, email } = req.body;
    const { userInfo } = req;
    var emailUpdated: Boolean | null = false;
    let usernameUpdated: Boolean | null = false;

    //Preventing temp query to database if information was like before
    if(email === userInfo.email && username === userInfo.username){
        const message = {state: "success", message: "Profile updated."};
        sendResponse(message, {}, 200, resp);
        return;
    }

    //Updating username if it was not equal to the current one
    if(username !== userInfo.username){
        //Checking if the username exists
        const [userExists, error] = await checkUserExistsByUsername(username);
        if(error){
            showError(error, resp);
            return;
        }

        if(userExists === true){
            const error: Error = {state: "failed", message: "This username already exists", type: "input_error"};
            showError(error, resp);
            return;
        }

        //Updating user info if everything was fine
        const [usernameUpdatedResult, usernameUpdateError] = await updateUsername(userInfo.id, username);
        if(usernameUpdateError){
            showError(usernameUpdateError, resp);
            return;
        }

        usernameUpdated = usernameUpdatedResult;

    }else{
        //If username is equal to the current one, then just set it to true
        usernameUpdated = true;
    }

    //Updating email if it was not equal to the current one
    if(email !== userInfo.email){
        //Checking if email exists
        const [emailExists, err] = await checkUserExistsByEmail(email);
        if(err){
            showError(err, resp);
            return;
        }

        if(emailExists === true){
            const error: Error = {state: "failed", message: "This email already exists", type: "input_error"};
            showError(error, resp);
            return;
        }

        //Updating email
        const [emailUpdatedResult, emailUpdateError] = await updateEmail(userInfo.id, email);
        if(emailUpdateError){
            showError(emailUpdateError, resp);
            return;
        }

        emailUpdated = emailUpdatedResult;

    }else{
        //If email is equal to the current one, then just set it to true
        emailUpdated = true;
    }

    if(emailUpdated === true && usernameUpdated === true){
        //Adding user current session to dead_sessions and assigning new token
        const [revoked, err] = await revokeUserToken(req.cookies.token);
        if(err){
            showError(err, resp);
            return;
        }

        if(revoked === true){
            //Getting new user info
            const [newUserInfo, error] = await getUserInfoById(userInfo.id);
            if(error){
                showError(error, resp);
                return;
            }

            //Creating new token
            if(newUserInfo){
                const token = jwt.sign(newUserInfo, String(process.env.JWT_SECRET_KEY), {expiresIn: "1h"});
                const message = {state: "success", message: "Profile updated."};
                const responseHeaders = {"Set-Cookie": `token=${token}; path=/;`};
                sendResponse(message, responseHeaders, 200, resp);
            }
        }
    }else{
        const error: Error = {state: "failed", message: "Couldn't update profile", type: "system_error"};
        showError(error, resp);
    }
};

export async function updateUserPassword(req: Request, resp: Response) {
    const { old_password, new_password } = req.body;
    const { userInfo } = req;

    //checking old password is correct
    const [rawUserInfo, err] = await getRawUserInfo(userInfo.id);
    if(err){
        showError(err, resp);
        return;
    }

    if(!rawUserInfo){
        const error: Error = {state: "failed", message: "User not found", type: "input_error"};
        showError(error, resp);
        return;
    }

    const isOldPasswordCorrect: Boolean = await checkBcrypt(old_password, rawUserInfo.password);
    if(isOldPasswordCorrect === true){
        const [updatePasswordResult, err] = await updatePassword(userInfo.id, new_password);
        if(err){
            showError(err, resp);
            return;
        }

        if(updatePasswordResult === true){
            const message = {state: "success", message: "Password updated successfully."};
            sendResponse(message, {}, 200, resp);

        }else{
            const error: Error = {state: "failed", message: "Couldn't update password", type: "system_error"};
            showError(error, resp);
        }
    }else{
        const error: Error = {state: "failed", message: "Old password is incorrect", type: "input_error"};
        showError(error, resp);
    }
};