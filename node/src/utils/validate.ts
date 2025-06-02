import { Error } from "../types/response.types";

export async function checkEmailIsValid(email: string): Promise<[true | false | null, Error | null]> {
    try {
        //Checking email is in correct format
        const emailCheckRegex = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$");

        if(emailCheckRegex.test(email)){
            return [true, null];

        }else{
            return [false, null];
        }

    } catch (error) {
        console.log(error);
        const err: Error = {message: "A system error occurred", state: "failed", type: "system_error"};
        return [null, err];
    }
};