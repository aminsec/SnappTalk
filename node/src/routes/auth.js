const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth/auth.controller");

router.post("/", authController.handleAuth);

module.exports = router;