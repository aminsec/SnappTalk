import { Request, Response } from "express";
import {ErrorResponse } from "../../types/response.types";

export async function showUserContacts(req: Request, resp: Response) {
    const [contacts, error] = await getUserContacts(req.userInfo.id);
}