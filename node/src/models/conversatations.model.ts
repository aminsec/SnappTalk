import mongoose, { Schema, Model, Types } from "mongoose";

export interface IConversation {
    type: "group" | "pv";
    group_name: string | null;
    group_avatar: string | null;
    members: Types.ObjectId[];
    last_message_id: Record<string, Types.ObjectId>;
    deleted_for: Record<string, Date>;
    created_at: Date;
}

const conversationSchema = new Schema<IConversation>({
    type: { type: String, enum: ["group", "pv"], required: true },
    group_name: { type: String, default: null },
    group_avatar: { type: String, default: null },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    last_message_id: { type: Schema.Types.Mixed, default: {} },
    deleted_for: { type: Schema.Types.Mixed, default: {} },
    created_at: { type: Date, default: Date.now }
});

export const Conversation: Model<IConversation> = mongoose.model<IConversation>("Conversation", conversationSchema);