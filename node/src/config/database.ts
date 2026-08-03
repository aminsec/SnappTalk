import mongoose from "mongoose";

const { DB_PASS, DB_USER, DB_IP, DB_PORT, DB_NAME } = process.env;
const uri = `mongodb://${DB_USER}:${DB_PASS}@${DB_IP}:${DB_PORT}/${DB_NAME}?authSource=admin`;

export async function connectToSnappTalkDB() {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(uri);
        console.log("connected to dbs");
    }
    return mongoose.connection;
}