import express from "express";
import { handleAuth } from "../../controllers/auth/auth.controller";
import { check } from "express-validator";
import { checkThereIsAnyError } from "../../middlewares/errors";
import validateJWT from "../../middlewares/jwt";
import { handleLogout } from "../../controllers/auth/logout.controller";
const router = express.Router();

router.post("/", [
    check("email").isEmail().withMessage("Invalid email address"),
    check("password")
    .isString().withMessage("Invalid password value")
    .notEmpty().withMessage("Password is required")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/).withMessage("Incorrect or weak password"),
    checkThereIsAnyError
], handleAuth);

router.post("/logout", validateJWT, handleLogout);

export default router;