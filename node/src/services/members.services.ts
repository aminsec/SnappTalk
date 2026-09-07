import { User } from "../models/users.model";
import { ErrorResponse } from "../types/response.types";
import { ProtectedUserInfo, RawUserInfo } from "../types/user.types";
import { PROTECTED_USER_INFO_FIELDS_TO_SELECT } from "../constants/user";

export async function searchMemberByUsername(username: string): Promise<[ProtectedUserInfo[] | null, ErrorResponse | null]> {
    try {
        const escapedUsername = username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); //escaping special characters in the username to prevent regex injection
        
        const foundMembers: RawUserInfo[] = await User.find({ 
            username: { $regex: escapedUsername, $options: "i" },
            deleted_account: false,
        }).select(PROTECTED_USER_INFO_FIELDS_TO_SELECT).lean();
        
        return [foundMembers, null];

    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};