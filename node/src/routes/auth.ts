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
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/).withMessage("Password is weak. It must contain at least one uppercase letter, one lowercase letter, one digit, and one special character."),
    checkThereIsAnyError
], handleAuth);

export default router;