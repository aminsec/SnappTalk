import { Conversation } from "../types/conversation.types";
import { ErrorResponse } from "../types/response.types";
import { getConversationsCollection } from "../models/conversatations.model";
import { ProtectedUserInfo } from "../types/user.types";
import { getUserInfoById } from "./info.services";
import { ObjectId } from "mongodb";
import { whiteListConversations } from "../utils/operations";
import { getMessageById } from "./messages.services";

export async function getUserConversations(userInfo: ProtectedUserInfo): Promise<[Conversation[] | null, ErrorResponse | null]> {
    try {
        const conversationsCollection  = await getConversationsCollection();
        const conversations: Conversation[] = await conversationsCollection.find(
            {members: 
                {$in: [new ObjectId(userInfo.id)]}
            }
        ).toArray();

        //Attaching contact userinfo for pv types of conversations
        for(let index in conversations){
            var contactId = (conversations[index].members[0]).toString() !== userInfo.id ? conversations[index].members[0] : conversations[index].members[1];
            if(conversations[index].type === "pv" && conversations[index].members){    
                 //Extracting contact userid by checking !userid
                const [contactUserInfo, error] = await getUserInfoById(contactId);
                if(error){
                    throw new Error();
                }

                conversations[index].contact_info = contactUserInfo;
            }

            //Attaching last messsage to contact
            const lastMessageId = conversations[index].last_message_id;
            const lastMessage = await getMessageById(lastMessageId);
            const [senderOfLastMessage, _] = await getUserInfoById(lastMessage.sender);

            conversations[index].last_message = {
                content: lastMessage.content,
                type: lastMessage.type,
                sender: senderOfLastMessage?.username,
                when: lastMessage.created_at,
                seen: conversations[index].type == "group" && lastMessage.seen_by.length > 0 ? true : contactId in lastMessage.seen_by ? true : false
            };
        }

        const validConversations: Conversation[] = whiteListConversations(conversations);
        return [validConversations, null];

    } catch (error) {
        console.log(error);
        const err: ErrorResponse = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};