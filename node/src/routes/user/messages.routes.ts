import express from "express";
import * as accountMessagesController from "../../controllers/user/messages.controller";
import { check } from "express-validator";
import { checkThereIsAnyError } from "../../middlewares/errors";
import { globalReg } from "../../utils/regex";
const router = express.Router();

router.get("/:conversationId", [
    check("limit")
    .isNumeric().withMessage("Invalid limit value")
    .notEmpty().withMessage("limit parameter is required")
    .isInt({max: 10, min: 0}).withMessage("Invalid limit value")
    ,
    check("offset")
    .isNumeric().withMessage("Invalid offset value")
    .notEmpty().withMessage("Offset parameter is required")
    .isInt({min: 0}).withMessage("Invalid offset value")
    ,
    check("conversationId")
    .isString().withMessage("Invalid input type")
    .notEmpty().withMessage("conversationId is required.")
    .matches(globalReg.conversationId).withMessage("Invalid conversationId"),
    checkThereIsAnyError
], accountMessagesController.showUserConversationMessages);

export default router;