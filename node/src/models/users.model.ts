import { connectToSnappTalkDB } from '../config/database';

let usersCollection: any;

export async function getUsersCollection() {
    try {
        if (!usersCollection) {
            const db = await connectToSnappTalkDB();
            const connection = db.collection('users');
            usersCollection = connection;
        }

        return usersCollection;
    } catch (error) {
        console.error("Error connecting to users collection:", error);
    }
};