import { connectToSnappTalkDB } from "./config/database";
import { initSocket } from "./config/init.websocket";
import { s3Client } from "./config/s3.minio";
import http from "http";
import app from "./app";

const PORT = Number(process.env.APP_PORT) || 2020;
const server = http.createServer(app);

try {
  s3Client; // Initialize S3 client
  
  // Connecting to database when starting app
  connectToSnappTalkDB();

  // Starting WebSocket
  initSocket(server);
  
} catch (error) {
  console.error("System error occurred while starting one of servers", error);
};

server.listen(PORT, () => {
  console.log(`SnappTalk app listening on port ${PORT}`);
});
