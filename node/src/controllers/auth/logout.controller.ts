import { Request, Response } from "express";
import { checkUserExistsByEmail, checkCredentials, getUserInfoByEmail, createUser, revokeToken } from "../../services/auth.services";
import { showError, sendResponse, generateJWTToken } from "../../utils/operations";
import { ProtectedUserInfo } from "../../types/user.types";
import {ErrorResponse, Resp } from "../../types/response.types";

export async function handleLogout(req: Request, resp: Response) {
    const [ _ , error] = await revokeToken(req.cookies.token);
    if(error){
        showError(error, resp);
        return
    }

    resp.redirect("/login");
    resp.end();
};