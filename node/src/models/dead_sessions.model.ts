import mongoose, { Schema, Model } from "mongoose";
import { DBDeadSessionsType } from "../types/token.types";

const deadSessionSchema = new Schema<DBDeadSessionsType>({
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

export const DeadSession: Model<DBDeadSessionsType> = mongoose.model<DBDeadSessionsType>("DeadSession", deadSessionSchema);
