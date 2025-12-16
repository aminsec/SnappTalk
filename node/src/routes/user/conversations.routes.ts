import express from "express";
import * as accountConversationsController from "../../controllers/user/conversations.controller";
const router = express.Router();

router.get("/", accountConversationsController.showUserConversations);

export default router;