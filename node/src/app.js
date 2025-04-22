const express = require("express");
const app = express();
const authRoutes = require("./routes/auth");
const bodyParser = require("body-parser");

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use(bodyParser.json({ limit: "50mb" })); // Increasing body size limit
app.use("/auth", authRoutes);


module.exports = app;