import * as jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { ProtectedUserInfo } from "../types/user.types";
import { DeadSession } from "../models/dead_sessions.model";

//A middleware to validate JWT token
export default async function validateJWT(req: Request, resp: Response, next: NextFunction){
  //Redirecting to /login if token is not found
  if(!req.cookies.token){
    resp.redirect("/login");
    return;
  }

  //Getting token from cookies
  const token = req.cookies.token;

  //Checking if token is not in dead_sessions list
  const isTokenIsInDeadSessions = await DeadSession.findOne({token: token}).lean();
  if(isTokenIsInDeadSessions){
      resp.redirect("/login");
      return;
  }

  //Verifing token in try-catch. If token was not valid, it will go through an error and we handle it with catch
  try {
    const userInfo = jwt.verify(token, String(process.env.JWT_SECRET_KEY)) as ProtectedUserInfo;
    req.userInfo = userInfo;
    next();

  } catch (error) {
    resp.redirect("/login");
  }
};



