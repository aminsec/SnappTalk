import express from "express";
import { handleAuth } from "../controllers/auth/auth.controller";
import { check } from "express-validator";
import { checkThereIsAnyError } from "../middlewares/errors";
const router = express.Router();

//TODO: add length checking here
router.post("/", [
    check("email", {state: "failed", message: "Invalid email address", type: "input_error"}).isEmail(),
    check("password", {state: "failed", messaeg: "Invalid password value", type: "input_error"}).isString().notEmpty(),
    checkThereIsAnyError
], handleAuth);

export default router;