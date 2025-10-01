import { ObjectId } from "mongodb";
import { ProtectedUserInfo, RawUserInfo } from "../types/user.types";
import { ErrorResponse } from "../types/response.types";
import { getConversationsCollection } from "../models/conversatations.model";

export async function getUserContacts(userid: string) { //TODO: add response type return to this function
    try {
        const conversationsCollection  = await getConversationsCollection();
        const contacts = await conversationsCollection.find({members: {$in: [userid]}}).toArray();
        return [contacts, null];
    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
}