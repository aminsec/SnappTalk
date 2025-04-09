const { MongoClient } = require("mongodb");
const db_url = "mongodb://172.17.0.3:27017";
const db_client = new MongoClient(db_url);

async function connectToDB() {
    try {
        await db_client.connect();
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

async function login(req, resp) {
    await connectToDB();
};

module.exports = {
    login,
}