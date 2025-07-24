export interface Error {
    state: string
    message: string,
    type: "not_found" | "system_error" | "creds_error" | "access_denied" | "input_error",
};

export interface Resp {
    state: string,
    message?: any,
    userInfo?: any
};