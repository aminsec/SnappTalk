import { execSync } from "child_process";
import { getUserInfoById } from "../../services/user.services";
import { searchMemberByUsername } from "../../services/members.services";
import { sendResponse, showError } from "../../utils/operations";
import { Request, Response } from "express";
import { ObjectId } from "mongodb";

export async function showMemberInfo(req: Request, resp: Response) {
    const { userid } = req.params;
    const [memberInfo, error] = await getUserInfoById(new ObjectId(userid));
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
        console.log(error)
        showError(error, resp);
        return;
    }

    const responseData = {state: "success", members_info: members};
    sendResponse(responseData, {}, 200, resp);
};