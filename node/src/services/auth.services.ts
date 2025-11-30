import { getUsersCollection } from "../models/users.model";
import { makeBcryptHash, checkBcrypt, whiteListUserInfo } from "../utils/operations";
import { checkEmailIsValid } from "../utils/validate";
import { ProtectedUserInfo, RawUserInfo, InsertUserInfo } from "../types/user.types";
import { ErrorResponse } from "../types/response.types";
import { getDeadSessionsCollection } from "../models/dead_sessions.model";

export async function checkUserExistsByEmail(email: string): Promise<[true | false | null, null |ErrorResponse]>  {
    try {
        const usersCollection  = await getUsersCollection();
        const user: RawUserInfo = await usersCollection.findOne({email: email});
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
        const usersCollection  = await getUsersCollection();
        const user: RawUserInfo = await usersCollection.findOne({email: email});
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
        const usersCollection = await getUsersCollection();
        const user: RawUserInfo = await usersCollection.findOne({email: email});
        
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
            const usersCollection = await getUsersCollection();
            const userInfoToInsert: InsertUserInfo = {
                email: email,
                password: hashedPassword,
                username: Date.now().toString(),
                profile_pic: '/statics/images/default.png',
                role: "user",
                joined_at: Date.now().toString(),
                bio: "" // Default bio is empty
            };

            const createdUserInfoResult = await usersCollection.insertOne(userInfoToInsert);

            if(createdUserInfoResult.acknowledged === true){
                const userInfo: ProtectedUserInfo = { 
                    id: createdUserInfoResult.insertedId.toString(),
                    email: userInfoToInsert.email,
                    username: userInfoToInsert.username,
                    profile_pic: userInfoToInsert.profile_pic,
                    role: userInfoToInsert.role,
                    joined_at: userInfoToInsert.joined_at,
                    bio: userInfoToInsert.bio
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
        const dead_sessionsCL = await getDeadSessionsCollection();
        const insertedToken = await dead_sessionsCL.insertOne({
            token: token
        });
    
        if(insertedToken.acknowledged === true){
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