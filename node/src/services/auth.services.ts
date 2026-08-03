import { User } from "../models/users.model";
import { makeBcryptHash, checkBcrypt, whiteListUserInfo } from "../utils/operations";
import { checkEmailIsValid } from "../utils/validate";
import { ProtectedUserInfo, RawUserInfo, InsertUserInfo } from "../types/user.types";
import { ErrorResponse } from "../types/response.types";
import { DeadSession } from "../models/dead_sessions.model";

export async function checkUserExistsByEmail(email: string): Promise<[true | false | null, null |ErrorResponse]>  {
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

export async function checkCredentials(email: string, password: string): Promise<[true | false | null, null |ErrorResponse]> {
    try {
        const user: RawUserInfo | null = await User.findOne({email: email, deleted_account: false}).lean();
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
        const err:ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function getUserInfoByEmail(email: string): Promise<[ProtectedUserInfo | null,ErrorResponse | null]>{
    try {
        const user: RawUserInfo | null = await User.findOne({email: email}).lean();
        
        if(!user){
            const err: ErrorResponse = {message: "User not found", state: "failed", type: "not_found"};
            return [null, err];
        }

        //White listing user data
        const userData: ProtectedUserInfo = whiteListUserInfo(user);

        return [userData, null]; 
        
    } catch (error) {
        console.log(error);
        const err:ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function createUser(email: string, password: string): Promise<[ProtectedUserInfo | null,ErrorResponse | null]> {
    try {
        const [isEmaillCorrect, error] = await checkEmailIsValid(email);
        if(error){
            return [null, error];
        }

        if(isEmaillCorrect === true){
            const hashedPassword = await makeBcryptHash(password);
            const userInfoToInsert: InsertUserInfo = {
                email: email,
                password: hashedPassword,
                username: Date.now().toString(),
                profile_pic: '/statics/images/default.png',
                role: "user",
                joined_at: new Date(),
                bio: "", // Default bio is empty
                status: "online",
                deleted_account: false
            };

            const createdUser = await User.create(userInfoToInsert);

            if(createdUser){
                const userInfo: ProtectedUserInfo = { 
                    id: createdUser._id.toString(),
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

        }else{
            const error:ErrorResponse = {state: "failed", message: "Invalid email format", type: "input_error"};
            return [null, error];
        }

    } catch (error) {
        console.log(error);
        const err:ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function revokeToken(token: string):  Promise<[Boolean | null, ErrorResponse | null]> {
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