const { getUsersCollection } = require("../models/users.model");
const { checkEmailIsValid } = require("../utils/validate");

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
};

async function createUser(email, password) {
    try {
        const [isEmaillCorrect, error] = await checkEmailIsValid(email);
        if(error){
            return [null, error];
        }

        if(isEmaillCorrect === true){
            const usersCollection = await getUsersCollection();
            const userInfo = {
                email: email,
                password: password.toString(),
                username: Date.now().toString(),
                profilePic: '/statics/images/default.png',
                role: "user"
            };

            const createdUserInfo = await usersCollection.insertOne(userInfo);

            if(createdUserInfo){
                userInfo._id = createdUserInfo.insertedId.toString();
                return [userInfo, null];

            }else{
                const error = {state: "failed", message: "Couldn't create user", type: "system_error"};
                return [null, error];
            }

        }else{
            const error = {state: "failed", message: "Invalid email format", type: "input_error"};
            return [null, error];
        }

    } catch (error) {
        console.log(error);
        const err = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

module.exports = {
    getUserInfoByEmail,
    createUser
};