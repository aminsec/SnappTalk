const bcrypt = require('bcrypt');
const saltRounds = 10;

//Function to send normall messages
function sendResponse(data, headers = {}, code = 200, resp){
    headers["Content-Type"] = "application/json"; //Setting content-type to json
    resp.statusCode = code; //Setting status code
    resp.header(headers);
    resp.send(JSON.stringify(data)); 
    resp.end();
};

function showError(error, resp){
    sendResponse(error, {}, (
        error.type === "not_found" ? 404 : 
        error.type === "system_error" ? 500 : 
        error.type === "creds_error" ? 401 : 
        error.type === "access_denied" ? 403 : 
        error.type === "input_error" ? 400 : 
        null), resp);

    if(error.type === "system_error"){
        console.log(error.message);
    }
    return;
};

//Generates salt automatically
async function makeBcryptHash(value) {
    return await bcrypt.hash(value, saltRounds);
};

async function checkBcrypt(plainText, hash) {
    return await bcrypt.compare(plainText, hash);
};

module.exports = {
    makeBcryptHash,
    checkBcrypt,
    sendResponse,
    showError
};