export interface ProtectedUserInfo {
    id: string,
    email: string,
    username: string,
    profilePic: string,
    role: string,
    joinedAt: string,
    bio: string
};

export interface RawUserInfo {
    _id: string,
    email: string,
    username: string,
    password: string,
    profilePic: string,
    role: string,
    joinedAt: string,
    bio: string
};

export interface InsertUserInfo {
    email: string,
    username: string,
    password: string,
    profilePic: string,
    role: string,
    joinedAt: string,
    bio: string
};