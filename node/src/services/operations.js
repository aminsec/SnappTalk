const { getUsersCollection } = require("../models/users.model");

async function getUserInfoByEmail(email) {
    try {
        const usersCollection = await getUsersCollection();
        const user = await usersCollection.findOne({email: email});
        return [user, null]; 
        
    } catch (error) {
        console.log(error);
        const err = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
}

module.exports = {
    getUserInfoByEmail,
}