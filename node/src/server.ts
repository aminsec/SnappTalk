import { connectToSnappTalkDB } from "./config/database";
import http from "http";
import WebSocket, { Server as WebSocketServer } from "ws";
import app from "./app";

const PORT = Number(process.env.APP_PORT) || 2020;
const server = http.createServer(app);

try {
  //Connecting to database when starting app
  connectToSnappTalkDB();

  // WebSocket Setup
  const wss = new WebSocketServer({ server, path: "/chat" }); // Binds WS to HTTP

  wss.on("connection", (client: WebSocket) => {
    // handelWSC(client, wss);
    console.log("New client connected");
  });
  
} catch (error) {
  console.error("Couldn't start WS server", error);
};

server.listen(PORT, () => {
  console.log(`Sancity app and WS listening on port ${PORT}`);
});
