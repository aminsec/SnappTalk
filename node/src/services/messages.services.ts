import { ObjectId } from "mongodb";
import { getMessagesCollection } from "../models/messages.model";

export async function getMessageById(messageId: ObjectId) {
    const messagesCollection = await getMessagesCollection();
    const message = await messagesCollection.findOne({
        _id: messageId
    });

    return message;
};