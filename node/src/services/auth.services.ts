import { getUsersCollection } from "../models/users.model";
import { makeBcryptHash, checkBcrypt, whiteListUserInfo } from "../utils/operations";
import { checkEmailIsValid } from "../utils/validate";
import { ProtectedUserInfo, RawUserInfo, InsertUserInfo } from "../types/user.types";
import { Error } from "../types/response.types";

export async function checkUserExistsByEmail(email: string): Promise<[true | false | null, null | Error]>  {
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
        const err: Error = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function checkCredentials(email: string, password: string): Promise<[true | false | null, null | Error]> {
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
        const err: Error = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function getUserInfoByEmail(email: string): Promise<[ProtectedUserInfo | null, Error | null]>{
    try {
        const usersCollection = await getUsersCollection();
        const user: RawUserInfo = await usersCollection.findOne({email: email});
        
        //White listing user data
        const userData: ProtectedUserInfo = whiteListUserInfo(user);

        return [userData, null]; 
        
    } catch (error) {
        console.log(error);
        const err: Error = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function createUser(email: string, password: string): Promise<[ProtectedUserInfo | null, Error | null]> {
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
                profilePic: '/statics/images/default.png',
                role: "user",
                joinedAt: Date.now().toString()
            };

            const createdUserInfoResult = await usersCollection.insertOne(userInfoToInsert);

            if(createdUserInfoResult.acknowledged === true){
                const userInfo: ProtectedUserInfo = {...userInfoToInsert, id: createdUserInfoResult.insertedId.toString()};
                return [userInfo, null];

            }else{
                const error: Error = {state: "failed", message: "Couldn't create user", type: "system_error"};
                return [null, error];
            }

        }else{
            const error: Error = {state: "failed", message: "Invalid email format", type: "input_error"};
            return [null, error];
        }

    } catch (error) {
        console.log(error);
        const err: Error = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};