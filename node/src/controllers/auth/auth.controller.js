const { checkUserExistsByEmail, checkCredentials } = require("../../services/checks");
const { getUserInfoByEmail } = require("../../services/operations");
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

            //Removing unnessecry field 
            delete userInfo.password;
            delete userInfo._id;
            
            //Signing token
            const token = jwt.sign(userInfo, process.env.JWT_SECRET_KEY, {expiresIn: "1h"});
            const responseData = {status: "success", message: "Login was successful"};
            const responseHeaders = {"Set-Cookie": `token=${token}; path=/; httpOnly`};
            sendResponse(responseData, responseHeaders, 200,resp);

        }else{
            const error = {state: "failed", message: "Invalid username or password", type: "creds_error"};
            showError(error, resp);
            return;
        }
        
    }else{
        //TODO: Signin user 
    }
};

module.exports = {
    handleAuth,
};