import { connectToSnappTalkDB } from '../config/database';

let conversationCollection: any;

export async function getConversationsCollection() {
    try {
        if (!conversationCollection) {
            const db = await connectToSnappTalkDB();
            const connection = db.collection('conversations');
            conversationCollection = connection;
        }

        return conversationCollection;
    } catch (error) {
        console.error("Error connecting to conversations collection:", error);
    }
};