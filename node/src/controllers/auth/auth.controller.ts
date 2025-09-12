import { Request, Response } from "express";
import { checkUserExistsByEmail, checkCredentials, getUserInfoByEmail, createUser } from "../../services/auth.services";
import { showError, sendResponse, generateJWTToken } from "../../utils/operations";
import { ProtectedUserInfo } from "../../types/user.types";
import {ErrorResponse } from "../../types/response.types";

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

            if(userInfo !== null){
                //Signing token
                const [token, err] = generateJWTToken(userInfo);
                if(err){
                    showError(err, resp);
                    return;
                }

                const responseData = {state: "success", message: "Login was successful"};
                const responseHeaders = {"Set-Cookie": `token=${token}; path=/;`};
                sendResponse(responseData, responseHeaders, 200,resp);
            }

        }else{
            const error:ErrorResponse = {state: "failed", message: "Invalid username or password", type: "creds_error"};
            showError(error, resp);
            return;
        }
        
    }else{
        const [createUserResult, error]:[ProtectedUserInfo | null,ErrorResponse | null] = await createUser(email, password);
        if(error){
            showError(error, resp);
            return;
        }

        //Assigning token If user was created successfully
        if(createUserResult){
            //There is no need to whitelist created userinfo. It's safe
            const [token, err] = generateJWTToken(createUserResult);
            if(err){
                showError(err, resp);
                return;
            }

            const responseData = {state: "success", message: "Registration was successful", step_2: true};
            const responseHeaders = {"Set-Cookie": `token=${token}; path=/;`};
            sendResponse(responseData, responseHeaders, 200, resp);
        }
    }
};