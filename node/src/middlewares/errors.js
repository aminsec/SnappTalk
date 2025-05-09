const { showError } = require("../utils/operations");
const { validationResult } = require('express-validator');

async function checkThereIsAnyError(req, resp, next) {
    //Checking if there is any error from middlewares
    const  errors  = validationResult(req); // This takes this -> req["express-validator#contexts"][1]["message"]

    if (!errors.isEmpty()){
        const error = errors.array()[0].msg;
        showError(error, resp);
        return;

    }else{
        next();
    }
};

module.exports = {
    checkThereIsAnyError,
};