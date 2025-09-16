import { MongoClient } from 'mongodb';
import { Db } from 'mongodb';

const { DB_PASS, DB_USER, DB_IP, DB_PORT } = process.env;
const uri = `mongodb://${DB_USER}:${DB_PASS}@${DB_IP}:${DB_PORT}`;

//Returning db connection once connected
let SnappTalkDB: Db; 

export async function connectToSnappTalkDB() {
    if(!SnappTalkDB){
        const client = new MongoClient(uri);
        await client.connect();
        SnappTalkDB = client.db("SnappTalk");
        console.log("connected to dbs");
        return SnappTalkDB;
    }else{
        return SnappTalkDB;
    }
};