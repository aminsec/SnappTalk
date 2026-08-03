import mongoose, { Schema, Model } from "mongoose";

export interface IDeadSession {
    token: string;
    createdAt: Date;
}

const deadSessionSchema = new Schema<IDeadSession>({
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

export const DeadSession: Model<IDeadSession> = mongoose.model<IDeadSession>("DeadSession", deadSessionSchema);
