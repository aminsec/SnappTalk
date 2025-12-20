import { connectToSnappTalkDB } from "./config/database";
import http from "http";
import app from "./app";
import { initSocket } from "./socket/init";

const PORT = Number(process.env.APP_PORT) || 2020;
const server = http.createServer(app);

try {
  //Connecting to database when starting app
  connectToSnappTalkDB();

  //Starting WebSocket
  initSocket(server);
  
} catch (error) {
  console.error("System error accoured while starting one of servers", error);
};

server.listen(PORT, () => {
  console.log(`SnappTalk app listening on port ${PORT}`);
});
