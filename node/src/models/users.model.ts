import mongoose, { Schema, Model } from "mongoose";
import { DBUserType } from "../types/user.types";

const userSchema = new Schema<DBUserType>({
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

export const User: Model<DBUserType> = mongoose.model<DBUserType>("User", userSchema);