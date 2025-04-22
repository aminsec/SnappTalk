const { connectToSnappTalkDB } = require("./config/database");
const http = require("http");
const websocket = require("ws");
const app = require("./app");
const PORT = process.env.APP_PORT || 2020;
const server = http.createServer(app);

// WebSocket Setup
try {
  connectToSnappTalkDB();
  const wss = new websocket.Server({ server, path: "/chat" }); // Binds WS to HTTP
  wss.on("connection", (client) => {
    // handelWSC(client, wss);
    console.log("New client connected");
  });
} catch (error) {
  console.error("Couldn't start WS server", error);
}

server.listen(PORT, () => {
  console.log(`Sancity app and WS listening on port ${PORT}`);
});