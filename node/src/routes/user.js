const express = require("express");
const router = express.Router();
const accountController = require("../controllers/user/account.controller");
const { check } = require('express-validator');
const { checkThereIsAnyError } = require("../middlewares/errors");

//TODO: validate paramters in this route
router.get("/info", accountController.showUserInfo);
router.put("/info", accountController.updateUserInfo);

module.exports = router;