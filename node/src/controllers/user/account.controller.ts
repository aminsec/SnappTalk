import { getUserInfoById } from "../../services/account.services";
import { showError, sendResponse } from "../../utils/operations";
import { Request, Response } from "express";

export async function showUserInfo(req: Request, resp: Response) {
    const userid = req.userInfo.id;
    const [userInfo, error] = await getUserInfoById(userid);
    if(error){
        showError(error, resp);
        return;
    }

    const responseData = {state: "success", userInfo: userInfo};
    sendResponse(responseData, {}, 200, resp);
};

export async function updateUserInfo(req: Request, resp: Response) {
    const data = {state: "success", message: "Info updated"};
    sendResponse(data, {}, 200, resp);
};