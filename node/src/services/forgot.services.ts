import { User } from "../models/users.model";
import { ErrorResponse } from "../types/response.types";

export async function insertForgotTokenByEmail(email: string, hashedToken: string): Promise<[true | false | null, null | ErrorResponse]> {
    try {
        const insert = await User.updateOne({email: email}, {
            $set: {
                forgot_password_token: hashedToken,
                forgot_password_token_expires_at: new Date(Date.now() + 30 * 60 * 1000) //30 min
            }
        });

        if(insert){
            return [true, null];
        }

        return [false, null];
        
    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};