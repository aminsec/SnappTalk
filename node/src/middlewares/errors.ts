import { showError } from "../utils/operations";
import { validationResult } from 'express-validator';
import { Request, Response, NextFunction } from "express";
import {ErrorResponse } from "../types/response.types";

export async function checkThereIsAnyError(req: Request, resp: Response, next: NextFunction) {
    //Checking if there is any error from middlewares
    const  errors  = validationResult(req); // This takes this -> req["express-validator#contexts"][1]["message"]

    if (!errors.isEmpty()){
        const errorMessage = errors.array()[0].msg;
        const error:ErrorResponse = {state: "failed", message: errorMessage, type: "input_error"}
        showError(error, resp);
        return;

    }else{
        next();
    }
};