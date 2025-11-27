import { Request, Response } from "express";
import { getUserContacts } from "../../services/contacts.services";
import { showError, sendResponse } from "../../utils/operations";

export async function showUserContacts(req: Request, resp: Response) {
    const { userInfo } = req;
    const [contacts, error] = await getUserContacts(userInfo);
    if(error){
        showError(error, resp);
        return;
    }

    const responseData = {state: "success", contacts: contacts};
    sendResponse(responseData, {}, 200, resp);
};