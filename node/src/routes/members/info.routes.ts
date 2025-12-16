import express from "express";
import * as membersInfoController  from "../../controllers/members/info.controller";
import { check } from "express-validator";
import { globalReg } from "../../utils/regex";
import { checkThereIsAnyError } from "../../middlewares/errors";
const router = express.Router();

router.get("/:userid/info", [
    check("userid")
    .isString().withMessage("Invalid input type")
    .notEmpty().withMessage("userid is required.")
    .matches(globalReg.userid).withMessage("Invalid userid"),
    checkThereIsAnyError
],membersInfoController.showMemberInfo);

router.get("/:username/search", [
    check("username")
    .isString().withMessage("Invalid input type")
    .notEmpty().withMessage("username is required.")
    .matches(globalReg.username).withMessage("Invalid username"),
    checkThereIsAnyError
],membersInfoController.showSearchedMember);

export default router;