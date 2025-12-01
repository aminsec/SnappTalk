import { connectToSnappTalkDB } from '../config/database';

let messagesCollection: any;

export async function getMessagesCollection() {
    try {
        if (!messagesCollection) {
            const db = await connectToSnappTalkDB();
            const connection = db.collection('messages');
            messagesCollection = connection;
        }

        return messagesCollection;
    } catch (error) {
        console.error("Error connecting to messages collection:", error);
    }
};