import { getUsersCollection } from "../models/users.model";
import { ErrorResponse } from "../types/response.types";
import { ProtectedUserInfo, RawUserInfo } from "../types/user.types";
import { whiteListUserInfo } from "../utils/operations";

export async function searchMemberByUsername(username: string): Promise<[ProtectedUserInfo[] | null, ErrorResponse | null]> {
    const usersCL = await getUsersCollection();
    try {
        const foundMembers = await usersCL.find({ 
            username: { $regex: `.*${username}.*`, $options: "i" },
            deleted_account: false
        }).toArray();
        const protectedMembers: ProtectedUserInfo[] = foundMembers.map((member: RawUserInfo) =>  whiteListUserInfo(member));
        return [protectedMembers, null];

    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};