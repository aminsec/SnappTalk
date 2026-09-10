import express from "express";
import { handleAuth } from "../../controllers/auth/auth.controller";
import { check } from "express-validator";
import { checkThereIsAnyError } from "../../middlewares/errors";
import { handleLogout } from "../../controllers/auth/logout.controller";
import { globalReg } from "../../utils/regex";
import { requestForgotPasswordLink, handleForgotPasswordToken } from "../../controllers/auth/forgot.controller";
const router = express.Router();

router.post("/", [
    check("email")
    .isEmail()
    .notEmpty()
    .withMessage("Invalid email address"),
    
    check("password")
    .isString().withMessage("Invalid password value")
    .notEmpty().withMessage("Password is required")
    .matches(globalReg.password).withMessage("Incorrect or weak password"),
    checkThereIsAnyError
], handleAuth);

router.post("/forgot-password", [
    check("email")
    .isEmail()
    .notEmpty()
    .withMessage("Invalid email address"),
    checkThereIsAnyError
], requestForgotPasswordLink);

router.get("/forgot-password/:token", [
    check("token")
    .notEmpty()
    .withMessage("Invalid token"),
    checkThereIsAnyError
], handleForgotPasswordToken);

router.post("/logout", handleLogout);

export default router;