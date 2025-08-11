import { checkUserExistsByUsername, getRawUserInfo, getUserInfoById, revokeUserToken, updateEmail, updatePassword, updateUsername, updateBio, updateProfilePicAddress } from "../../services/account.services";
import { showError, sendResponse, checkBcrypt, uploadFile, deleteFileFromUploads, generateJWTToken } from "../../utils/operations";
import { Request, Response } from "express";
import {ErrorResponse } from "../../types/response.types";
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
    const { username, email, bio } = req.body;
    const { userInfo } = req;
    let emailUpdated: Boolean | null = true;
    let usernameUpdated: Boolean | null = true;
    let bioUpdated: Boolean | null = false;

    //Checking username
    if(username !== userInfo.username){
        //Checking if the username exists
        const [userExists, error] = await checkUserExistsByUsername(username);
        if(error){
            showError(error, resp);
            return;
        }

        if(userExists === true){
            const error:ErrorResponse = {state: "failed", message: "This username already exists", type: "input_error"};
            showError(error, resp);
            return;
        }
    }

    //Checking email
    if(email !== userInfo.email){
        //Checking if email exists
        const [emailExists, err] = await checkUserExistsByEmail(email);
        if(err){
            showError(err, resp);
            return;
        }

        if(emailExists === true){
            const error:ErrorResponse = {state: "failed", message: "This email already exists", type: "input_error"};
            showError(error, resp);
            return;
        }
    }

    //Updating username if was not equal to the current one
    if(username !== userInfo.username){
        const [usernameUpdatedResult, usernameUpdateError] = await updateUsername(userInfo.id, username);
        if(usernameUpdateError){
            showError(usernameUpdateError, resp);
            return;
        }

        usernameUpdated = usernameUpdatedResult;
    }

    //Updating email if was not equal to the current one
    if(email !== userInfo.email){
        const [emailUpdatedResult, emailUpdateError] = await updateEmail(userInfo.id, email);
        if(emailUpdateError){
            showError(emailUpdateError, resp);
            return;
        }

        emailUpdated = emailUpdatedResult;
    }

    //Updating bio
    const [updateBioResult, updateBioError] = await updateBio(userInfo.id, bio);
    if(updateBioError){
        showError(updateBioError, resp);
        return;
    }

    bioUpdated = updateBioResult;

    //Checking if everything was fine
    if(emailUpdated === true && usernameUpdated === true && bioUpdated === true){
       
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
                const [token, error] = await generateJWTToken(newUserInfo);
                 if(error){
                    showError(error, resp);
                    return;
                }

                const message = {state: "success", message: "Profile updated."};
                const responseHeaders = {"Set-Cookie": `token=${token}; path=/;`};
                sendResponse(message, responseHeaders, 200, resp);
            }
        }

    }else{
        const error:ErrorResponse = {state: "failed", message: "Couldn't update profile", type: "system_error"};
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
        const error:ErrorResponse = {state: "failed", message: "User not found", type: "input_error"};
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
            const error:ErrorResponse = {state: "failed", message: "Couldn't update password", type: "system_error"};
            showError(error, resp);
        }
    }else{
        const error:ErrorResponse = {state: "failed", message: "Old password is incorrect", type: "input_error"};
        showError(error, resp);
    }
};

export async function updateUserProfile(req: Request, resp: Response) {
    const { content } = req.body;
    const { userInfo } = req;
    
    //Removing the old profile file, if profile image was not the default "default.png" image
    const userProfilePicAdress = userInfo.profilePic;
    const profilePicFileName = userProfilePicAdress.split("/").pop() ?? "default.png"; // --> /statics/images/default.png -> default.png
   
    const [removeResult, error] = await deleteFileFromUploads(profilePicFileName);
    if(error){
        showError(error, resp);
        return;
    }

    if(removeResult === true){
        const [updateProfileResult, err] = await uploadFile(content);
        if(err){
            showError(err, resp);
            return;
        }

        if(updateProfileResult){
            //Updating user profilePic address in db
            const [updateResult, error] = await updateProfilePicAddress(userInfo.id, updateProfileResult);
            if(error){
                showError(error, resp);
                return;
            }

            if(updateResult === true){
                //Assigning new token
                const [revoked, err] = await revokeUserToken(req.cookies.token);
                if(err){
                    showError(err, resp);
                    return;
                }

                if(revoked === true){
                    const [userData, err] = await getUserInfoById(userInfo.id);
                    if(err){
                        showError(err, resp);
                        return;
                    }

                    if(userData){
                        userData.profilePic = "/statics/images/" + updateProfileResult; // Updating userInfo with new profile pic address
                        const [newToken, error] = await generateJWTToken(userData);
                        if(error){
                            showError(error, resp);
                            return;
                        }

                        const responseData = {state: "success", message: "Profile picture updated successfully."};
                        const responseHeaders = {"Set-Cookie": `token=${newToken}; path=/;`};
                        sendResponse(responseData, responseHeaders, 200, resp);
                    }

                }else{
                    const error:ErrorResponse = {state: "failed", message: "Couldn't update profile", type: "system_error"};
                    showError(error, resp);
                }

            }else{
                const error:ErrorResponse = {state: "failed", message: "Couldn't update profile", type: "system_error"};
                showError(error, resp);
            }

        }else{
            const error:ErrorResponse = {state: "failed", message: "Couldn't upload profile", type: "system_error"};
            showError(error, resp);
        }

    }else{
        const error:ErrorResponse = {state: "failed", message: "Couldn't update profile", type: "system_error"};
        showError(error, resp);
    }
}; 