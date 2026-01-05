import express from "express";
import { handleAuth } from "../../controllers/auth/auth.controller";
import { check } from "express-validator";
import { checkThereIsAnyError } from "../../middlewares/errors";
import validateJWT from "../../middlewares/jwt";
import { handleLogout } from "../../controllers/auth/logout.controller";
import { globalReg } from "../../utils/regex";
const router = express.Router();

router.post("/", [
    check("email").isEmail().withMessage("Invalid email address"),
    check("password")
    .isString().withMessage("Invalid password value")
    .notEmpty().withMessage("Password is required")
    .matches(globalReg.password).withMessage("Incorrect or weak password"),
    checkThereIsAnyError
], handleAuth);

router.post("/logout", handleLogout);

export default router;