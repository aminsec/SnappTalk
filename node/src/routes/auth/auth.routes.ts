import express from "express";
import { handleLogin } from "../../controllers/auth/login.controller";
import { check } from "express-validator";
import { checkThereIsAnyError } from "../../middlewares/errors";
import { handleLogout } from "../../controllers/auth/logout.controller";
import { globalReg } from "../../utils/regex";
import { requestForgotPasswordLink, handleForgotPasswordToken } from "../../controllers/auth/forgot.controller";
import { handleSignup } from "../../controllers/auth/signup.controller";
const router = express.Router();

router.post("/login", [
    check("email")
    .isEmail()
    .notEmpty()
    .withMessage("Invalid email address"),
    
    check("password")
    .isString().withMessage("Invalid password value")
    .notEmpty().withMessage("Password is required")
    .matches(globalReg.password).withMessage("Incorrect or weak password"),
    checkThereIsAnyError
], handleLogin);

router.post("/signup", [
    check("email")
    .isEmail()
    .notEmpty()
    .withMessage("Invalid email address"),
    
    check("password")
    .isString().withMessage("Invalid password value")
    .notEmpty().withMessage("Password is required")
    .matches(globalReg.password).withMessage("Incorrect or weak password"),

    check("username")
    .isString().withMessage("Username must be a string.")
    .notEmpty().withMessage("Username is required.")
    .isLength({ min: 5, max: 24 }).withMessage("Username must be 5-24 characters.")
    .matches(globalReg.username).withMessage("Only a-z, 0-9, and '_' are allowed."),

    checkThereIsAnyError
], handleSignup);

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