import express from "express";
import * as accountController  from "../controllers/user/account.controller";
import { check } from 'express-validator';
import { checkThereIsAnyError } from "../middlewares/errors";
const router = express.Router();

//TODO: validate paramters in this route
router.get("/info", accountController.showUserInfo);
router.put("/info", [
    check(["username", "email"], {state: "failed", message: "Parameters are invalid or missing.", type: "input_error"}).isString().notEmpty(),
    check("username", {state: "failed", message: "username must have at least 4 and maximum 24 character", type: "input_error"}).isLength({min: 4, max: 24}),
    check("email", {state: "failed", message: "Invalid email address", type: "input_error"}).isEmail(),
    checkThereIsAnyError
], accountController.updateUserInfo);

export default router;