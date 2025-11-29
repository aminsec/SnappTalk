import { Conversation } from "../types/conversation.types";
import { ErrorResponse } from "../types/response.types";
import { getConversationsCollection } from "../models/conversatations.model";
import { ProtectedUserInfo } from "../types/user.types";
import { getUserInfoById } from "./info.services";
import { ObjectId } from "mongodb";
import { whiteListContacts } from "../utils/operations";
import { getMessageById } from "./messages.services";

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
            var contactId = (contacts[index].members[0]).toString() !== userInfo.id ? contacts[index].members[0] : contacts[index].members[1];
            if(contacts[index].type === "pv" && contacts[index].members){    
                 //Extracting contact userid by checking !userid
                const [contactUserInfo, error] = await getUserInfoById(contactId);
                if(error){
                    throw new Error();
                }

                contacts[index].contact_info = contactUserInfo;
            }

            //Attaching last messsage to contact
            const lastMessageId = contacts[index].last_message_id;
            const lastMessage = await getMessageById(lastMessageId);
            const [senderOfLastMessage, _] = await getUserInfoById(lastMessage.sender);

            contacts[index].last_message = {
                content: lastMessage.content,
                type: lastMessage.type,
                sender: senderOfLastMessage?.username,
                when: lastMessage.created_at,
                seen: contacts[index].type == "group" && lastMessage.seen_by.length > 0 ? true : contactId in lastMessage.seen_by ? true : false
            };
        }

        const validContacts: Conversation[] = whiteListContacts(contacts);
        return [validContacts, null];

    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};