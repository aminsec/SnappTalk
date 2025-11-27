import { Conversation } from "../types/conversation.types";
import { ErrorResponse } from "../types/response.types";
import { getConversationsCollection } from "../models/conversatations.model";
import { ProtectedUserInfo } from "../types/user.types";
import { getUserInfoById } from "./info.services";
import { ObjectId } from "mongodb";
import { whiteListContacts } from "../utils/operations";

export async function getUserContacts(userInfo: ProtectedUserInfo): Promise<[Conversation[] | null, ErrorResponse | null]> {
    try {
        const conversationsCollection  = await getConversationsCollection();
        const contacts: Conversation[] = await conversationsCollection.find(
            {members: 
                {$in: [new ObjectId(userInfo.id)]}
            }
        ).toArray();

        //Attaching contact userinfo for pv types of conversations
        for(let index in contacts){
            if(contacts[index].type === "pv" && contacts[index].members){    
                const contactId = (contacts[index].members[0]).toString() !== userInfo.id ? contacts[index].members[0] : contacts[index].members[1]; //Extracting contact userid by checking !userid
                const [contactUserInfo, error] = await getUserInfoById(contactId);
                if(error){
                    throw new Error();
                }

                contacts[index].contact_info = contactUserInfo;
            }
        }

        const validContacts: Conversation[] = whiteListContacts(contacts);
        return [validContacts, null];

    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};