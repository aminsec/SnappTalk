import { checkUserExistsByUsername, getRawUserInfo, getUserInfoById, revokeUserToken, updateEmail, updatePassword, updateUsername, updateBio, updateProfilePicAddress, setAccountDeleted } from "../../services/account.services";
import { showError, sendResponse, checkBcrypt, deleteFileFromS3, generateJWTToken } from "../../utils/operations";
import { Request, Response } from "express";
import {ErrorResponse } from "../../types/response.types";
import { checkUserExistsByEmail } from "../../services/auth.services";
import { Types } from "mongoose";
import { uploadMediaToS3 } from "../../services/media.services";

export async function showUserInfo(req: Request, resp: Response) {
    const userid = req.userInfo._id;
    const [userInfo, error] = await getUserInfoById([userid]);
    if(error){
        showError(error, resp);
        return;
    }

    if (!userInfo) {
      const error:ErrorResponse = {state: "failed", message: "Couldn't get information", type: "system_error"};
      showError(error, resp);
      return;
    }

    const responseData = {state: "success", userInfo: userInfo[0]};
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
        const [usernameUpdatedResult, usernameUpdateError] = await updateUsername(new Types.ObjectId(userInfo._id), username);
        if(usernameUpdateError){
            showError(usernameUpdateError, resp);
            return;
        }

        usernameUpdated = usernameUpdatedResult;
    }

    //Updating email if was not equal to the current one
    if(email !== userInfo.email){
        const [emailUpdatedResult, emailUpdateError] = await updateEmail(userInfo._id, email);
        if(emailUpdateError){
            showError(emailUpdateError, resp);
            return;
        }

        emailUpdated = emailUpdatedResult;
    }

    //Updating bio
    const [updateBioResult, updateBioError] = await updateBio(userInfo._id, bio);
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
            const [newUserInfo, error] = await getUserInfoById([userInfo._id]);
            if(error){
                showError(error, resp);
                return;
            }

            //Creating new token
            if(newUserInfo){
                const [token, error] = generateJWTToken(newUserInfo[0]);
                 if(error){
                    showError(error, resp);
                    return;
                }

                const message = {state: "success", message: "Profile updated."};
                const responseHeaders = {"Set-Cookie": `token=${token}; path=/; sameSite=lax; domain=.snapptalk.io`};
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
    const [rawUserInfo, err] = await getRawUserInfo(userInfo._id);
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
        const [updatePasswordResult, err] = await updatePassword(userInfo._id, new_password);
        if(err){
            showError(err, resp);
            return;
        }

        if(updatePasswordResult === true){
            const message = {state: "success", message: "Password updated successfully"};
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
    const { file } = req;
    let { userInfo } = req;

    if(!file) {
        const error: ErrorResponse = {message: "File is required", state: "Failed", type: "input_error"};
        showError(error, resp);
        return;
    }

    //Removing the old profile file, if profile image was not the default "default.png" image
    const userProfilePicAdress = userInfo.profile_pic;
    const profilePicFileName = userProfilePicAdress.split("/").pop() ?? "default.png"; // --> /statics/images/default.png -> default.png

    const [removeResult, error] = await deleteFileFromS3(profilePicFileName, process.env.MINIO_PUBLIC_BUCKET ?? "profilepics");
    if(error){
        showError(error, resp);
        return;
    }

    if(removeResult === true){
        const [profilePicKey, err] = await uploadMediaToS3(file, process.env.MINIO_PUBLIC_BUCKET ?? "profilepics");
        if(err){
            showError(err, resp);
            return;
        }

        if(profilePicKey){
            //Updating user profilePic address in db
            const [updateResult, error] = await updateProfilePicAddress(userInfo._id, profilePicKey);
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
                    userInfo.profile_pic = "/statics/images/" + profilePicKey; // Updating userInfo with new profile pic address
                    const [newToken, error] = generateJWTToken(userInfo);
                    if(error){
                        showError(error, resp);
                        return;
                    }

                    const responseData = {state: "success", message: "Profile picture updated successfully."};
                    const responseHeaders = {"Set-Cookie": `token=${newToken}; path=/; sameSite=lax; domain=.snapptalk.io`};
                    sendResponse(responseData, responseHeaders, 200, resp);

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

export async function deleteUserAccount(req: Request, resp: Response) {
    const { userInfo } = req;

    const [ usernameUpdateResult, error ] = await updateUsername(userInfo._id, "Deleted Account");
    if(error){
        showError(error, resp);
        return;
    }

    const [ profilePicUpdateResult, err ] = await updateProfilePicAddress(userInfo._id, "deleted_account.png");
    if(err){
        showError(err, resp);
        return;
    }

    const [ statusResult, Error] = await setAccountDeleted(userInfo._id);
    if(Error){
        showError(Error, resp);
        return;
    }

    const [revokeResult, revokeError] = await revokeUserToken(req.cookies.token);
    if(revokeError){
        showError(revokeError, resp);
        return;
    }

    resp.redirect("/login");
};
