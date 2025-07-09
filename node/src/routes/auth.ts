import express from "express";
import { handleAuth } from "../controllers/auth/auth.controller";
import { check } from "express-validator";
import { checkThereIsAnyError } from "../middlewares/errors";
const router = express.Router();

router.post("/", [
    check("email").isEmail().withMessage("Invalid email address"),
    check("password")
    .isString().withMessage("Invalid password value")
    .notEmpty().withMessage("Password is required")
    .isLength({min: 6, max: 24}).withMessage("Password must have at least 6 characters and maximum 24 character"),
    checkThereIsAnyError
], handleAuth);

export default router;