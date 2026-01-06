import express from "express";
import * as accountConversationsController from "../../controllers/user/conversations.controller";
import { check } from "express-validator";
import { checkThereIsAnyError } from "../../middlewares/errors";
import { globalReg } from "../../utils/regex";
const router = express.Router();

router.get("/", accountConversationsController.showUserConversations);
router.delete("/:convId", [
    check("convId")
    .isString().withMessage("Invalid input type")
    .notEmpty().withMessage("Conversation id is required.")
    .matches(globalReg.conversationId).withMessage("Invalid conversation id value"),

    check("for")
    .isIn(["me", "all"]).withMessage("Invalid query parameter value"),
    checkThereIsAnyError
], accountConversationsController.deleteConversation);

export default router;