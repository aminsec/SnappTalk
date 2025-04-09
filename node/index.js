const express = require("express");
const app = express();
const port = 2020;
const authRoutes = require("./src/routes/auth");
const bodyParser = require("body-parser");

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use(bodyParser.json({ limit: "50mb" })); // Increasing body size limit
app.use("/auth", authRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

module.exports = app;