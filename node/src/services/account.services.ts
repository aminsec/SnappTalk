import { Types } from "mongoose";
import { DeadSession } from "../models/dead_sessions.model";
import { User } from "../models/users.model";
import { ProtectedUserInfo, RawUserInfo } from "../types/user.types";
import { ErrorResponse } from "../types/response.types";
import { makeBcryptHash, whiteListUserInfo } from "../utils/operations";

export async function getRawUserInfo(userid: string): Promise<[RawUserInfo | null, ErrorResponse | null]> {
    try {
        const user: RawUserInfo | null = await User.findOne({_id: new Types.ObjectId(userid)}).lean();
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

export async function getUserInfoById(id: Types.ObjectId): Promise<[ProtectedUserInfo | null, ErrorResponse | null]> {
    try {
        const user: RawUserInfo | null = await User.findById(id).lean();

        if(user){
            //White listing user data
            const userData: ProtectedUserInfo = whiteListUserInfo(user);
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

export async function getUserInfoByUsername(username: string): Promise<[ProtectedUserInfo | null, ErrorResponse | null]> {
    try {
        const user: RawUserInfo | null = await User.findOne({username: username}).lean();
        if(user){
            //White listing user data
            const userData: ProtectedUserInfo = whiteListUserInfo(user);
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
        const userExist: RawUserInfo | null = await User.findOne({
            username: username
        }).lean();

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

export async function updateUsername(userid: Types.ObjectId, newUsername: string): Promise<[true | false | null, null | ErrorResponse]> {
    try {
        const result = await User.updateOne(
            {_id: userid},
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
        const result = await User.updateOne(
            {_id: new Types.ObjectId(userid)},
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
        const result = await User.updateOne(
            {_id: new Types.ObjectId(userid)},
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
        const result = await User.updateOne(
            {_id: new Types.ObjectId(userid)},
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

export async function updateProfilePicAddress(userid: Types.ObjectId, newProfilePicAddress: string): Promise<[true | false | null, null | ErrorResponse]> {
    try {
        const result = await User.updateOne(
            {_id: userid},
            {$set: {profile_pic: "/statics/images/" + newProfilePicAddress}}
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
        const revoked = await DeadSession.create({
            token: token,
            createdAt: new Date()
        });

        if(revoked){
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
        const contacts = await User.find({_id: {$ne: new Types.ObjectId(userid)}}).lean();
        return [contacts, null];
    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function setUserStatus(userId: Types.ObjectId, status: string): Promise<[Boolean | null, null | ErrorResponse]> {
    try {
        await User.updateOne({
            _id: userId
        }, {
            $set: {
                status: status
            }
        });

        return [true, null];
    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function setAccountDeleted(userId: Types.ObjectId): Promise<[Boolean | null, null | ErrorResponse]> {
    try {
        await User.updateOne({
            _id: userId
        }, {
            $set: {
                deleted_account: true
            }
        });

        return [ true, null];
    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};