import { ObjectId } from "mongodb";
import { getUsersCollection } from "../models/users.model";
import { ProtectedUserInfo, RawUserInfo } from "../types/user.types";
import { Error } from "../types/response.types";

export async function getUserInfoById(id:string): Promise<[ProtectedUserInfo | null, Error | null]> {
    try {
        const usersCollection  = await getUsersCollection();
        const user: RawUserInfo = await usersCollection.findOne({_id: new ObjectId(id)});
        if(user){
            //White listing user data
            const userData: ProtectedUserInfo = {
                id: user._id.toString(),
                username: user.username,
                email: user.email,
                role: user.role,
                profilePic: user.profilePic,
                joinedAt: user.joinedAt
            };

            return [userData, null];

        }else{
            const err: Error = {message: "User not found", state: "failed", type: "not_found"};
            return [null, err];
        }

    } catch (error) {
        console.log(error);
        const err: Error = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};