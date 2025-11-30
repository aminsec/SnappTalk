import { getUserInfoByUsername } from "../../services/info.services";
import { sendResponse, showError } from "../../utils/operations";
import { Request, Response } from "express";

export async function showMemberInfo(req: Request, resp: Response) {
    const { username } = req.params;
    const [memberInfo, error] = await getUserInfoByUsername(username);
    if(error){
        showError(error, resp);
        return;
    }

    const responseData = {state: "success", userInfo: memberInfo};
    sendResponse(responseData, {}, 200, resp);
};