import mongoose, { Schema, Model } from "mongoose";

export interface IUser {
    email: string;
    username: string;
    password: string;
    profile_pic: string;
    role: string;
    joined_at: Date;
    bio: string;
    status: "online" | "offline";
    deleted_account: boolean;
}

const userSchema = new Schema<IUser>({
    email: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
    profile_pic: { type: String, required: true },
    role: { type: String, required: true },
    joined_at: { type: Date, required: true },
    bio: { type: String, default: "" },
    status: { type: String, enum: ["online", "offline"], default: "online" },
    deleted_account: { type: Boolean, default: false }
});

export const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);