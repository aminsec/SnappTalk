import { execSync } from "child_process";
import { getUserInfoById } from "../../services/user.services";
import { searchMemberByUsername } from "../../services/members.services";
import { sendResponse, showError } from "../../utils/operations";
import { Request, Response } from "express";

export async function showMemberInfo(req: Request, resp: Response) {
    const { userid } = req.params;
    const [memberInfo, error] = await getUserInfoById(userid);
    if(error){
        showError(error, resp);
        return;
    }

    const responseData = {state: "success", member_info: memberInfo};
    sendResponse(responseData, {}, 200, resp);
};

export async function showSearchedMember(req: Request, resp: Response) {
    const { username } = req.params;
    const [members, error] = await searchMemberByUsername(username);
    if(error){
        console.log(error, "qf02903f09wjef")
        showError(error, resp);
        return;
    }

    const responseData = {state: "success", members_info: members};
    sendResponse(responseData, {}, 200, resp);
};