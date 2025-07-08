import express from "express";
import * as accountController  from "../controllers/user/account.controller";
import { check } from 'express-validator';
import { checkThereIsAnyError } from "../middlewares/errors";
const router = express.Router();

router.get("/info", accountController.showUserInfo);
router.put("/info", [
  check("username")
    .isString().withMessage("Username must be a string.")
    .notEmpty().withMessage("Username is required.")
    .isLength({ min: 4, max: 24 }).withMessage("Username must be 4–24 characters.")
    .matches(/^[a-zA-Z0-9_]+$/).withMessage("Only a-z, 0-9, and '_' are allowed."),
  
  check("email")
    .isString().withMessage("Email must be a string.")
    .notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Invalid email address."),
  
  checkThereIsAnyError
], accountController.updateUserInfo);

export default router;