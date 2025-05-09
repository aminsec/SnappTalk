const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth/auth.controller");
const { check } = require('express-validator');
const { checkThereIsAnyError } = require("../middlewares/errors");

router.post("/", [
    check("email", {state: "failed", message: "Invalid email address", type: "input_error"}).isEmail(),
    check("password", {state: "failed", messaeg: "Invalid password value", type: "input_error"}).isString().notEmpty(),
    checkThereIsAnyError
], authController.handleAuth);

module.exports = router;