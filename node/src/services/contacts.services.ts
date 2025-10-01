import { ObjectId } from "mongodb";
import { ProtectedUserInfo, RawUserInfo } from "../types/user.types";
import { ErrorResponse } from "../types/response.types";
import { getConversationsCollection } from "../models/conversatations.model";

export async function getUserContacts(userid: string) {
    try {
        const usersCollection  = await getConversationsCollection();
        const contacts = await usersCollection.find({_id: {$ne: new ObjectId(userid)}}).toArray();
        return [contacts, null];
    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
}