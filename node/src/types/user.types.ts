import { Types } from "mongoose";

export interface ProtectedUserInfo {
    _id: Types.ObjectId,
    email: string,
    username: string,
    profile_pic: string,
    role: string,
    joined_at: Date,
    bio: string,
    status: "online" | "offline"
};

export interface RawUserInfo {
    _id: Types.ObjectId;
    email: string;
    username: string;
    password: string;
    profile_pic: string;
    role: string;
    joined_at: Date;
    bio: string;
    status: "online" | "offline";
    verified: boolean;
    deleted_account: boolean;
    email_verify_token: string;
    email_verify_token_expires_at: Date;
    email_verify_token_requested_at: Date;
    forgot_password_token: string;
    forgot_password_token_expires_at: Date;
    forgot_password_token_requested_at: Date;
};

export interface InsertUserInfo {
    email: string,
    username: string,
    password: string,
    profile_pic: string,
    role: string,
    joined_at: Date,
    bio: string,
    status: "online" | "offline",
    deleted_account: boolean,
    verified: boolean;
    email_verify_token: string;
    email_verify_token_expires_at: Date;
    email_verify_token_requested_at: Date;
};

export interface DBUserType {
    email: string;
    username: string;
    password: string;
    profile_pic: string;
    role: string;
    joined_at: Date;
    bio: string;
    status: "online" | "offline";
    verified: boolean;
    deleted_account: boolean;
    email_verify_token: string;
    email_verify_token_expires_at: Date;
    email_verify_token_requested_at: Date;
    forgot_password_token: string;
    forgot_password_token_expires_at: Date;
    forgot_password_token_requested_at: Date;
};
