const { connectToSnappTalkDB } = require('../config/database');

let usersCollection;

async function getUsersCollection() {
    try {
        const db = await connectToSnappTalkDB();
        if (!usersCollection) {
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