const express = require("express");
const app = express();
const authRoutes = require("./routes/auth");
const accountRoutes = require("./routes/user");
const validateJWT = require("./middlewares/jwt");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use(bodyParser.json({ limit: "50mb" })); // Increasing body size limit
app.use(cookieParser()); // Parsing cookies
app.use("/auth", authRoutes);
app.use("/user", validateJWT);
app.use("/user", accountRoutes);



module.exports = app;