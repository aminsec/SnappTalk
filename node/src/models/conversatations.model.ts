import mongoose, { Schema, Model } from "mongoose";
import { DBConversationType } from "../types/conversation.types";

const conversationSchema = new Schema<DBConversationType>({
    type: { type: String, enum: ["group", "pv"], required: true },
    group_name: { type: String, default: null },
    group_avatar: { type: String, default: null },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    last_message_id: { type: Schema.Types.Mixed, default: {} },
    deleted_for: { type: Schema.Types.Mixed, default: {} },
    created_at: { type: Date, default: Date.now }
});

export const Conversation: Model<DBConversationType> = mongoose.model<DBConversationType>("Conversation", conversationSchema);