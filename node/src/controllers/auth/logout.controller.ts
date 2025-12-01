import { Request, Response } from "express";
import { revokeToken } from "../../services/auth.services";
import { showError } from "../../utils/operations";

export async function handleLogout(req: Request, resp: Response) {
    const [ _ , error] = await revokeToken(req.cookies.token);
    if(error){
        showError(error, resp);
        return
    }

    resp.redirect("/login");
    resp.end();
};