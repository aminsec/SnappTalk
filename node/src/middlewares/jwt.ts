import * as jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { ProtectedUserInfo } from "../types/user.types";
import { DeadSession } from "../models/dead_sessions.model";
import { User } from "../models/users.model";

//A middleware to validate JWT token
export default async function validateJWT(req: Request, resp: Response, next: NextFunction){
  //Redirecting to /login if token is not found
  if(!req.cookies.token){
    resp.redirect("/login");
    return;
  }

  //Getting token from cookies
  const token = req.cookies.token;

  try {
    //Verifing token in try-catch. If token was not valid, it will go through an error and we handle it with catch
    const userInfo = jwt.verify(token, String(process.env.JWT_SECRET_KEY)) as ProtectedUserInfo;

    //Checking if token is not in dead_sessions list and account is in a valid state
    const isTokenIsInDeadSessions = await DeadSession.findOne({token: token}).lean();
    const isAccountValid = await User.findOne({_id: userInfo._id, deleted_account: false, verified: true}).lean();

    if(isTokenIsInDeadSessions || !isAccountValid){
        resp.redirect("/login");
        return;
    }

    req.userInfo = userInfo;
    next();

  } catch (error) {
    resp.redirect("/login");
  }
};



