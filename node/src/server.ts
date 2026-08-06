import { connectToSnappTalkDB } from "./config/database";
import { initSocket } from "./config/init.websocket";
import { s3Client } from "./config/s3.minio";
import http from "http";
import app from "./app";

const PORT = Number(process.env.APP_PORT) || 2020;
const server = http.createServer(app);

async function start() {
  try {
    await connectToSnappTalkDB();
    initSocket(server);
    server.listen(PORT, () => console.log(`SnappTalk app listening on port ${PORT}`));
  } catch (error) {
    console.error("Failed to start:", error);
    process.exit(1);
  }
}
start();
