const { getUsersCollection } = require("../models/users.model");
const { makeBcryptHash, checkBcrypt } = require("../utils/operations");
const { checkEmailIsValid } = require("../utils/validate");

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
        const user = await usersCollection.findOne({email: email});
        if(user){
            const isPasswordCorrect = await checkBcrypt(password, user.password)
            if(isPasswordCorrect === true){
                return [true, null];
            }else{
                return [false, null];
            }
        }else{
           return [false, null];
        }
    } catch (error) {
        console.log(error);
        const err = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

async function getUserInfoByEmail(email) {
    try {
        const usersCollection = await getUsersCollection();
        const user = await usersCollection.findOne({email: email});
        
        //White listing user data
        const userData = {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            role: user.role,
            profilePic: user.profilePic,
            joinedAt: user.joinedAt
        };

        return [userData, null]; 
        
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
            const hashedPassword = await makeBcryptHash(password);
            const usersCollection = await getUsersCollection();
            const userInfo = {
                email: email,
                password: hashedPassword,
                username: Date.now().toString(),
                profilePic: '/statics/images/default.png',
                role: "user",
                joinedAt: Date.now().toString()
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
    checkUserExistsByEmail,
    checkCredentials,
    getUserInfoByEmail,
    createUser
};