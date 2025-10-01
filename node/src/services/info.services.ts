import { ObjectId } from "mongodb";
import { getDeadSessionsCollection } from "../models/dead_sessions.model";
import { getUsersCollection } from "../models/users.model";
import { ProtectedUserInfo, RawUserInfo } from "../types/user.types";
import { ErrorResponse } from "../types/response.types";
import { makeBcryptHash, whiteListUserInfo } from "../utils/operations";

export async function getRawUserInfo(userid: string): Promise<[RawUserInfo | null, ErrorResponse | null]> {
    try {
        const usersCollection  = await getUsersCollection();
        const user: RawUserInfo = await usersCollection.findOne({_id: new ObjectId(userid)});
        if(user){
            return [user, null];

        }else{
            const err: ErrorResponse = {message: "User not found", state: "failed", type: "not_found"};
            return [null, err];
        }

    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function getUserInfoById(id:string): Promise<[ProtectedUserInfo | null, ErrorResponse | null]> {
    try {
        const usersCollection  = await getUsersCollection();
        const user: RawUserInfo = await usersCollection.findOne({_id: new ObjectId(id)});
        if(user){
            //White listing user data
            const userData: ProtectedUserInfo = whiteListUserInfo(user)
            return [userData, null];

        }else{
            const err: ErrorResponse = {message: "User not found", state: "failed", type: "not_found"};
            return [null, err];
        }

    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function checkUserExistsByUsername(username: string): Promise<[true | false | null, null | ErrorResponse]> {
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
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function updateUsername(userid: string, newUsername: string): Promise<[true | false | null, null | ErrorResponse]> {
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
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function updateEmail(userid: string, newEmail: string): Promise<[true | false | null, null | ErrorResponse]> {
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
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function updatePassword(userid: string, newPassword: string): Promise<[true | false | null, null | ErrorResponse]> {
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
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function updateBio(userid: string, newBio: string): Promise<[true | false | null, null | ErrorResponse]> {
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
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function updateProfilePicAddress(userid: string, newProfilePicAddress: string): Promise<[true | false | null, null | ErrorResponse]> {
    try {
        const usersCollection  = await getUsersCollection();
        const result = await usersCollection.updateOne(
            {_id: new ObjectId(userid)},
            {$set: {profilePic: "/statics/images/" + newProfilePicAddress}}
        );

        if(result.acknowledged === true){
            return [true, null];
        }else{
            return [false, null];
        }

    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function revokeUserToken(token: string): Promise<[true | false | null, null | ErrorResponse]> {
    try {
        const dead_sessionsCL = await getDeadSessionsCollection();
        const revoked = await dead_sessionsCL.insertOne({
            token: token,
            createdAt: new Date()
        });

        if(revoked.acknowledged){
            return [true, null];
        }else{
            const err: ErrorResponse = {message: "Failed to revoke token", state: "failed", type: "system_error"};
            return [null, err];
        }

    } catch (error) {
        const err: ErrorResponse = {message: "Failed to revoke token", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function getUserContacts(userid: string) {
    try {
        const usersCollection  = await getUsersCollection();
        const contacts = await usersCollection.find({_id: {$ne: new ObjectId(userid)}}).toArray();
        return [contacts, null];
    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};