import { Types } from "mongoose";

export interface ProtectedUserInfo {
    id: string,
    email: string,
    username: string,
    profile_pic: string,
    role: string,
    joined_at: Date,
    bio: string,
    status: "online" | "offline"
};

export interface RawUserInfo {
    _id: Types.ObjectId,
    email: string,
    username: string,
    password: string,
    profile_pic: string,
    role: string,
    joined_at: Date,
    bio: string,
    status: "online" | "offline",
    deleted_account: Boolean
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
    deleted_account: boolean
};