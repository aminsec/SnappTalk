const { getUsersCollection } = require("../models/users.model");

async function checkUserExistsByEmail(email) {
    try {
        const usersCollection  = await getUsersCollection();
        const user = await usersCollection.findOne({email: email});
        if(user){
            return [true, null];
        }else{
            return [false, null];
        }
        
    } catch (error) {
        console.log(error);
        const err = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

async function checkCredentials(email, password) {
    try {
        const usersCollection  = await getUsersCollection();
        const user = await usersCollection.findOne({email: email, password: password});
        if(user){
            return [true, null];
        }else{
           return [false, null];
        }

    } catch (error) {
        console.log(error);
        const err = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

module.exports = {
    checkUserExistsByEmail,
    checkCredentials,
}