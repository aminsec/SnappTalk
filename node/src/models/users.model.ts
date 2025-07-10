import { connectToSnappTalkDB } from '../config/database';

let usersCollection: any;
let deadSessionsCollection: any;

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

export async function getDeadSessionsCollection() {
    try {
        if (!deadSessionsCollection) {
            const db = await connectToSnappTalkDB();
            const connection = db.collection('dead_sessions');
            deadSessionsCollection = connection;
        }

        return deadSessionsCollection;
    } catch (error) {
        console.error("Error connecting to users collection:", error);
    }
};