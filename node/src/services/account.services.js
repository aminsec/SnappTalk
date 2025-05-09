const { ObjectId } = require("mongodb");
const { getUsersCollection } = require("../models/users.model");

async function getUserInfoById(id) {
    try {
        const usersCollection  = await getUsersCollection();
        const user = await usersCollection.findOne({_id: new ObjectId(id)});
        if(user){
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

        }else{
            const err = {message: "User not found", state: "failed", type: "not_found"};
            return [null, err];
        }

    } catch (error) {
        console.log(error);
        const err = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

module.exports = {
    getUserInfoById,
};