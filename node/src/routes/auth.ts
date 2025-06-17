import express from "express";
import { handleAuth } from "../controllers/auth/auth.controller";
import { check } from "express-validator";
import { checkThereIsAnyError } from "../middlewares/errors";
const router = express.Router();

//TODO: add length checking here
router.post("/", [
    check("email", {state: "failed", message: "Invalid email address", type: "input_error"}).isEmail(),
    check("password", {state: "failed", messaeg: "Invalid password value", type: "input_error"}).isString().notEmpty(),
    check("password", {state: "failed", message: "Password must have at least 6 characters and maximum 24 character", type: "input_error"}).isLength({min: 6, max: 24}),
    checkThereIsAnyError
], handleAuth);

export default router;