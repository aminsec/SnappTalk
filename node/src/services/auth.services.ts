import { User } from "../models/users.model";
import { ProtectedUserInfo, RawUserInfo, InsertUserInfo } from "../types/user.types";
import { ErrorResponse } from "../types/response.types";
import { DeadSession } from "../models/dead_sessions.model";
import { PROTECTED_USER_INFO_FIELDS_TO_SELECT } from "../constants/user";

export async function checkUserExistsByEmail(email: string): Promise<[boolean, null] | [null, ErrorResponse]>  {
    try {
        const user: RawUserInfo | null = await User.findOne({email: email}).lean();
        if(user){
            return [true, null];
        }else{
            return [false, null];
        }

    } catch (error) {
        console.log(error);
        const err:ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function checkCredentials(email: string, password: string): Promise<[false, null, null] | [true, RawUserInfo, null] | [null, null, ErrorResponse]> {
    try {
        const user: RawUserInfo | null = await User.findOne({email: email, verified: true, deleted_account: false}).lean();

        if (!user) {
            return [false, null, null];
        }

        const isPasswordValid = await Bun.password.verify(password, user.password);

        if (!isPasswordValid) {
            return [false, null, null];
        }

        return [true, user, null];

    } catch (error) {
        console.log(error);
        const err:ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, null, err];
    }
};

export async function getUserInfoByEmail(email: string): Promise<[ProtectedUserInfo, null] | [null, ErrorResponse]>{
    try {
        const user: ProtectedUserInfo | null = await User.findOne({email: email}).select(PROTECTED_USER_INFO_FIELDS_TO_SELECT).lean();

        if(!user){
            const err: ErrorResponse = {message: "User not found", state: "failed", type: "not_found"};
            return [null, err];
        }

        return [user, null];

    } catch (error) {
        console.log(error);
        const err:ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function getRawUserInfoByEmail(email: string): Promise<[RawUserInfo, null] | [null, ErrorResponse]>{
    try {
        const user: RawUserInfo | null = await User.findOne({email: email}).lean();

        if(!user){
            const err: ErrorResponse = {message: "User not found", state: "failed", type: "not_found"};
            return [null, err];
        }

        return [user, null];

    } catch (error) {
        console.log(error);
        const err:ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function createUser(email: string, password: string, emailVerifyToken: string): Promise<[ProtectedUserInfo, null] | [null, ErrorResponse]> {
    try {
        const hashedPassword = await Bun.password.hash(password)
        const now = Date.now();

        const userInfoToInsert: InsertUserInfo = {
            email: email,
            password: hashedPassword,
            username: email.split("@")[0],
            profile_pic: '/statics/images/default.png',
            role: "user",
            joined_at: new Date(),
            bio: "",
            status: "online",
            deleted_account: false,
            verified: false,
            email_verify_token: emailVerifyToken,
            email_verify_token_expires_at: new Date(now + 30 * 60 * 1000),
            email_verify_token_requested_at: new Date(now)
        };

        const createdUser = await User.create(userInfoToInsert);

        if(createdUser){
            const userInfo: ProtectedUserInfo = {
                _id: createdUser._id,
                email: createdUser.email,
                username: createdUser.username,
                profile_pic: createdUser.profile_pic,
                role: createdUser.role,
                joined_at: createdUser.joined_at,
                bio: createdUser.bio,
                status: createdUser.status
            };

            return [userInfo, null];

        }else{
            const error:ErrorResponse = {state: "failed", message: "Couldn't create user", type: "system_error"};
            return [null, error];
        }

    } catch (error) {
        console.log(error);
        const err:ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function verifyEmailToken(token: string): Promise<[ProtectedUserInfo, null] | [null, ErrorResponse]> {
    try {
        const user = await User.findOneAndUpdate(
            {
                email_verify_token: token, 
                email_verify_token_expires_at: { $gt: new Date() }
            },
            {
                $set: { verified: true, email_verify_token: null, email_verify_token_expires_at: null, email_verify_token_requested_at: null }
            },
            { returnDocument: "after" }

        ).select(PROTECTED_USER_INFO_FIELDS_TO_SELECT).lean();

        if (!user) {
            const error: ErrorResponse = { message: "Invalid or expired token", state: "failed", type: "input_error" };
            return [null, error];
        }

        const userInfo: ProtectedUserInfo = {
            _id: user._id,
            email: user.email,
            username: user.username,
            profile_pic: user.profile_pic,
            role: user.role,
            joined_at: user.joined_at,
            bio: user.bio,
            status: user.status
        };

        return [userInfo, null];

    } catch (error) {
        console.log(error);
        const err: ErrorResponse = { message: "A system error occurred", state: "failed", type: "system_error" };
        return [null, err];
    }
};

export async function resendEmailVerification(email: string, newHashedToken: string): Promise<[boolean, null] | [null, ErrorResponse]> {
    try {
        const user = await User.updateOne(
            {
                email: email,
                verified: false,
                email_verify_token_requested_at: { $lt: new Date(Date.now() - 15 * 60 * 1000) } //Allowing resend every 15 minutes
            },
            {
                $set: {
                    email_verify_token: newHashedToken,
                    email_verify_token_expires_at: new Date(Date.now() + 30 * 60 * 1000),
                    email_verify_token_requested_at: new Date()
                }
            }
        ).lean();

        if (user.modifiedCount === 0) {
            return [false, null];
        }else{
            return [true, null];
        }
        
    } catch (error) {
        console.log(error);
        const err: ErrorResponse = { message: "A system error occurred", state: "failed", type: "system_error" };
        return [null, err];
    }
}

export async function revokeToken(token: string): Promise<[boolean, null] | [null, ErrorResponse]> {
    try {
        const insertedToken = await DeadSession.create({
            token: token
        });

        if(insertedToken){
            return [true, null];

        }else{
            const err: ErrorResponse = {message: "Couldn't insert token", state: "failed", type: "system_error"};
            return [null, err];
        }

    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};