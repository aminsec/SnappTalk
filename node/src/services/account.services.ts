import { ObjectId } from "mongodb";
import { getDeadSessionsCollection, getUsersCollection } from "../models/users.model";
import { ProtectedUserInfo, RawUserInfo } from "../types/user.types";
import { Error } from "../types/response.types";
import { makeBcryptHash, whiteListUserInfo } from "../utils/operations";

export async function getRawUserInfo(userid: string): Promise<[RawUserInfo | null, Error | null]> {
    try {
        const usersCollection  = await getUsersCollection();
        const user: RawUserInfo = await usersCollection.findOne({_id: new ObjectId(userid)});
        if(user){
            return [user, null];

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

export async function getUserInfoById(id:string): Promise<[ProtectedUserInfo | null, Error | null]> {
    try {
        const usersCollection  = await getUsersCollection();
        const user: RawUserInfo = await usersCollection.findOne({_id: new ObjectId(id)});
        if(user){
            //White listing user data
            const userData: ProtectedUserInfo = whiteListUserInfo(user)
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

export async function checkUserExistsByUsername(username: string): Promise<[true | false | null, null | Error]> {
    try {
        const usersCollection  = await getUsersCollection();
        const userExist: RawUserInfo = await usersCollection.findOne({
            username: username
        });

        if(userExist){
            return [true, null];

        }else{
            return [false, null];
        }

    } catch (error) {
        console.log(error);
        const err: Error = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function updateUsername(userid: string, newUsername: string): Promise<[true | false | null, null | Error]> {
    try {
        const usersCollection  = await getUsersCollection();
        const result = await usersCollection.updateOne(
            {_id: new ObjectId(userid)},
            {$set: {username: newUsername}}
        );

        if(result.modifiedCount > 0){
            return [true, null];
        }else{
            return [false, null];
        }

    } catch (error) {
        console.log(error);
        const err: Error = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function updateEmail(userid: string, newEmail: string): Promise<[true | false | null, null | Error]> {
    try {
        const usersCollection  = await getUsersCollection();
        const result = await usersCollection.updateOne(
            {_id: new ObjectId(userid)},
            {$set: {email: newEmail}}
        );

        if(result.modifiedCount > 0){
            return [true, null];
        }else{
            return [false, null];
        }

    } catch (error) {
        console.log(error);
        const err: Error = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function updatePassword(userid: string, newPassword: string): Promise<[true | false | null, null | Error]> {
    try {
        const newPasswordHash = await makeBcryptHash(newPassword);
        const usersCollection  = await getUsersCollection();
        const result = await usersCollection.updateOne(
            {_id: new ObjectId(userid)},
            {$set: {password: newPasswordHash}}
        );

        if(result.modifiedCount > 0){
            return [true, null];
        }else{
            return [false, null];
        }

    } catch (error) {
        console.log(error);
        const err: Error = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function updateBio(userid: string, newBio: string): Promise<[true | false | null, null | Error]> {
    try {
        const usersCollection  = await getUsersCollection();
        const result = await usersCollection.updateOne(
            {_id: new ObjectId(userid)},
            {$set: {bio: newBio}}
        );

        if(result.acknowledged === true){
            return [true, null];
        }else{
            return [false, null];
        }

    } catch (error) {
        console.log(error);
        const err: Error = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function updateProfilePicAddress(userid: string, newProfilePicAddress: string): Promise<[true | false | null, null | Error]> {
    try {
        const usersCollection  = await getUsersCollection();
        const result = await usersCollection.updateOne(
            {_id: new ObjectId(userid)},
            {$set: {profilePic: newProfilePicAddress}}
        );

        if(result.acknowledged === true){
            return [true, null];
        }else{
            return [false, null];
        }

    } catch (error) {
        console.log(error);
        const err: Error = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function revokeUserToken(token: string): Promise<[true | false | null, null | Error]> {
    try {
        const dead_sessionsCL = await getDeadSessionsCollection();
        const revoked = await dead_sessionsCL.insertOne({
            token: token,
            createdAt: Date.now().toString()
        });

        if(revoked.acknowledged){
            return [true, null];
        }else{
            const err: Error = {message: "Failed to revoke token", state: "failed", type: "system_error"};
            return [null, err];
        }

    } catch (error) {
        const err: Error = {message: "Failed to revoke token", state: "failed", type: "system_error"};
        return [null, err];
    }
};
