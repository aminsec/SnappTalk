const { checkUserExistsByEmail, checkCredentials, getUserInfoByEmail, createUser } = require("../../services/auth.services");
const { showError, sendResponse } = require("../../utils/operations");
const jwt = require('jsonwebtoken');

async function handleAuth(req, resp) {
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
            const tokenData = {
                id: userInfo.id,
                email: userInfo.email,
                username: userInfo.username,
                profilePic: userInfo.profilePic,
                role: userInfo.role,
            }
            
            //Signing token
            const token = jwt.sign(tokenData, process.env.JWT_SECRET_KEY, {expiresIn: "1h"});
            const responseData = {state: "success", message: "Login was successful"};
            const responseHeaders = {"Set-Cookie": `token=${token}; path=/;`};
            sendResponse(responseData, responseHeaders, 200,resp);

        }else{
            const error = {state: "failed", message: "Invalid username or password", type: "creds_error"};
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
            const userInfoToSign = {
                id: createUserResult._id,
                email: createUserResult.email,
                username: createUserResult.username,
                profilePic: createUserResult.profilePic,
                role: createUserResult.role
            }

            const token = jwt.sign(userInfoToSign, process.env.JWT_SECRET_KEY, {expiresIn: "1h"});
            const responseData = {state: "success", message: "Registration was successful", step_2: true};
            const responseHeaders = {"Set-Cookie": `token=${token}; path=/;`};
            sendResponse(responseData, responseHeaders, 200, resp);
        }
    }
};

module.exports = {
    handleAuth,
};