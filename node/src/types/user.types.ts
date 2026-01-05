export interface ProtectedUserInfo {
    id: string,
    email: string,
    username: string,
    profile_pic: string,
    role: string,
    joined_at: string,
    bio: string,
    status: "online" | "offline"
};

export interface RawUserInfo {
    _id: string,
    email: string,
    username: string,
    password: string,
    profile_pic: string,
    role: string,
    joined_at: string,
    bio: string,
    status: "online" | "offline"
};

export interface InsertUserInfo {
    email: string,
    username: string,
    password: string,
    profile_pic: string,
    role: string,
    joined_at: string,
    bio: string,
    status: "online" | "offline"
};