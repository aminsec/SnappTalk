import { connectToSnappTalkDB } from "../config/database";

let deadSessionsCollection: any;

export async function getDeadSessionsCollection() {
  try {
    if (!deadSessionsCollection) {
      const db = await connectToSnappTalkDB();
      const connection = db.collection("dead_sessions");
      deadSessionsCollection = connection;
    }

    return deadSessionsCollection;
  } catch (error) {
    console.error("Error connecting to dead_sessions collection:", error);
  }
}
