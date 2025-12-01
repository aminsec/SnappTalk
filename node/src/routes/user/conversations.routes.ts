import express from "express";
import * as accountContactsController from "../../controllers/user/conversations.controller";
const router = express.Router();

router.get("/conversations", accountContactsController.showUserConversations);

export default router;