import { PROTECTED_USER_INFO_FIELDS_TO_SELECT } from "../constants/user";
import { User } from "../models/users.model";
import { ErrorResponse } from "../types/response.types";
import { ProtectedUserInfo } from "../types/user.types";

export async function insertForgotTokenByEmail(email: string, hashedToken: string): Promise<[true | false | null, null | ErrorResponse]> {
    try {
        const now = Date.now();
        const cooldown = now - 30 * 60 * 1000;

        const result = await User.updateOne(
            {
                email: email,
                $or: [
                    {forgot_password_token_requested_at: {
                        $lt: cooldown
                    }},
                    {forgot_password_token_requested_at: {
                        $exists: false //For docs that does not have this field 
                    }}
                ]
            },
            {
                $set: {
                    forgot_password_token: hashedToken,
                    forgot_password_token_expires_at: new Date(now + 30 * 60 * 1000),
                    forgot_password_token_requested_at: new Date(now)
                }
            }
        );

        if (result.matchedCount === 1) {
            return [true, null];
        }

        return [false, null];

    } catch (error) {
        console.error(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};

export async function checkForgotTokenAndRevoke(token:string): Promise<[ProtectedUserInfo | null, null | ErrorResponse]> {
    try {
        const result = await User.findOneAndUpdate({
            forgot_password_token: token,
            forgot_password_token_expires_at: {$gte: new Date()}
        }, {
            $set: {
                forgot_password_token: null
            }
        }).select(PROTECTED_USER_INFO_FIELDS_TO_SELECT);

        return [result, null];
    } catch (error) {
        console.error(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
}