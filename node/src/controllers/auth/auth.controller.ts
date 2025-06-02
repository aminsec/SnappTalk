import { Request, Response } from "express";
import { checkUserExistsByEmail, checkCredentials, getUserInfoByEmail, createUser } from "../../services/auth.services";
import { showError, sendResponse } from "../../utils/operations";
import { Token, ProtectedUserInfo } from "../../types/user.types";
import { Error } from "../../types/response.types";
import * as jwt from 'jsonwebtoken';

export async function handleAuth(req: Request, resp: Response): Promise<void> {
    const { email, password } = req.body;

    //Checking user if exist by email
    const [result, error] =  await checkUserExistsByEmail(email);
    if(error){
        showError(error, resp);
        return;
    }

    //If user exists, then check credentials
    if(result === true){
        const [credsCheckResult, error] = await checkCredentials(email, password);
        if(error){
            showError(error, resp);
            return;
        }

        //Assigning token if credentials was correct
        if(credsCheckResult === true){
            const [userInfo, error] = await getUserInfoByEmail(email);
            if(error){
                showError(error, resp);
                return;
            }

            //Extracting user info to include in token
            if(userInfo !== null){
                const tokenData: Token = {
                    id: userInfo.id,
                    email: userInfo.email,
                    username: userInfo.username,
                    profilePic: userInfo.profilePic,
                    role: userInfo.role,
                }

                //Signing token
                const token = jwt.sign(tokenData, String(process.env.JWT_SECRET_KEY), {expiresIn: "1h"});
                const responseData = {state: "success", message: "Login was successful"};
                const responseHeaders = {"Set-Cookie": `token=${token}; path=/;`};
                sendResponse(responseData, responseHeaders, 200,resp);
            }

        }else{
            const error: Error = {state: "failed", message: "Invalid username or password", type: "creds_error"};
            showError(error, resp);
            return;
        }
        
    }else{
        const [createUserResult, error] = await createUser(email, password);
        if(error){
            showError(error, resp);
            return;
        }

        //If user was created successfully, then assign token
        if(createUserResult){
            //Extracting user info to include in token
            const userInfoToSign: Token = {
                id: createUserResult.id,
                email: createUserResult.email,
                username: createUserResult.username,
                profilePic: createUserResult.profilePic,
                role: createUserResult.role
            }

            const token = jwt.sign(userInfoToSign, String(process.env.JWT_SECRET_KEY), {expiresIn: "1h"});
            const responseData = {state: "success", message: "Registration was successful", step_2: true};
            const responseHeaders = {"Set-Cookie": `token=${token}; path=/;`};
            sendResponse(responseData, responseHeaders, 200, resp);
        }
    }
};