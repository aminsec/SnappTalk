import express from "express";
import * as accountController  from "../controllers/user/account.controller";
import { check } from 'express-validator';
import { checkThereIsAnyError } from "../middlewares/errors";
const router = express.Router();

//TODO: validate paramters in this route
router.get("/info", accountController.showUserInfo);
router.put("/info", accountController.updateUserInfo);

export default router;