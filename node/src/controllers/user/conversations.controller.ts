import { Request, Response } from "express";
import { getUserConversations } from "../../services/conversations.services";
import { showError, sendResponse } from "../../utils/operations";

export async function showUserConversations(req: Request, resp: Response) {
    const { userInfo } = req;
    const [conversations, error] = await getUserConversations(userInfo);
    if(error){
        showError(error, resp);
        return;
    }

    const responseData = {state: "success", conversations: conversations};
    sendResponse(responseData, {}, 200, resp);
};