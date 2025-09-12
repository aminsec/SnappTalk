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
    .isLength({ min: 5, max: 24 }).withMessage("Username must be 4–24 characters.")
    .matches(/^[a-zA-Z0-9_]+$/).withMessage("Only a-z, 0-9, and '_' are allowed."),
  
  check("email")
    .isString().withMessage("Email must be a string.")
    .notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Invalid email address."),
  
  check("bio")
  .isString().withMessage("Bio must be a string.")
  .isLength({ max: 160 }).withMessage("Bio must be at most 160 characters long."),

  checkThereIsAnyError
], accountController.updateUserInfo);

router.put("/info/password", [
  check("old_password")
  .isString().withMessage("Old password must be a string.")
  .notEmpty().withMessage("Old password is required."),

  check("new_password")
  .isString().withMessage("New password must be a string.")
  .notEmpty().withMessage("New password is required.")
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/).withMessage("Password is weak. It must contain at least one uppercase letter, one lowercase letter, one digit, and one special character.")
  .isLength({ min: 6, max: 24 }).withMessage("New password must be 6–24 characters."),

  checkThereIsAnyError
], accountController.updateUserPassword);

router.post("/info/profile", [
  check("content")
  .notEmpty().withMessage("Content parameter is required")
  .isString().withMessage("Content must be a string"),

  checkThereIsAnyError
], accountController.updateUserProfile);

export default router;