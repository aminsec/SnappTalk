import { User } from "../models/users.model";
import { ErrorResponse } from "../types/response.types";
import { ProtectedUserInfo, RawUserInfo } from "../types/user.types";
import { whiteListUserInfo } from "../utils/operations";

export async function searchMemberByUsername(username: string): Promise<[ProtectedUserInfo[] | null, ErrorResponse | null]> {
    try {
        const foundMembers: RawUserInfo[] = await User.find({ 
            username: { $regex: `.*${username}.*`, $options: "i" },
            deleted_account: false
        }).lean();
        const protectedMembers: ProtectedUserInfo[] = foundMembers.map((member: RawUserInfo) =>  whiteListUserInfo(member));
        return [protectedMembers, null];

    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};