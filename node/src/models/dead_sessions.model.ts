import mongoose, { Schema, Model } from "mongoose";
import { DBDeadSessionsType } from "../types/token.types";

const deadSessionSchema = new Schema<DBDeadSessionsType>({
    token: {
        type: String,
        required: true
    },

    created_at: {
        type: Date,
        default: Date.now
    }
});

// Simple lookup by token
deadSessionSchema.index({
    token: 1
});

// Delete sessions 24 hours after createdAt
deadSessionSchema.index(
    { created_at: 1 },
    {
        expireAfterSeconds: 60 * 60 * 24
    }
);

export const DeadSession: Model<DBDeadSessionsType> = mongoose.model<DBDeadSessionsType>("dead_sessions", deadSessionSchema);