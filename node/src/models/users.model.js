const { connectToSnappTalkDB } = require('../config/database');

let usersCollection;

async function getUsersCollection() {
    try {
        if (!usersCollection) {
            const db = await connectToSnappTalkDB();
            const connection = await db.collection('users');
            usersCollection = connection;
        }

        return usersCollection;
    } catch (error) {
        console.error("Error connecting to users collection:", error);
    }
}

module.exports = {
    getUsersCollection,
};