const { MongoClient } = require('mongodb');
const { DB_PASS } = process.env;
const uri = `mongodb://topAdmin:${DB_PASS}@172.17.0.3:27017`;

//Returning db connection once connected
let SnappTalkDB; 

async function connectToSnappTalkDB() {
    if(!SnappTalkDB){
        const client = new MongoClient(uri);
        await client.connect();
        SnappTalkDB = client.db("SnappTalk");
        console.log("connected to dbs");
        return SnappTalkDB;
    }else{
        return SnappTalkDB;
    }
}

module.exports = {
    connectToSnappTalkDB
}
