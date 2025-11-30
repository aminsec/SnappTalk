import express from "express";
import * as membersInfoController  from "../../controllers/members/info.controller";
const router = express.Router();

router.get("/:username/info", membersInfoController.showMemberInfo);

export default router;